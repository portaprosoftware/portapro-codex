import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, User, DollarSign, Package, Image, CheckCircle, Wrench, Calendar } from "lucide-react";

interface MaintenanceUpdate {
  id: string;
  item_id: string;
  maintenance_session_id: string | null;
  update_type: string;
  title: string;
  description: string | null;
  technician_name: string | null;
  labor_hours: number | null;
  cost_amount: number | null;
  parts_used: any[] | null;
  completion_photos: string[] | null;
  completion_notes: string | null;
  session_status: string | null;
  created_at: string;
  attachments: any[] | null;
}

interface MaintenanceSession {
  id: string;
  item_id: string;
  session_number: number;
  started_at: string;
  completed_at: string | null;
  initial_condition: string | null;
  final_condition: string | null;
  primary_technician: string | null;
  session_summary: string | null;
  initial_photos: string[] | null;
  completion_photos: string[] | null;
  total_cost: number | null;
  total_labor_hours: number | null;
  status: string | null;
}

interface MaintenanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemCode: string;
}

export const MaintenanceHistoryModal: React.FC<MaintenanceHistoryModalProps> = ({
  isOpen,
  onClose,
  itemId,
  itemCode,
}) => {
  // Fetch maintenance sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery<MaintenanceSession[]>({
    queryKey: ["maintenance-sessions", itemId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("maintenance_sessions")
        .select("*")
        .eq("item_id", itemId)
        .order("session_number", { ascending: false });

      if (error) throw error;
      return (data as MaintenanceSession[]) || [];
    },
    enabled: isOpen && !!itemId,
  });

  // Fetch maintenance updates
  const { data: updates, isLoading: updatesLoading } = useQuery<MaintenanceUpdate[]>({
    queryKey: ["maintenance-updates", itemId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("maintenance_updates")
        .select("*")
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as MaintenanceUpdate[]) || [];
    },
    enabled: isOpen && !!itemId,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case "progress":
        return "bg-blue-100 text-blue-800";
      case "repair":
        return "bg-red-100 text-red-800";
      case "parts":
        return "bg-green-100 text-green-800";
      case "inspection":
        return "bg-yellow-100 text-yellow-800";
      case "completion":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSessionIcon = (status: string | null) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <Wrench className="w-4 h-4 text-orange-600" />;
  };

  const getSessionStatusColor = (status: string | null) => {
    if (status === 'completed') return "bg-green-100 text-green-800";
    return "bg-orange-100 text-orange-800";
  };

  // Group updates by session
  const groupedUpdates = React.useMemo(() => {
    if (!updates) return {};
    
    const groups: Record<string, MaintenanceUpdate[]> = {};
    
    updates.forEach(update => {
      const sessionId = update.maintenance_session_id || 'legacy';
      if (!groups[sessionId]) {
        groups[sessionId] = [];
      }
      groups[sessionId].push(update);
    });
    
    return groups;
  }, [updates]);

  const totalCost = sessions?.reduce((sum, session) => sum + (session.total_cost || 0), 0) || 0;
  const totalSessions = sessions?.length || 0;

  const isLoading = sessionsLoading || updatesLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Maintenance History - {itemCode}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-6 text-center">Loading maintenance history...</div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            {totalSessions > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{totalSessions} Maintenance Session{totalSessions > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Total Cost: {formatCurrency(totalCost)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Item: {itemCode}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Session Timeline */}
            <div className="space-y-6">
              {sessions && sessions.length > 0 ? (
                sessions.map((session, sessionIndex) => {
                  const sessionUpdates = groupedUpdates[session.id] || [];
                  const sessionDays = session.completed_at 
                    ? Math.ceil((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <div key={session.id} className="relative">
                      {sessionIndex < sessions.length - 1 && (
                        <div className="absolute left-5 top-16 bottom-0 w-0.5 bg-gray-200"></div>
                      )}
                      
                      {/* Session Header */}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {getSessionIcon(session.status)}
                        </div>
                        
                        <div className="flex-1 bg-white border-2 border-blue-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold">Session #{session.session_number}</h3>
                              <Badge className={getSessionStatusColor(session.status)}>
                                {session.status === 'completed' ? 'Completed' : 'Active'}
                              </Badge>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              <div>Started: {formatDate(session.started_at)}</div>
                              {session.completed_at && (
                                <div>Completed: {formatDate(session.completed_at)} ({sessionDays} day{sessionDays !== 1 ? 's' : ''})</div>
                              )}
                            </div>
                          </div>

                          {/* Session Summary Row */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <span className="font-medium text-gray-700">Technician:</span>
                              <div className="text-sm text-gray-600">{session.primary_technician || "Not assigned"}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Cost:</span>
                              <div className="text-sm text-gray-600">{formatCurrency(session.total_cost) || "$0.00"}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Labor Hours:</span>
                              <div className="text-sm text-gray-600">{session.total_labor_hours || "0"}h</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Final Condition:</span>
                              <div className="text-sm text-gray-600">{session.final_condition || "—"}</div>
                            </div>
                          </div>

                          {/* Before/After Photos */}
                          {(session.initial_photos?.length || session.completion_photos?.length) && (
                            <div className="border-t pt-4 mb-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {session.initial_photos?.length && (
                                  <div>
                                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                      <Image className="w-4 h-4" />
                                      Before Photos
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {session.initial_photos.slice(0, 4).map((url: string, idx: number) => (
                                        <img
                                          key={idx}
                                          src={url}
                                          alt={`Before repair ${idx + 1}`}
                                          className="w-full h-16 object-cover rounded border"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {session.completion_photos?.length && (
                                  <div>
                                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4" />
                                      After Photos
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {session.completion_photos.slice(0, 4).map((url: string, idx: number) => (
                                        <img
                                          key={idx}
                                          src={url}
                                          alt={`After repair ${idx + 1}`}
                                          className="w-full h-16 object-cover rounded border"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Session Summary */}
                          {session.session_summary && (
                            <div className="border-t pt-4 mb-4">
                              <h4 className="font-medium text-gray-700 mb-2">Summary:</h4>
                              <p className="text-sm text-gray-600">{session.session_summary}</p>
                            </div>
                          )}

                          {/* Updates Timeline for this Session */}
                          {sessionUpdates.length > 0 && (
                            <div className="border-t pt-4">
                              <h4 className="font-medium text-gray-700 mb-3">Updates Timeline:</h4>
                              <div className="space-y-3">
                                {sessionUpdates.map((update) => (
                                  <div key={update.id} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Badge className={getUpdateTypeColor(update.update_type)} variant="secondary">
                                          {update.title || update.update_type}
                                        </Badge>
                                        {update.technician_name && (
                                          <div className="flex items-center gap-1 text-xs text-gray-600">
                                            <User className="w-3 h-3" />
                                            {update.technician_name}
                                          </div>
                                        )}
                                      </div>
                                      <time className="text-xs text-gray-500">
                                        {formatDate(update.created_at)}
                                      </time>
                                    </div>
                                    
                                    {update.description && (
                                      <p className="text-sm text-gray-700 mb-2">{update.description}</p>
                                    )}
                                    
                                    {(update.labor_hours || update.cost_amount || update.parts_used?.length) && (
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                        {update.labor_hours && (
                                          <div>
                                            <span className="font-medium">Labor:</span> {update.labor_hours}h
                                          </div>
                                        )}
                                        {update.cost_amount && (
                                          <div>
                                            <span className="font-medium">Cost:</span> {formatCurrency(update.cost_amount)}
                                          </div>
                                        )}
                                        {update.parts_used?.length && (
                                          <div>
                                            <span className="font-medium">Parts:</span> {update.parts_used.join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Completion photos from update */}
                                    {update.completion_photos?.length && (
                                      <div className="mt-2">
                                        <div className="flex gap-1">
                                          {update.completion_photos.slice(0, 3).map((url: string, idx: number) => (
                                            <img
                                              key={idx}
                                              src={url}
                                              alt={`Update photo ${idx + 1}`}
                                              className="w-12 h-12 object-cover rounded border"
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Show legacy updates if no sessions exist
                groupedUpdates['legacy']?.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Legacy Maintenance Updates</h3>
                    <div className="space-y-4">
                      {groupedUpdates['legacy'].map((update, index) => (
                        <div key={update.id} className="relative">
                          {index < groupedUpdates['legacy'].length - 1 && (
                            <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                          )}
                          
                          <div className="flex gap-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Clock className="w-4 h-4 text-blue-600" />
                            </div>
                            
                            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge className={getUpdateTypeColor(update.update_type)}>
                                    {update.title || update.update_type}
                                  </Badge>
                                  {update.technician_name && (
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <User className="w-3 h-3" />
                                      {update.technician_name}
                                    </div>
                                  )}
                                </div>
                                <time className="text-xs text-gray-500">
                                  {formatDate(update.created_at)}
                                </time>
                              </div>
                              
                              <p className="text-gray-900 mb-3">{update.description}</p>
                              
                              {(update.labor_hours || update.cost_amount || update.parts_used?.length) && (
                                <div className="border-t pt-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    {update.labor_hours && (
                                      <div>
                                        <span className="font-medium text-gray-700">Labor:</span>
                                        <span className="ml-2">{update.labor_hours}h</span>
                                        {update.cost_amount && (
                                          <span className="ml-2 text-green-600">
                                            ({formatCurrency(update.cost_amount)})
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {update.cost_amount && (
                                      <div>
                                        <span className="font-medium text-gray-700">Cost:</span>
                                        <span className="ml-2 text-green-600">
                                          {formatCurrency(update.cost_amount)}
                                        </span>
                                      </div>
                                    )}
                                    {update.parts_used?.length && (
                                      <div className="md:col-span-2">
                                        <span className="font-medium text-gray-700">Parts Used:</span>
                                        <span className="ml-2">{update.parts_used.join(', ')}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Maintenance History</h3>
                    <p className="text-gray-600">
                      No maintenance sessions or updates have been recorded for this item.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};