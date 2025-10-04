import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Droplet, ExternalLink, Calendar, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface VehicleComplianceDeconLogsTabProps {
  vehicleId: string;
  licensePlate: string;
}

export function VehicleComplianceDeconLogsTab({ vehicleId, licensePlate }: VehicleComplianceDeconLogsTabProps) {
  const navigate = useNavigate();

  const { data: deconLogs, isLoading } = useQuery({
    queryKey: ['vehicle-decon-logs', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decon_logs')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('performed_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
  });

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold">Unknown</Badge>;
    }

    const statusMap = {
      passed: { label: 'Passed', className: 'bg-gradient-to-r from-green-500 to-green-600 text-white font-bold' },
      failed: { label: 'Failed', className: 'bg-gradient-to-r from-red-500 to-red-600 text-white font-bold' },
      pending: { label: 'Pending', className: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold' },
    };

    const info = statusMap[status as keyof typeof statusMap] || { label: status, className: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold' };
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Decontamination Logs</h3>
          <p className="text-sm text-gray-600">Cleaning and decon records for {licensePlate}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/fleet/compliance?tab=decon&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          className="gap-2"
        >
          View All <ExternalLink className="w-3 h-3" />
        </Button>
      </div>

      {deconLogs && deconLogs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Droplet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-4">No decontamination logs for this vehicle</p>
            <Button
              onClick={() => navigate(`/fleet/compliance?tab=decon&vehicle=${vehicleId}&action=new-decon&returnTo=/fleet-management`)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"
            >
              Record Decon
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {deconLogs?.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Droplet className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(log.post_inspection_status)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(log.performed_at), 'MMM dd, yyyy \'at\' h:mm a')}</span>
                        </div>
                        {log.decon_methods && log.decon_methods.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {log.decon_methods.map((method: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {method}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {log.notes && (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">{log.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="pt-2">
        <Button
          onClick={() => navigate(`/fleet/compliance?tab=decon&vehicle=${vehicleId}&returnTo=/fleet-management`)}
          variant="outline"
          className="w-full"
        >
          View Full Decon Logs Section
        </Button>
      </div>
    </div>
  );
}
