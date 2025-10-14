import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History, ChevronRight, Download, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { MaintenanceHistoryModal } from "./MaintenanceHistoryModal";
import { MaintenanceHistoryFilters, type MaintenanceFilters } from "./MaintenanceHistoryFilters";
import { MaintenanceStatsAdvanced } from "./MaintenanceStatsAdvanced";
import { ReturnedToServiceSection } from "./ReturnedToServiceSection";
import { RetiredUnitsSection } from "./RetiredUnitsSection";
import { MaintenanceExportDialog } from "./MaintenanceExportDialog";

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
  initial_condition: string;
  final_condition: string;
  product_id: string;
}

export const MaintenanceHistorySection: React.FC<MaintenanceHistorySectionProps> = ({ productId }) => {
  const [selectedItem, setSelectedItem] = useState<{ id: string; code: string } | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  const [filters, setFilters] = useState<MaintenanceFilters>({
    dateRange: { from: undefined, to: undefined },
    productType: "all",
    technician: "all",
    costMin: "",
    costMax: "",
    outcome: "all",
    searchTerm: "",
  });

  // Calculate YTD start date (January 1 of current year)
  const ytdStartDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1); // January 1 of current year
  }, []);

  // Fetch all completed maintenance sessions (YTD)
  const { data: allSessions, isLoading } = useQuery<CompletedSession[]>({
    queryKey: ["all-completed-maintenance-sessions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("maintenance_sessions")
        .select(`
          *,
          product_items!inner(item_code, product_id, status, products(name))
        `)
        .eq("status", "completed")
        .gte("completed_at", ytdStartDate.toISOString())
        .order("completed_at", { ascending: false });

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
        initial_condition: session.initial_condition,
        final_condition: session.final_condition,
        product_id: session.product_items.product_id,
      }));
    },
  });

  // Fetch product types for filters
  const { data: products } = useQuery({
    queryKey: ["products-for-filters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch product items to determine outcomes
  const { data: productItems } = useQuery({
    queryKey: ["product-items-for-outcomes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_items")
        .select("id, item_code, status, total_maintenance_cost");
      if (error) throw error;
      return data || [];
    },
  });

  // Apply filters
  const filteredSessions = useMemo(() => {
    if (!allSessions) return [];

    let filtered = allSessions;

    // Product filter
    if (productId !== "all") {
      filtered = filtered.filter((s) => s.product_id === productId);
    }
    if (filters.productType !== "all") {
      filtered = filtered.filter((s) => s.product_id === filters.productType);
    }

    // Date range filter
    if (filters.dateRange.from) {
      filtered = filtered.filter(
        (s) => new Date(s.completed_at) >= filters.dateRange.from!
      );
    }
    if (filters.dateRange.to) {
      filtered = filtered.filter(
        (s) => new Date(s.completed_at) <= filters.dateRange.to!
      );
    }

    // Technician filter
    if (filters.technician !== "all") {
      filtered = filtered.filter((s) => s.primary_technician === filters.technician);
    }

    // Cost range filter
    if (filters.costMin) {
      filtered = filtered.filter((s) => s.total_cost >= parseFloat(filters.costMin));
    }
    if (filters.costMax) {
      filtered = filtered.filter((s) => s.total_cost <= parseFloat(filters.costMax));
    }

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.item_code.toLowerCase().includes(term) ||
          s.session_summary?.toLowerCase().includes(term) ||
          s.primary_technician?.toLowerCase().includes(term)
      );
    }

    // Outcome filter
    if (filters.outcome !== "all" && productItems) {
      filtered = filtered.filter((s) => {
        const item = productItems.find((i) => i.id === s.item_id);
        if (filters.outcome === "returned") {
          return item && ["available", "assigned", "in_service"].includes(item.status);
        } else if (filters.outcome === "retired") {
          return item && item.status === "retired";
        }
        return true;
      });
    }

    return filtered;
  }, [allSessions, productId, filters, productItems]);

  // Pagination
  const paginatedSessions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredSessions.length / pageSize);

  // Get unique technicians for filter
  const technicians = useMemo(() => {
    if (!allSessions) return [];
    const unique = new Set(allSessions.map((s) => s.primary_technician).filter(Boolean));
    return Array.from(unique) as string[];
  }, [allSessions]);

  // Calculate advanced statistics (YTD data only)
  const advancedStats = useMemo(() => {
    if (!allSessions || !productItems) {
      return {
        totalSessions: 0,
        totalCost: 0,
        avgDuration: 0,
        returnedToService: 0,
        retired: 0,
        completionRate: 0,
        costByProductType: [],
        topTechnicians: [],
        monthlyTrends: [],
      };
    }

    // Use YTD sessions for stats (not filtered sessions)
    const ytdSessions = allSessions;

    const totalSessions = ytdSessions.length;
    const totalCost = ytdSessions.reduce((sum, s) => sum + s.total_cost, 0);

    const avgDuration =
      ytdSessions.reduce((sum, s) => {
        const days = Math.ceil(
          (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0) / totalSessions || 0;

    // Count units returned to service (YTD) - those with status available/in_service/assigned
    const returnedToService = productItems.filter((item) => {
      return ["available", "assigned", "in_service"].includes(item.status) &&
        ytdSessions.some((s) => s.item_id === item.id);
    }).length;

    // Count retired units (YTD) - those with status retired
    const retired = productItems.filter((item) => {
      return item.status === "retired" &&
        ytdSessions.some((s) => s.item_id === item.id);
    }).length;

    const completionRate = totalSessions > 0 ? Math.round((returnedToService / totalSessions) * 100) : 0;

    // Cost by product type
    const costByProduct: Record<string, number> = {};
    ytdSessions.forEach((s) => {
      costByProduct[s.product_name] = (costByProduct[s.product_name] || 0) + s.total_cost;
    });
    const costByProductType = Object.entries(costByProduct)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost);

    // Top technicians
    const techStats: Record<string, { sessions: number; totalCost: number }> = {};
    ytdSessions.forEach((s) => {
      if (s.primary_technician) {
        if (!techStats[s.primary_technician]) {
          techStats[s.primary_technician] = { sessions: 0, totalCost: 0 };
        }
        techStats[s.primary_technician].sessions++;
        techStats[s.primary_technician].totalCost += s.total_cost;
      }
    });
    const topTechnicians = Object.entries(techStats)
      .map(([name, stats]) => ({
        name,
        sessions: stats.sessions,
        avgCost: stats.totalCost / stats.sessions,
      }))
      .sort((a, b) => b.sessions - a.sessions);

    return {
      totalSessions,
      totalCost,
      avgDuration: Math.round(avgDuration),
      returnedToService,
      retired,
      completionRate,
      costByProductType,
      topTechnicians,
      monthlyTrends: [],
    };
  }, [allSessions, productItems]);

  // Get returned and retired units
  const returnedUnits = useMemo(() => {
    if (!filteredSessions || !productItems) return [];

    return filteredSessions
      .filter((s) => {
        const item = productItems.find((i) => i.id === s.item_id);
        return item && ["available", "assigned", "in_service"].includes(item.status);
      })
      .map((s) => {
        const duration = Math.ceil(
          (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        // Check if unit returned to maintenance (has more sessions after this one)
        const hasReturnedToMaintenance = allSessions?.some(
          (session) =>
            session.item_id === s.item_id &&
            new Date(session.started_at) > new Date(s.completed_at)
        ) || false;

        return {
          id: s.item_id,
          item_code: s.item_code,
          product_name: s.product_name,
          completed_at: s.completed_at,
          total_cost: s.total_cost,
          downtime_days: duration,
          condition_before: s.initial_condition || "Unknown",
          condition_after: s.final_condition || "Unknown",
          returned_to_maintenance: hasReturnedToMaintenance,
          session_number: s.session_number,
        };
      });
  }, [filteredSessions, productItems, allSessions]);

  const retiredUnits = useMemo(() => {
    if (!filteredSessions || !productItems) return [];

    return filteredSessions
      .filter((s) => {
        const item = productItems.find((i) => i.id === s.item_id);
        return item && item.status === "retired";
      })
      .map((s) => {
        const item = productItems.find((i) => i.id === s.item_id);
        const itemSessions = allSessions?.filter((session) => session.item_id === s.item_id) || [];

        return {
          id: s.item_id,
          item_code: s.item_code,
          product_name: s.product_name,
          retired_date: s.completed_at,
          retirement_reason: "Cost-ineffective repairs",
          lifetime_maintenance_cost: item?.total_maintenance_cost || s.total_cost,
          total_sessions: itemSessions.length,
          condition: s.final_condition || "Unknown",
        };
      });
  }, [filteredSessions, productItems, allSessions]);

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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <History className="w-6 h-6 text-gray-900" />
        <div>
          <h3 className="text-lg font-bold text-gray-900">Maintenance History</h3>
          <p className="text-sm text-gray-600">
            Complete maintenance analytics and unit outcomes
          </p>
        </div>
      </div>

      {/* Advanced Statistics */}
      <MaintenanceStatsAdvanced stats={advancedStats} />

      {/* Filters - Always Visible */}
      <MaintenanceHistoryFilters
        filters={filters}
        onFilterChange={setFilters}
        productTypes={products || []}
        technicians={technicians}
        onExport={() => setExportDialogOpen(true)}
        exportDisabled={filteredSessions.length === 0}
      />

      {/* Tabbed Content */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All Sessions ({filteredSessions.length})
          </TabsTrigger>
          <TabsTrigger value="returned">
            Returned to Service ({returnedUnits.length})
          </TabsTrigger>
          <TabsTrigger value="retired">
            Retired ({retiredUnits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {paginatedSessions.length > 0 ? (
            <>
              <div className="space-y-3">
                {paginatedSessions.map((session) => {
                  const duration = Math.ceil(
                    (new Date(session.completed_at).getTime() -
                      new Date(session.started_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={session.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-blue-600">{session.item_code}</span>
                              <Badge variant="outline" className="text-xs">
                                Session #{session.session_number}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {session.product_name}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {session.session_summary || "No summary provided"}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Completed: {formatDate(session.completed_at)}</span>
                              <span>
                                Duration: {duration} day{duration !== 1 ? "s" : ""}
                              </span>
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
                          View
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, filteredSessions.length)} of{" "}
                    {filteredSessions.length} sessions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-8 text-gray-500">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No maintenance sessions found matching your filters.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="returned">
          <ReturnedToServiceSection units={returnedUnits} onViewDetails={handleViewHistory} />
        </TabsContent>

        <TabsContent value="retired">
          <RetiredUnitsSection units={retiredUnits} onViewDetails={handleViewHistory} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
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

      <MaintenanceExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        data={filteredSessions}
      />
    </div>
  );
};
