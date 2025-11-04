import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssetMovementRequest {
  assetId: string;
  assetName: string;
  assetSku?: string;
  movementType: 'deployed' | 'returned' | 'transferred' | 'relocated';
  fromLocation?: string;
  toLocation?: string;
  jobNumber?: string;
  driverId?: string;
  quantity?: number;
  notifyUserIds: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: AssetMovementRequest = await req.json();
    console.log('[Asset Movement] Processing notification:', payload);

    // Construct content based on movement type
    let subject = '';
    let emailContent = '';
    let iconColor = '#0284c7';

    switch (payload.movementType) {
      case 'deployed':
        subject = `📦 Asset Deployed: ${payload.assetName}`;
        iconColor = '#059669';
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Asset Deployed</h2>
          <p>The following asset has been deployed.</p>
          <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Asset:</strong> ${payload.assetName}</p>
            ${payload.assetSku ? `<p style="margin: 8px 0 0 0;"><strong>SKU:</strong> ${payload.assetSku}</p>` : ''}
            ${payload.quantity ? `<p style="margin: 8px 0 0 0;"><strong>Quantity:</strong> ${payload.quantity}</p>` : ''}
            ${payload.toLocation ? `<p style="margin: 8px 0 0 0;"><strong>Location:</strong> ${payload.toLocation}</p>` : ''}
            ${payload.jobNumber ? `<p style="margin: 8px 0 0 0;"><strong>Job:</strong> ${payload.jobNumber}</p>` : ''}
          </div>
        `;
        break;
      case 'returned':
        subject = `↩️ Asset Returned: ${payload.assetName}`;
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Asset Returned</h2>
          <p>The following asset has been returned to inventory.</p>
          <div style="margin: 20px 0; padding: 20px; background: #eff6ff; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Asset:</strong> ${payload.assetName}</p>
            ${payload.assetSku ? `<p style="margin: 8px 0 0 0;"><strong>SKU:</strong> ${payload.assetSku}</p>` : ''}
            ${payload.quantity ? `<p style="margin: 8px 0 0 0;"><strong>Quantity:</strong> ${payload.quantity}</p>` : ''}
            ${payload.fromLocation ? `<p style="margin: 8px 0 0 0;"><strong>From:</strong> ${payload.fromLocation}</p>` : ''}
            ${payload.toLocation ? `<p style="margin: 8px 0 0 0;"><strong>To:</strong> ${payload.toLocation}</p>` : ''}
          </div>
        `;
        break;
      case 'transferred':
        subject = `🔄 Asset Transfer: ${payload.assetName}`;
        iconColor = '#f59e0b';
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Asset Transfer</h2>
          <p>The following asset has been transferred.</p>
          <div style="margin: 20px 0; padding: 20px; background: #fffbeb; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Asset:</strong> ${payload.assetName}</p>
            ${payload.assetSku ? `<p style="margin: 8px 0 0 0;"><strong>SKU:</strong> ${payload.assetSku}</p>` : ''}
            ${payload.quantity ? `<p style="margin: 8px 0 0 0;"><strong>Quantity:</strong> ${payload.quantity}</p>` : ''}
            ${payload.fromLocation ? `<p style="margin: 8px 0 0 0;"><strong>From:</strong> ${payload.fromLocation}</p>` : ''}
            ${payload.toLocation ? `<p style="margin: 8px 0 0 0;"><strong>To:</strong> ${payload.toLocation}</p>` : ''}
          </div>
        `;
        break;
      case 'relocated':
        subject = `📍 Asset Relocated: ${payload.assetName}`;
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Asset Relocated</h2>
          <p>The following asset has been moved to a new location.</p>
          <div style="margin: 20px 0; padding: 20px; background: #eff6ff; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Asset:</strong> ${payload.assetName}</p>
            ${payload.assetSku ? `<p style="margin: 8px 0 0 0;"><strong>SKU:</strong> ${payload.assetSku}</p>` : ''}
            ${payload.fromLocation ? `<p style="margin: 8px 0 0 0;"><strong>From:</strong> ${payload.fromLocation}</p>` : ''}
            ${payload.toLocation ? `<p style="margin: 8px 0 0 0;"><strong>To:</strong> ${payload.toLocation}</p>` : ''}
          </div>
        `;
        break;
    }

    emailContent += `
      <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Track all asset movements in the inventory management system.
        </p>
      </div>
    `;

    // Send notifications to all specified users
    for (const userId of payload.notifyUserIds) {
      await supabase.functions.invoke('send-notification-email', {
        body: {
          userId,
          subject,
          content: emailContent,
          priority: 'normal'
        }
      });

      await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          title: subject,
          body: `${payload.toLocation || 'Location updated'}${payload.quantity ? ` - Qty: ${payload.quantity}` : ''}`,
          data: {
            type: 'asset_movement',
            assetId: payload.assetId,
            movementType: payload.movementType
          }
        }
      });
    }

    console.log('[Asset Movement] Notifications sent successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[Asset Movement] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
};

serve(handler);
