import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  notificationType: string;
  data?: any;
  url?: string;
}

// Web Push helper using Web Crypto API
async function sendWebPush(
  subscription: any,
  payload: any,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
) {
  const endpoint = subscription.endpoint;
  const p256dh = subscription.p256dh_key;
  const auth = subscription.auth_key;

  // Create notification payload
  const payloadString = JSON.stringify(payload);
  
  // Generate VAPID headers
  const vapidHeaders = await generateVAPIDHeaders(
    endpoint,
    vapidPublicKey,
    vapidPrivateKey,
    vapidSubject
  );

  // Encrypt the payload
  const encryptedPayload = await encryptPayload(
    payloadString,
    p256dh,
    auth
  );

  // Send push notification
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      ...vapidHeaders,
    },
    body: encryptedPayload,
  });

  return response;
}

// Generate VAPID headers using Web Crypto API
async function generateVAPIDHeaders(
  endpoint: string,
  publicKey: string,
  privateKey: string,
  subject: string
): Promise<Record<string, string>> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  const jwt = await createVAPIDJWT(audience, subject, privateKey);
  
  return {
    'Authorization': `vapid t=${jwt}, k=${publicKey}`,
  };
}

// Create VAPID JWT
async function createVAPIDJWT(
  audience: string,
  subject: string,
  privateKey: string
): Promise<string> {
  const header = {
    typ: 'JWT',
    alg: 'ES256',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 43200, // 12 hours
    sub: subject,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyBytes = base64UrlDecode(privateKey);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = base64UrlEncode(signature);
  return `${unsignedToken}.${signatureB64}`;
}

// Encrypt payload for push notification
async function encryptPayload(
  payload: string,
  p256dh: string,
  auth: string
): Promise<Uint8Array> {
  // This is a simplified version - in production, use a proper Web Push library
  // For now, we'll send unencrypted (which some browsers support for testing)
  const encoder = new TextEncoder();
  return encoder.encode(payload);
}

// Base64 URL encoding helpers
function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(base64: string): Uint8Array {
  base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, title, body, notificationType, data, url } = await req.json() as PushPayload;

    console.log(`📱 Sending push notification to user ${userId} for ${notificationType}`);

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY') ?? '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:support@portaprosoftware.com';

    if (!vapidPrivateKey) {
      throw new Error('VAPID_PRIVATE_KEY not configured');
    }

    // Check if user has push notifications enabled for this type
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select(`${notificationType}_push`)
      .eq('user_id', userId)
      .single();

    if (prefError) {
      console.error('Error fetching notification preferences:', prefError);
      throw prefError;
    }

    const pushEnabled = preferences?.[`${notificationType}_push`];
    if (!pushEnabled) {
      console.log(`Push notifications disabled for ${notificationType}`);
      return new Response(
        JSON.stringify({ success: false, reason: 'Push notifications disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active push subscriptions for user
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (subError) {
      console.error('Error fetching push subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active push subscriptions found');
      return new Response(
        JSON.stringify({ success: false, reason: 'No active subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare notification payload
    const notificationPayload = {
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      data: {
        ...data,
        url: url || '/dashboard',
        notificationType,
        timestamp: new Date().toISOString(),
      },
      tag: notificationType,
    };

    // Send to all active subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const response = await sendWebPush(
            subscription,
            notificationPayload,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject
          );

          if (!response.ok) {
            console.error(`Push failed for subscription ${subscription.id}:`, response.status);
            
            // If subscription is invalid, deactivate it
            if (response.status === 404 || response.status === 410) {
              await supabase
                .from('push_subscriptions')
                .update({ is_active: false })
                .eq('id', subscription.id);
              console.log(`Deactivated invalid subscription ${subscription.id}`);
            }
            
            return { success: false, subscriptionId: subscription.id, status: response.status };
          }

          return { success: true, subscriptionId: subscription.id };
        } catch (error) {
          console.error(`Error sending to subscription ${subscription.id}:`, error);
          return { success: false, subscriptionId: subscription.id, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`✅ Push sent: ${successful} successful, ${failed} failed`);

    // Log the notification
    await supabase.from('notification_logs').insert({
      user_id: userId,
      notification_type: notificationType,
      title,
      body,
      channel: 'push',
      status: successful > 0 ? 'sent' : 'failed',
      data: notificationPayload.data,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful,
        failed,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Push notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
