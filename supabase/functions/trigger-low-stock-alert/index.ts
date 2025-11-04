import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LowStockAlertRequest {
  itemId: string;
  userIds: string[]; // Inventory managers + procurement team
  itemName: string;
  itemSku?: string;
  currentQuantity: number;
  threshold: number;
  unitsDeployed?: number;
  suggestedReorderQty?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      itemId,
      userIds,
      itemName,
      itemSku,
      currentQuantity,
      threshold,
      unitsDeployed,
      suggestedReorderQty
    }: LowStockAlertRequest = await req.json();

    console.log('Processing low stock alert notification:', { itemId, itemName, currentQuantity, threshold, userIds });

    if (!itemId || !userIds || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: itemId and userIds' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const severity = currentQuantity === 0 ? 'critical' : currentQuantity < threshold / 2 ? 'high' : 'medium';
    const severityColor = severity === 'critical' ? '#ef4444' : severity === 'high' ? '#f59e0b' : '#667eea';
    const severityLabel = severity === 'critical' ? 'OUT OF STOCK' : severity === 'high' ? 'CRITICALLY LOW' : 'LOW STOCK';

    const emailSubject = `${severityLabel}: ${itemName}`;

    // Calculate stock percentage
    const stockPercentage = threshold > 0 ? Math.max(0, (currentQuantity / threshold) * 100) : 0;

    // Generate email content
    const emailContent = `
      <h2 style="color: ${severityColor}">${currentQuantity === 0 ? 'Out of Stock Alert' : 'Low Stock Alert'}</h2>
      <p>Inventory levels are ${currentQuantity === 0 ? '<strong style="color: #ef4444;">depleted</strong>' : 'below threshold'}:</p>
      
      <div class="info-box" style="border-left-color: ${severityColor}">
        <p><strong>Item:</strong> ${itemName}</p>
        ${itemSku ? `<p><strong>SKU:</strong> ${itemSku}</p>` : ''}
        <p><strong>Current Stock:</strong> <span style="color: ${severityColor}; font-weight: bold;">${currentQuantity} units</span></p>
        <p><strong>Threshold:</strong> ${threshold} units</p>
        
        <div style="margin: 15px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
            <span style="font-size: 12px; font-weight: 600;">Stock Level</span>
            <span style="font-size: 12px; font-weight: 600; color: ${severityColor};">${stockPercentage.toFixed(0)}%</span>
          </div>
          <div style="background-color: #e5e7eb; border-radius: 4px; height: 12px;">
            <div style="background: ${severityColor}; height: 12px; border-radius: 4px; width: ${stockPercentage}%; transition: width 0.3s;"></div>
          </div>
        </div>
        
        ${unitsDeployed ? `<p><strong>Units Deployed:</strong> ${unitsDeployed}</p>` : ''}
        ${suggestedReorderQty ? `
          <div style="background-color: #f0fdf4; border: 2px solid #10b981; padding: 12px; margin-top: 10px; border-radius: 6px;">
            <p style="margin: 0; color: #047857;"><strong>💡 Suggested Reorder:</strong> ${suggestedReorderQty} units</p>
          </div>
        ` : ''}
      </div>
      
      ${currentQuantity === 0 ? `
        <div style="background-color: #fee; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 0; color: #991b1b;"><strong>⚠️ Critical Action Required:</strong> This item is completely out of stock. Order immediately to prevent service disruptions.</p>
        </div>
      ` : severity === 'high' ? `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400e;"><strong>⚠️ Warning:</strong> Stock is critically low. Place an order within 24-48 hours.</p>
        </div>
      ` : ''}
      
      <p style="text-align: center;">
        <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/inventory/${itemId}" class="button" style="background: ${severityColor}">Reorder Now</a>
      </p>
    `;

    const results = {
      sent: 0,
      failed: 0,
      emails: [] as any[],
      pushes: [] as any[]
    };

    // Send notifications to all specified users
    for (const userId of userIds) {
      // Send email notification
      const emailResult = await supabase.functions.invoke('send-notification-email', {
        body: {
          userId: userId,
          notificationType: 'low_stock_alerts',
          subject: emailSubject,
          htmlContent: emailContent,
          data: {
            itemId,
            itemName,
            itemSku,
            currentQuantity,
            threshold,
            severity,
            unitsDeployed,
            suggestedReorderQty,
          }
        }
      });

      if (emailResult.error) {
        console.error(`Error sending email to user ${userId}:`, emailResult.error);
        results.failed++;
      } else {
        console.log(`Email notification sent to user ${userId}:`, emailResult.data);
        results.sent++;
        results.emails.push(emailResult.data);
      }

      // Send push notification
      const pushResult = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: userId,
          title: `${severityLabel}: ${itemName}`,
          body: `Only ${currentQuantity} units remaining (threshold: ${threshold})`,
          notificationType: 'low_stock_alerts',
          url: `/inventory/${itemId}`,
          data: {
            itemId,
            itemName,
            currentQuantity,
            threshold,
            severity,
          }
        }
      });

      if (pushResult.error) {
        console.error(`Error sending push to user ${userId}:`, pushResult.error);
      } else {
        console.log(`Push notification sent to user ${userId}:`, pushResult.data);
        results.pushes.push(pushResult.data);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Low stock alert notifications sent to ${results.sent} users`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in trigger-low-stock-alert function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
