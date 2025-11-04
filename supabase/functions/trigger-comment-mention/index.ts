import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommentMentionRequest {
  mentionedUserId: string;
  mentionedByUserId: string;
  mentionedByUserName: string;
  commentText: string;
  entityType: 'job' | 'maintenance' | 'invoice' | 'quote' | 'vehicle' | 'asset';
  entityId: string;
  entityReference?: string;
  linkUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: CommentMentionRequest = await req.json();
    console.log('[Comment Mention] Processing notification:', payload);

    // Truncate comment if too long
    const maxCommentLength = 200;
    const displayComment = payload.commentText.length > maxCommentLength
      ? payload.commentText.substring(0, maxCommentLength) + '...'
      : payload.commentText;

    // Entity type display names
    const entityTypeNames: Record<string, string> = {
      job: 'Job',
      maintenance: 'Maintenance Record',
      invoice: 'Invoice',
      quote: 'Quote',
      vehicle: 'Vehicle',
      asset: 'Asset'
    };

    const subject = `💬 ${payload.mentionedByUserName} mentioned you in a comment`;
    const emailContent = `
      <h2 style="color: #8b5cf6; margin-bottom: 16px;">You Were Mentioned</h2>
      <p><strong>${payload.mentionedByUserName}</strong> mentioned you in a comment${payload.entityReference ? ` on ${entityTypeNames[payload.entityType]} ${payload.entityReference}` : ''}.</p>
      
      <div style="margin: 20px 0; padding: 20px; background: #faf5ff; border-left: 4px solid #8b5cf6; border-radius: 8px;">
        <p style="margin: 0; color: #374151; font-style: italic;">"${displayComment}"</p>
      </div>

      <div style="margin: 20px 0;">
        <p style="margin: 0;"><strong>Context:</strong></p>
        <p style="margin: 4px 0 0 0; color: #6b7280;">
          ${entityTypeNames[payload.entityType]}${payload.entityReference ? `: ${payload.entityReference}` : ''}
        </p>
      </div>

      ${payload.linkUrl ? `
        <a href="${payload.linkUrl}" style="display: inline-block; padding: 12px 24px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px;">
          View Comment
        </a>
      ` : ''}

      <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Click the link above to view the full conversation and respond.
        </p>
      </div>
    `;

    // Send email notification
    await supabase.functions.invoke('send-notification-email', {
      body: {
        userId: payload.mentionedUserId,
        subject,
        content: emailContent,
        priority: 'normal'
      }
    });

    // Send push notification
    await supabase.functions.invoke('send-push-notification', {
      body: {
        userId: payload.mentionedUserId,
        title: subject,
        body: displayComment,
        data: {
          type: 'comment_mention',
          entityType: payload.entityType,
          entityId: payload.entityId,
          mentionedByUserId: payload.mentionedByUserId,
          linkUrl: payload.linkUrl
        }
      }
    });

    console.log('[Comment Mention] Notifications sent successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[Comment Mention] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
};

serve(handler);
