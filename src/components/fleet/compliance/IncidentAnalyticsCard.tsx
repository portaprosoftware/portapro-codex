import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

export const IncidentAnalyticsCard: React.FC = () => {
  const { data: analytics } = useQuery({
    queryKey: ["incident-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incident_analytics")
        .select("*")
        .order("period", { ascending: false })
        .limit(6);

      if (error) throw error;
      
      // Format data for chart
      return data.map((item) => ({
        month: new Date(item.period).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        Minor: item.minor_incidents,
        Moderate: item.moderate_incidents,
        Major: item.major_incidents,
        Reportable: item.reportable_incidents,
      })).reverse();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Incident Trends (Last 6 Months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {analytics && analytics.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Minor" fill="#22c55e" />
              <Bar dataKey="Moderate" fill="#eab308" />
              <Bar dataKey="Major" fill="#f97316" />
              <Bar dataKey="Reportable" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No analytics data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};