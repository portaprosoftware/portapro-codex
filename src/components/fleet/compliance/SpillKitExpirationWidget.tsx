import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { Link } from "react-router-dom";

export function SpillKitExpirationWidget() {
  const { data: expirationSummary, isLoading } = useQuery({
    queryKey: ["spill-kit-expiration-summary"],
    queryFn: async () => {
      const { data: checks, error } = await supabase
        .from("vehicle_spill_kit_checks")
        .select(`
          id,
          vehicle_id,
          has_kit,
          item_conditions,
          created_at
        `)
        .eq("has_kit", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const today = new Date();
      let expired = 0;
      let expiringSoon = 0;
      let ok = 0;

      // Track latest expiration per vehicle-item
      const latestExpirations = new Map<string, any>();

      checks?.forEach((check) => {
        const conditions = check.item_conditions as any;
        if (!conditions) return;

        Object.entries(conditions).forEach(([itemId, condition]: [string, any]) => {
          if (condition.expiration_date) {
            const key = `${check.vehicle_id}-${condition.item_name || itemId}`;
            const existing = latestExpirations.get(key);
            
            if (!existing || new Date(check.created_at) > new Date(existing.created_at)) {
              latestExpirations.set(key, {
                expiration_date: condition.expiration_date,
                created_at: check.created_at
              });
            }
          }
        });
      });

      // Count by status
      latestExpirations.forEach((item) => {
        const expiryDate = parseISO(item.expiration_date);
        const daysUntilExpiry = differenceInDays(expiryDate, today);

        if (daysUntilExpiry < 0) expired++;
        else if (daysUntilExpiry <= 30) expiringSoon++;
        else ok++;
      });

      return { expired, expiringSoon, ok, total: expired + expiringSoon + ok };
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading || !expirationSummary) {
    return null;
  }

  // Only show widget if there are items to track
  if (expirationSummary.total === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Spill Kit Expirations</h3>
          <p className="text-sm text-muted-foreground">Tracked item status</p>
        </div>
        <Link to="/fleet/compliance">
          <Button variant="ghost" size="sm">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {/* Expired Items */}
        {expirationSummary.expired > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-red-900">Expired Items</p>
                <p className="text-sm text-red-700">Require immediate replacement</p>
              </div>
            </div>
            <Badge variant="destructive" className="text-lg font-bold px-3 py-1">
              {expirationSummary.expired}
            </Badge>
          </div>
        )}

        {/* Expiring Soon */}
        {expirationSummary.expiringSoon > 0 && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-900">Expiring Soon</p>
                <p className="text-sm text-yellow-700">Within 30 days</p>
              </div>
            </div>
            <Badge className="bg-yellow-600 text-white text-lg font-bold px-3 py-1">
              {expirationSummary.expiringSoon}
            </Badge>
          </div>
        )}

        {/* OK Items */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">Items OK</p>
              <p className="text-sm text-green-700">More than 30 days remaining</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
            {expirationSummary.ok}
          </Badge>
        </div>
      </div>

      {/* Alert message if there are critical items */}
      {(expirationSummary.expired > 0 || expirationSummary.expiringSoon > 0) && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Action Required:</strong> Review expiring items and schedule replacements to maintain compliance.
          </p>
        </div>
      )}
    </Card>
  );
}
