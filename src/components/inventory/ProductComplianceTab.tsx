import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDateSafe, addDaysToDate } from "@/lib/dateUtils";
import { ShieldCheck, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import jsPDF from "jspdf";

interface ProductComplianceTabProps {
  productId: string;
  productName?: string;
}

interface ProductItem {
  id: string;
  item_code: string;
  status: string | null;
}

interface SanitationLog {
  id: string;
  created_at: string;
  product_item_id: string | null;
  notes: string | null;
  photos?: any;
}

type UnitStatus = "good" | "due_soon" | "overdue" | "no_record";

export const ProductComplianceTab: React.FC<ProductComplianceTabProps> = ({ productId, productName }) => {
  const queryClient = useQueryClient();
  const DAYS_FREQUENCY = 7; // Default weekly cleaning
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; item_code: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["product-compliance", productId],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 90);

      // 1) Fetch all product items for this product
      const { data: itemsData, error: itemsError } = await supabase
        .from("product_items")
        .select("id, item_code, status")
        .eq("product_id", productId)
        .order("item_code", { ascending: true });
      if (itemsError) throw itemsError;
      const items: ProductItem[] = itemsData || [];

      if (items.length === 0) {
        return { items, logs: [] as SanitationLog[] };
      }

      // 2) Fetch sanitation logs for those items (last 90 days)
      const { data: logsData, error: logsError } = await supabase
        .from("sanitation_logs")
        .select(
          `id, created_at, notes, product_item_id`
        )
        .gte("created_at", since.toISOString())
        .in("product_item_id", items.map((i) => i.id))
        .order("created_at", { ascending: false });
      if (logsError) throw logsError;
      const logs: SanitationLog[] = logsData || [];

      return { items, logs };
    },
  });

  const { data: historyLogs, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["sanitation-history", selectedItem?.id],
    enabled: historyOpen && !!selectedItem?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sanitation_logs")
        .select("id, created_at, notes, photos")
        .eq("product_item_id", selectedItem!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as SanitationLog[];
    },
  });

  const markCleaned = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("sanitation_logs").insert({
        product_item_id: itemId,
        notes: "Quick cleaned from Inventory > Compliance",
        photos: [],
        responses: {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as cleaned");
      queryClient.invalidateQueries({ queryKey: ["product-compliance", productId] });
    },
    onError: (err: any) => {
      toast.error("Failed to mark cleaned", { description: err?.message });
    },
  });

  const computed = useMemo(() => {
    const items = data?.items ?? [];
    const logs = data?.logs ?? [];

    const latestLogByItem = new Map<string, SanitationLog>();
    for (const log of logs) {
      if (!log.product_item_id) continue;
      if (!latestLogByItem.has(log.product_item_id)) {
        latestLogByItem.set(log.product_item_id, log);
      }
    }

    const today = new Date();

    const list = items.map((item) => {
      const lastLog = latestLogByItem.get(item.id) || null;
      const lastCleaned = lastLog ? new Date(lastLog.created_at) : null;
      const nextDue = lastCleaned ? addDaysToDate(lastCleaned, DAYS_FREQUENCY) : null;

      let status: UnitStatus = "no_record";
      if (lastCleaned && nextDue) {
        if (today >= nextDue) status = "overdue";
        else if (nextDue.getTime() - today.getTime() <= 24 * 60 * 60 * 1000) status = "due_soon"; // within 1 day
        else status = "good";
      }

      return {
        id: item.id,
        item_code: item.item_code,
        lastCleaned,
        nextDue,
        status,
      } as {
        id: string;
        item_code: string;
        lastCleaned: Date | null;
        nextDue: Date | null;
        status: UnitStatus;
      };
    });

    const counts = {
      overdue: list.filter((u) => u.status === "overdue").length,
      due_soon: list.filter((u) => u.status === "due_soon").length,
      good: list.filter((u) => u.status === "good").length,
      no_record: list.filter((u) => u.status === "no_record").length,
      total: list.length,
    };

    return { list, counts };
  }, [data]);

  const statusBadge = (s: UnitStatus) => {
    switch (s) {
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      case "due_soon":
        return <Badge variant="secondary">Due soon</Badge>;
      case "good":
        return <Badge>Good</Badge>;
      default:
        return <Badge variant="outline">No record</Badge>;
    }
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF();
      const title = productName ? `Compliance - ${productName}` : "Compliance Report";
      doc.setFontSize(16);
      doc.text(title, 14, 16);
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);
      doc.text(
        `Totals: Overdue ${computed.counts.overdue} • Due soon ${computed.counts.due_soon} • Good ${computed.counts.good}`,
        14,
        32
      );
      let y = 44;
      doc.text("Unit", 14, y);
      doc.text("Last Cleaned", 70, y);
      doc.text("Next Due", 120, y);
      doc.text("Status", 170, y);
      y += 6;
      const rows = computed.list || [];
      rows.slice(0, 60).forEach((u) => {
        doc.text(u.item_code || "-", 14, y);
        const lc = u.lastCleaned ? formatDateSafe(u.lastCleaned.toISOString(), "short") : "—";
        const nd = u.nextDue ? formatDateSafe(u.nextDue.toISOString(), "short") : "—";
        const st =
          u.status === "overdue" ? "Overdue" : u.status === "due_soon" ? "Due soon" : u.status === "good" ? "Good" : "No record";
        doc.text(lc, 70, y);
        doc.text(nd, 120, y);
        doc.text(st, 170, y);
        y += 6;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
      const fileName = `${(productName || "compliance").replace(/\s+/g, "_").toLowerCase()}_report.pdf`;
      doc.save(fileName);
    } catch (e) {
      toast.error("Failed to export PDF");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Compliance</h2>
        </div>
        <Button variant="secondary" onClick={handleExportPdf} disabled={isLoading}>Export PDF</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /><span>Overdue</span></div>
          <div className="text-3xl font-bold mt-2">{computed.counts.overdue}</div>
        </div>
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /><span>Due soon</span></div>
          <div className="text-3xl font-bold mt-2">{computed.counts.due_soon}</div>
        </div>
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle className="w-4 h-4" /><span>Good</span></div>
          <div className="text-3xl font-bold mt-2">{computed.counts.good}</div>
        </div>
        <div className="bg-card text-card-foreground rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /><span>No record</span></div>
          <div className="text-3xl font-bold mt-2">{computed.counts.no_record}</div>
        </div>
      </div>

      {/* List */}
      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-sm text-muted-foreground border-b border-border">
          <div className="col-span-3">Unit</div>
          <div className="col-span-3">Last cleaned</div>
          <div className="col-span-3">Next due</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>
        {isLoading ? (
          <div className="p-6 text-muted-foreground">Loading compliance…</div>
        ) : computed.list.length === 0 ? (
          <div className="p-6 text-muted-foreground">No units found for this product.</div>
        ) : (
          <div className="divide-y divide-border">
            {computed.list.map((u) => (
              <div key={u.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                <div className="col-span-3 flex items-center gap-2">
                  {statusBadge(u.status)}
                  <span className="font-medium">{u.item_code}</span>
                </div>
                <div className="col-span-3">
                  {u.lastCleaned ? formatDateSafe(u.lastCleaned.toISOString(), "long") : "—"}
                </div>
                <div className="col-span-3">
                  {u.nextDue ? formatDateSafe(u.nextDue.toISOString(), "long") : "—"}
                </div>
                <div className="col-span-3 flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedItem({ id: u.id, item_code: u.item_code });
                      setHistoryOpen(true);
                    }}
                  >
                    View history
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={markCleaned.isPending}
                    onClick={() => markCleaned.mutate(u.id)}
                  >
                    Mark cleaned
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog open={historyOpen} onOpenChange={(o) => { if (!o) setHistoryOpen(false); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              History — {selectedItem?.item_code}{productName ? ` (${productName})` : ""}
            </DialogTitle>
          </DialogHeader>
          {isHistoryLoading ? (
            <div className="p-4 text-muted-foreground">Loading history…</div>
          ) : !historyLogs || historyLogs.length === 0 ? (
            <div className="p-4 text-muted-foreground">No history found for this unit.</div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-auto">
              {historyLogs.map((log) => (
                <div key={log.id} className="rounded-xl border border-border p-3">
                  <div className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
                  {log.notes && <div className="mt-1 text-foreground">{log.notes}</div>}
                  {Array.isArray(log.photos) && (log.photos as any[]).length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {(log.photos as any[]).map((src: any, idx: number) => (
                        <img
                          key={idx}
                          src={typeof src === "string" ? src : (src?.url || "")}
                          alt={`Sanitation photo ${idx + 1}`}
                          className="rounded-md border border-border object-cover w-full h-24"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
