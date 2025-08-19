import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History, TrendingUp, DollarSign, Clock, ChevronRight } from "lucide-react";
import { MaintenanceHistoryModal } from "./MaintenanceHistoryModal";

interface MaintenanceHistorySectionProps {
  productId: string;
}

interface CompletedSession {
  id: string;
  item_id: string;
  item_code: string;
  session_number: number;
  started_at: string;
  completed_at: string;
  total_cost: number;
  total_labor_hours: number;
  session_summary: string;
  primary_technician: string;
  product_name: string;
}

export const MaintenanceHistorySection: React.FC<MaintenanceHistorySectionProps> = ({ productId }) => {
  const [selectedItem, setSelectedItem] = useState<{ id: string; code: string } | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Fetch completed maintenance sessions
  const { data: completedSessions, isLoading } = useQuery<CompletedSession[]>({
    queryKey: ["completed-maintenance-sessions", productId],
    queryFn: async () => {
      let query = supabase
        .from("maintenance_sessions")
        .select(`
          *,
          product_items!inner(item_code, products(name))
        `)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(10);

      if (productId !== "all") {
        query = query.eq("product_items.product_id", productId);
      }

      const { data, error } = await (query as any);
      if (error) throw error;

      return (data || []).map((session: any) => ({
        id: session.id,
        item_id: session.item_id,
        item_code: session.product_items.item_code,
        session_number: session.session_number,
        started_at: session.started_at,
        completed_at: session.completed_at,
        total_cost: session.total_cost || 0,
        total_labor_hours: session.total_labor_hours || 0,
        session_summary: session.session_summary,
        primary_technician: session.primary_technician,
        product_name: session.product_items.products?.name || "Unknown Product",
      }));
    },
  });

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!completedSessions) return { totalSessions: 0, totalCost: 0, avgDuration: 0 };

    const totalSessions = completedSessions.length;
    const totalCost = completedSessions.reduce((sum, session) => sum + session.total_cost, 0);
    
    const avgDuration = completedSessions.reduce((sum, session) => {
      const days = Math.ceil(
        (new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0) / totalSessions;

    return { totalSessions, totalCost, avgDuration: Math.round(avgDuration) };
  }, [completedSessions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewHistory = (itemId: string, itemCode: string) => {
    setSelectedItem({ id: itemId, code: itemCode });
    setHistoryModalOpen(true);
  };

  if (isLoading) {
    return <div className="p-4">Loading maintenance history...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <History className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Maintenance History</h3>
            <p className="text-sm text-gray-600">
              Recently completed maintenance sessions and trends
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <div>
            <div className="text-xs text-gray-600">Completed Sessions</div>
            <div className="text-lg font-semibold">{stats.totalSessions}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
          <DollarSign className="w-5 h-5 text-green-600" />
          <div>
            <div className="text-xs text-gray-600">Total Cost</div>
            <div className="text-lg font-semibold">{formatCurrency(stats.totalCost)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
          <Clock className="w-5 h-5 text-orange-600" />
          <div>
            <div className="text-xs text-gray-600">Avg Duration</div>
            <div className="text-lg font-semibold">{stats.avgDuration} days</div>
          </div>
        </div>
      </div>

      {/* Recent Sessions List */}
      <div>
        <h4 className="font-medium text-gray-900 mb-4">Recent Completed Sessions</h4>
        {completedSessions && completedSessions.length > 0 ? (
          <div className="space-y-3">
            {completedSessions.map((session) => {
              const duration = Math.ceil(
                (new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-blue-600">{session.item_code}</span>
                        <Badge variant="outline" className="text-xs">
                          Session #{session.session_number}
                        </Badge>
                        {productId === "all" && (
                          <Badge variant="secondary" className="text-xs">
                            {session.product_name}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {session.session_summary || "No summary provided"}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>Completed: {formatDate(session.completed_at)}</span>
                        <span>Duration: {duration} day{duration !== 1 ? 's' : ''}</span>
                        <span>Cost: {formatCurrency(session.total_cost)}</span>
                        {session.primary_technician && (
                          <span>Tech: {session.primary_technician}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewHistory(session.item_id, session.item_code)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View History
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No completed maintenance sessions yet.</p>
          </div>
        )}
      </div>

      {/* History Modal */}
      {selectedItem && (
        <MaintenanceHistoryModal
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedItem(null);
          }}
          itemId={selectedItem.id}
          itemCode={selectedItem.code}
        />
      )}
    </div>
  );
};