import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

interface MaintenanceExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
}

export const MaintenanceExportDialog: React.FC<MaintenanceExportDialogProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [exportFormat, setExportFormat] = React.useState<"csv" | "pdf">("csv");
  const [includePhotos, setIncludePhotos] = React.useState(false);
  const [includeCosts, setIncludeCosts] = React.useState(true);
  const [includeTechnicians, setIncludeTechnicians] = React.useState(true);

  const handleExport = () => {
    if (exportFormat === "csv") {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Item Code",
      "Session Number",
      "Product",
      "Completed Date",
      "Duration (days)",
      includeCosts ? "Cost" : null,
      includeTechnicians ? "Technician" : null,
      "Summary",
    ].filter(Boolean);

    const rows = data.map((session) => {
      const row = [
        session.item_code,
        session.session_number,
        session.product_name,
        new Date(session.completed_at).toLocaleDateString(),
        Math.ceil((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60 * 60 * 24)),
        includeCosts ? session.total_cost : null,
        includeTechnicians ? session.primary_technician : null,
        session.session_summary,
      ].filter((_, i) => headers[i] !== null);
      return row;
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell || ""}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maintenance-history-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Exported to CSV successfully");
    onClose();
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Maintenance History Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    const headers = [
      "Item Code",
      "Session #",
      "Completed",
      "Duration",
      includeCosts ? "Cost" : null,
      includeTechnicians ? "Tech" : null,
    ].filter(Boolean);

    const rows = data.map((session) => {
      const duration = Math.ceil(
        (new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return [
        session.item_code,
        session.session_number,
        new Date(session.completed_at).toLocaleDateString(),
        `${duration}d`,
        includeCosts ? `$${session.total_cost.toFixed(2)}` : null,
        includeTechnicians ? session.primary_technician : null,
      ].filter((_, i) => headers[i] !== null);
    });

    (autoTable as any)(doc, {
      startY: 35,
      head: [headers],
      body: rows,
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`maintenance-history-${new Date().toISOString().split("T")[0]}.pdf`);

    toast.success("Exported to PDF successfully");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Maintenance History</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  CSV (Excel Compatible)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-red-600" />
                  PDF (Printable Report)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="costs"
                  checked={includeCosts}
                  onCheckedChange={(checked) => setIncludeCosts(checked as boolean)}
                />
                <Label htmlFor="costs" className="cursor-pointer font-normal">
                  Cost Information
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="technicians"
                  checked={includeTechnicians}
                  onCheckedChange={(checked) => setIncludeTechnicians(checked as boolean)}
                />
                <Label htmlFor="technicians" className="cursor-pointer font-normal">
                  Technician Names
                </Label>
              </div>
              {exportFormat === "pdf" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="photos"
                    checked={includePhotos}
                    onCheckedChange={(checked) => setIncludePhotos(checked as boolean)}
                  />
                  <Label htmlFor="photos" className="cursor-pointer font-normal">
                    Photos (PDF only)
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 text-sm text-gray-900">
            Exporting {data.length} maintenance session{data.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" />
            Export {exportFormat.toUpperCase()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
