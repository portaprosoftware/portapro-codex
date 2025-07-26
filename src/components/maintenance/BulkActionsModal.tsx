import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, FileX } from "lucide-react";
import { toast } from "sonner";

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecords: string[];
  onSuccess: () => void;
}

export const BulkActionsModal: React.FC<BulkActionsModalProps> = ({
  isOpen,
  onClose,
  selectedRecords,
  onSuccess,
}) => {
  const [action, setAction] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  const { user } = useUser();
  const queryClient = useQueryClient();

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ recordIds, status }: { recordIds: string[]; status: string }) => {
      const { data, error } = await supabase.rpc('bulk_update_service_status', {
        record_ids: recordIds,
        new_status: status,
        updated_by_user: user?.id || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-reports"] });
      toast.success(
        `Bulk update completed! ${data.updated_count} of ${data.total_requested} records updated.`
      );
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Bulk update failed:", error);
      toast.error("Failed to update records. Please try again.");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (recordIds: string[]) => {
      const { error } = await supabase
        .from('maintenance_reports')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .in('id', recordIds);

      if (error) throw error;
      return { updated_count: recordIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-reports"] });
      toast.success(`${data.updated_count} records cancelled successfully.`);
      onSuccess();
      onClose();
    },
    onError: (error) => {
      console.error("Bulk delete failed:", error);
      toast.error("Failed to cancel records. Please try again.");
    },
  });

  const generateBulkPDFMutation = useMutation({
    mutationFn: async (recordIds: string[]) => {
      const results = await Promise.allSettled(
        recordIds.map(async (id) => {
          const { error } = await supabase.functions.invoke('generate-service-pdf', {
            body: {
              report_id: id,
              action: 'generate_pdf',
            },
          });
          if (error) throw error;
          return id;
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      return { successful, total: recordIds.length };
    },
    onSuccess: (data) => {
      toast.success(`Generated PDFs for ${data.successful} of ${data.total} records.`);
      onClose();
    },
    onError: (error) => {
      console.error("Bulk PDF generation failed:", error);
      toast.error("Failed to generate PDFs. Please try again.");
    },
  });

  const handleExecuteAction = () => {
    if (!action) return;

    switch (action) {
      case 'update_status':
        if (newStatus) {
          bulkUpdateMutation.mutate({
            recordIds: selectedRecords,
            status: newStatus,
          });
        }
        break;
      case 'cancel_records':
        bulkDeleteMutation.mutate(selectedRecords);
        break;
      case 'generate_pdfs':
        generateBulkPDFMutation.mutate(selectedRecords);
        break;
    }
  };

  const isLoading = bulkUpdateMutation.isPending || bulkDeleteMutation.isPending || generateBulkPDFMutation.isPending;

  const getActionIcon = () => {
    switch (action) {
      case 'update_status':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'cancel_records':
        return <FileX className="w-5 h-5 text-red-600" />;
      case 'generate_pdfs':
        return <FileX className="w-5 h-5 text-green-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionIcon()}
            Bulk Actions
          </DialogTitle>
          <DialogDescription>
            Perform actions on {selectedRecords.length} selected service records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Records Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Selected Records</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {selectedRecords.length} records
              </Badge>
            </div>
          </div>

          {/* Action Selection */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Choose Action
              </label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update_status">Update Status</SelectItem>
                  <SelectItem value="generate_pdfs">Generate PDFs</SelectItem>
                  <SelectItem value="cancel_records" className="text-red-600">
                    Cancel Records
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Selection (only for update_status action) */}
            {action === 'update_status' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  New Status
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        Open
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        In Progress
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Completed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Descriptions */}
            {action && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Action Details</h4>
                <p className="text-sm text-gray-600">
                  {action === 'update_status' && 'Update the status of all selected records to the chosen status.'}
                  {action === 'generate_pdfs' && 'Generate PDF reports for all selected records.'}
                  {action === 'cancel_records' && 'Cancel all selected records by setting their status to cancelled.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleExecuteAction}
            disabled={
              isLoading ||
              !action ||
              (action === 'update_status' && !newStatus)
            }
            className={
              action === 'cancel_records'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }
          >
            {isLoading ? 'Processing...' : 'Execute Action'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};