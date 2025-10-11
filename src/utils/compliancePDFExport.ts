import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ComplianceSummaryData {
  dateRange: { from: Date; to: Date };
  fleetHealthScore: number;
  totalVehicles: number;
  criticalItems: {
    expiredDocuments: Array<{ vehicle: string; docType: string; daysOverdue: number }>;
    overdueInspections: number;
    activeIncidents: Array<{ vehicle: string; incidentType: string; date: Date }>;
  };
  expiringSoon: Array<{ vehicle: string; itemType: string; expirationDate: Date; daysUntilDue: number }>;
  recentActivity: {
    newInspections: number;
    newIncidents: number;
    newDeconLogs: number;
    documentsUploaded: number;
  };
  lowStockAlerts: Array<{ itemName: string; currentStock: number; minThreshold: number }>;
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    description: string;
    vehicle?: string;
    dueDate?: Date;
  }>;
}

export const exportComplianceSummaryToPDF = (
  data: ComplianceSummaryData,
  companyName: string = 'PortaPro'
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let currentY = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Fleet Compliance Summary Report', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Date Range: ${format(data.dateRange.from, 'MMM dd, yyyy')} - ${format(data.dateRange.to, 'MMM dd, yyyy')}`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  
  currentY += 5;
  doc.text(
    `Generated: ${format(new Date(), 'MMM dd, yyyy hh:mm a')}`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );

  currentY += 15;

  // Executive Summary Box
  doc.setFillColor(240, 240, 240);
  doc.rect(15, currentY, pageWidth - 30, 30, 'F');
  
  currentY += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 20, currentY);
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Health Score with color
  const healthScore = data.fleetHealthScore;
  const scoreColor: [number, number, number] = healthScore >= 90 ? [34, 197, 94] : healthScore >= 70 ? [250, 204, 21] : [239, 68, 68];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`Fleet Health Score: ${healthScore.toFixed(1)}%`, 20, currentY);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Vehicles: ${data.totalVehicles}`, 100, currentY);
  
  currentY += 6;
  const criticalCount = data.criticalItems.expiredDocuments.length + data.criticalItems.overdueInspections + data.criticalItems.activeIncidents.length;
  doc.text(`Critical Items: ${criticalCount}`, 20, currentY);
  doc.text(`Expiring Soon: ${data.expiringSoon.length}`, 100, currentY);

  currentY += 15;

  // Critical Items Section
  if (criticalCount > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(239, 68, 68);
    doc.text('🔴 Critical Items Requiring Immediate Attention', 15, currentY);
    doc.setTextColor(0, 0, 0);
    
    currentY += 5;

    const criticalData: any[] = [];
    
    // Expired documents
    data.criticalItems.expiredDocuments.forEach(item => {
      criticalData.push([
        item.vehicle,
        'Expired Document',
        item.docType,
        `${item.daysOverdue} days overdue`
      ]);
    });

    // Active incidents
    data.criticalItems.activeIncidents.forEach(item => {
      criticalData.push([
        item.vehicle,
        'Active Incident',
        item.incidentType,
        format(item.date, 'MMM dd, yyyy')
      ]);
    });

    // Overdue inspections
    if (data.criticalItems.overdueInspections > 0) {
      criticalData.push([
        'Multiple',
        'Overdue Inspections',
        `${data.criticalItems.overdueInspections} vehicle(s)`,
        'Action Required'
      ]);
    }

    if (criticalData.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [['Vehicle', 'Issue Type', 'Details', 'Status']],
        body: criticalData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 15, right: 15 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // Expiring Soon Section
  if (data.expiringSoon.length > 0 && currentY < pageHeight - 60) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(250, 204, 21);
    doc.text('⚠️ Expiring in Next 30 Days', 15, currentY);
    doc.setTextColor(0, 0, 0);
    
    currentY += 5;

    const expiringData = data.expiringSoon.slice(0, 10).map(item => [
      item.vehicle,
      item.itemType,
      format(item.expirationDate, 'MMM dd, yyyy'),
      `${item.daysUntilDue} days`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Vehicle', 'Item Type', 'Expiration Date', 'Days Until Due']],
      body: expiringData,
      theme: 'striped',
      headStyles: { fillColor: [250, 204, 21] },
      margin: { left: 15, right: 15 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Add new page if needed
  if (currentY > pageHeight - 80) {
    doc.addPage();
    currentY = 20;
  }

  // Recent Activity Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text('📊 Recent Activity', 15, currentY);
  doc.setTextColor(0, 0, 0);
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`• ${data.recentActivity.newInspections} spill kit inspections completed`, 20, currentY);
  currentY += 5;
  doc.text(`• ${data.recentActivity.newIncidents} incidents reported`, 20, currentY);
  currentY += 5;
  doc.text(`• ${data.recentActivity.newDeconLogs} decontamination logs filed`, 20, currentY);
  currentY += 5;
  doc.text(`• ${data.recentActivity.documentsUploaded} compliance documents uploaded`, 20, currentY);
  
  currentY += 10;

  // Low Stock Alerts
  if (data.lowStockAlerts.length > 0 && currentY < pageHeight - 60) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text('📦 Low Stock Alerts', 15, currentY);
    doc.setTextColor(0, 0, 0);
    
    currentY += 5;

    const stockData = data.lowStockAlerts.map(item => [
      item.itemName,
      item.currentStock.toString(),
      item.minThreshold.toString(),
      'Reorder Needed'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Item Name', 'Current Stock', 'Min Threshold', 'Action']],
      body: stockData,
      theme: 'striped',
      headStyles: { fillColor: [234, 88, 12] },
      margin: { left: 15, right: 15 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Priority Action Items
  if (data.actionItems.length > 0) {
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('✅ Priority Action Items', 15, currentY);
    
    currentY += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    data.actionItems.forEach((item, index) => {
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = 20;
      }

      const priorityColor: [number, number, number] = item.priority === 'high' ? [239, 68, 68] : item.priority === 'medium' ? [250, 204, 21] : [156, 163, 175];
      doc.setTextColor(priorityColor[0], priorityColor[1], priorityColor[2]);
      doc.text(`${index + 1}.`, 20, currentY);
      doc.setTextColor(0, 0, 0);
      
      const actionText = `[${item.priority.toUpperCase()}] ${item.description}${item.vehicle ? ` - ${item.vehicle}` : ''}${item.dueDate ? ` (Due: ${format(item.dueDate, 'MMM dd')})` : ''}`;
      doc.text(actionText, 27, currentY);
      currentY += 5;
    });
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `${companyName} - Compliance Report | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`Compliance-Summary-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
