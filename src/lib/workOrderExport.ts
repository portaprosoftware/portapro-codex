import { format } from 'date-fns';
import type { WorkOrder } from '@/components/fleet/work-orders/types';
import { loadPdfLibs } from './loaders/pdf';

/**
 * Export work orders to CSV format
 */
export async function exportWorkOrdersToCSV(workOrders: any[]) {
  const headers = [
    'Work Order Number',
    'Status',
    'Priority',
    'Asset ID',
    'Asset Type',
    'Asset Name',
    'Source',
    'Description',
    'Assigned To',
    'Due Date',
    'Opened At',
    'Closed At',
    'Out of Service',
    'Meter at Open',
    'Meter at Close',
    'Total Cost',
    'Parts Cost',
    'Labor Cost',
    'External Cost',
    'Taxes/Fees',
    'Resolution Notes',
    'Technician Signature',
    'Reviewer Signature',
  ];

  const rows = workOrders.map(wo => [
    wo.work_order_number || '',
    wo.status || '',
    wo.priority || '',
    wo.asset_id || '',
    wo.asset_type || '',
    wo.asset_name || '',
    wo.source || '',
    (wo.description || '').replace(/"/g, '""'), // Escape quotes
    wo.assignee_name || '',
    wo.due_date ? format(new Date(wo.due_date), 'yyyy-MM-dd') : '',
    wo.opened_at ? format(new Date(wo.opened_at), 'yyyy-MM-dd HH:mm') : '',
    wo.closed_at ? format(new Date(wo.closed_at), 'yyyy-MM-dd HH:mm') : '',
    wo.out_of_service ? 'Yes' : 'No',
    wo.meter_at_open || '',
    wo.meter_close_miles || '',
    wo.total_cost || 0,
    wo.work_order_parts?.reduce((sum: number, p: any) => sum + (p.quantity * p.unit_cost), 0) || 0,
    wo.work_order_labor?.reduce((sum: number, l: any) => sum + (l.hours * l.hourly_rate), 0) || 0,
    wo.external_cost || 0,
    wo.taxes_fees || 0,
    (wo.resolution_notes || '').replace(/"/g, '""'),
    wo.technician_signature_id ? 'Yes' : 'No',
    wo.reviewer_signature_id ? 'Yes' : 'No',
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `work_orders_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export a single work order to PDF with full details
 */
export async function exportWorkOrderToPDF(workOrder: any) {
  const { jsPDF, autoTable } = await loadPdfLibs();
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  let yPosition = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(workOrder.work_order_number || 'Work Order', margin, yPosition);
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`, margin, yPosition);

  // Status box
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  
  const statusText = `Status: ${workOrder.status?.toUpperCase() || 'UNKNOWN'}`;
  const statusWidth = doc.getTextWidth(statusText) + 10;
  
  // Status badge background
  doc.setFillColor(workOrder.status === 'completed' ? 34 : workOrder.status === 'in_progress' ? 59 : 220, 
                    workOrder.status === 'completed' ? 197 : workOrder.status === 'in_progress' ? 130 : 38,
                    workOrder.status === 'completed' ? 94 : workOrder.status === 'in_progress' ? 246 : 38);
  doc.roundedRect(margin, yPosition - 5, statusWidth, 8, 2, 2, 'F');
  doc.setTextColor(255);
  doc.text(statusText, margin + 5, yPosition);

  // Priority badge
  const priorityText = `Priority: ${workOrder.priority?.toUpperCase() || 'NORMAL'}`;
  const priorityWidth = doc.getTextWidth(priorityText) + 10;
  doc.setFillColor(workOrder.priority === 'critical' ? 239 : workOrder.priority === 'high' ? 251 : 59,
                    workOrder.priority === 'critical' ? 68 : workOrder.priority === 'high' ? 146 : 130,
                    workOrder.priority === 'critical' ? 68 : workOrder.priority === 'high' ? 60 : 246);
  doc.roundedRect(margin + statusWidth + 10, yPosition - 5, priorityWidth, 8, 2, 2, 'F');
  doc.text(priorityText, margin + statusWidth + 15, yPosition);

  // Out of Service badge
  if (workOrder.out_of_service) {
    yPosition += 10;
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(margin, yPosition - 5, 80, 8, 2, 2, 'F');
    doc.text('⚠ OUT OF SERVICE', margin + 5, yPosition);
  }

  // Basic Information
  yPosition += 15;
  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Work Order Details', margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const details = [
    ['Asset:', workOrder.asset_name || 'N/A'],
    ['Asset Type:', workOrder.asset_type || 'N/A'],
    ['Source:', workOrder.source || 'N/A'],
    ['Assigned To:', workOrder.assignee_name || 'Unassigned'],
    ['Opened:', workOrder.opened_at ? format(new Date(workOrder.opened_at), 'MMM d, yyyy h:mm a') : 'N/A'],
    ['Due Date:', workOrder.due_date ? format(new Date(workOrder.due_date), 'MMM d, yyyy') : 'N/A'],
    ['Closed:', workOrder.closed_at ? format(new Date(workOrder.closed_at), 'MMM d, yyyy h:mm a') : 'Not closed'],
  ];

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 40, yPosition);
    yPosition += 6;
  });

  // Description
  if (workOrder.description) {
    yPosition += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin, yPosition);
    yPosition += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(workOrder.description, pageWidth - 2 * margin);
    doc.text(descLines, margin, yPosition);
    yPosition += descLines.length * 5 + 5;
  }

  // Tasks
  if (workOrder.tasks && workOrder.tasks.length > 0) {
    yPosition += 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Tasks', margin, yPosition);
    yPosition += 8;
    
    workOrder.tasks.forEach((task: string, index: number) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${index + 1}. ${task}`, margin + 5, yPosition);
      yPosition += 6;
    });
  }

  // Parts
  if (workOrder.work_order_parts && workOrder.work_order_parts.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Parts Used', margin, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Part Number', 'Description', 'Qty', 'Unit Cost', 'Total']],
      body: workOrder.work_order_parts.map((part: any) => [
        part.part_number || 'N/A',
        part.description || '',
        part.quantity,
        `$${part.unit_cost.toFixed(2)}`,
        `$${(part.quantity * part.unit_cost).toFixed(2)}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Labor
  if (workOrder.work_order_labor && workOrder.work_order_labor.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Labor', margin, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Technician', 'Hours', 'Rate', 'Total']],
      body: workOrder.work_order_labor.map((labor: any) => [
        labor.technician_name || 'N/A',
        labor.hours,
        `$${labor.hourly_rate.toFixed(2)}`,
        `$${(labor.hours * labor.hourly_rate).toFixed(2)}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Cost Summary
  const partsCost = workOrder.work_order_parts?.reduce((sum: number, p: any) => sum + (p.quantity * p.unit_cost), 0) || 0;
  const laborCost = workOrder.work_order_labor?.reduce((sum: number, l: any) => sum + (l.hours * l.hourly_rate), 0) || 0;
  const totalCost = partsCost + laborCost + (workOrder.external_cost || 0) + (workOrder.taxes_fees || 0);

  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Cost Summary', margin, yPosition);
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const costItems = [
    ['Parts:', `$${partsCost.toFixed(2)}`],
    ['Labor:', `$${laborCost.toFixed(2)}`],
    ['External Costs:', `$${(workOrder.external_cost || 0).toFixed(2)}`],
    ['Taxes/Fees:', `$${(workOrder.taxes_fees || 0).toFixed(2)}`],
  ];

  costItems.forEach(([label, value]) => {
    doc.text(label, margin, yPosition);
    doc.text(value, pageWidth - margin - 30, yPosition, { align: 'right' });
    yPosition += 6;
  });

  // Total line
  yPosition += 2;
  doc.setDrawColor(0);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', margin, yPosition);
  doc.text(`$${totalCost.toFixed(2)}`, pageWidth - margin - 30, yPosition, { align: 'right' });

  // Resolution Notes
  if (workOrder.resolution_notes) {
    yPosition += 10;
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resolution Notes', margin, yPosition);
    yPosition += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(workOrder.resolution_notes, pageWidth - 2 * margin);
    doc.text(notesLines, margin, yPosition);
    yPosition += notesLines.length * 5 + 10;
  }

  // Signatures
  if (workOrder.technician_signature_id || workOrder.reviewer_signature_id) {
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Signatures', margin, yPosition);
    yPosition += 8;

    if (workOrder.technician_signature_id) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Technician Signature: ✓ Completed', margin, yPosition);
      yPosition += 6;
    }

    if (workOrder.reviewer_signature_id) {
      doc.setFontSize(10);
      doc.text('Reviewer Signature: ✓ Completed', margin, yPosition);
      yPosition += 6;
    }
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`${workOrder.work_order_number || 'work_order'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

/**
 * Export multiple work orders to a single PDF
 */
export async function exportMultipleWorkOrdersToPDF(workOrders: any[]) {
  const { jsPDF } = await loadPdfLibs();
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;

  // Title page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Work Orders Report', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, pageWidth / 2, 50, { align: 'center' });
  doc.text(`Total Work Orders: ${workOrders.length}`, pageWidth / 2, 58, { align: 'center' });

  // Summary statistics
  let yPos = 75;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, yPos);
  yPos += 10;

  const statusCounts = workOrders.reduce((acc: any, wo) => {
    acc[wo.status] = (acc[wo.status] || 0) + 1;
    return acc;
  }, {});

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  Object.entries(statusCounts).forEach(([status, count]) => {
    doc.text(`${status}: ${count}`, margin + 10, yPos);
    yPos += 6;
  });

  // For each work order, export on new pages
  for (const workOrder of workOrders) {
    doc.addPage();
    // Simplified version for multi-export
    await exportWorkOrderToPDF(workOrder);
  }

  doc.save(`work_orders_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
