import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VendorPerformance, CostPerMileMetrics, FleetMPGMetrics, SourceComparison } from '@/hooks/useFuelAnalytics';
import { UnifiedFuelConsumption } from '@/hooks/useUnifiedFuelConsumption';

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  dateRange?: string;
  companyName?: string;
  companyLogo?: string;
}

const addHeader = (doc: jsPDF, options: PDFExportOptions) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Company name
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(options.companyName || 'PortaPro', 14, 15);
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text(options.title, 14, 25);
  
  // Subtitle
  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(options.subtitle, 14, 32);
  }
  
  // Date range
  if (options.dateRange) {
    doc.setFontSize(9);
    doc.text(options.dateRange, 14, options.subtitle ? 38 : 32);
  }
  
  // Generated timestamp
  const timestamp = new Date().toLocaleString();
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Generated: ${timestamp}`, pageWidth - 14, 15, { align: 'right' });
  
  // Line separator
  const yPos = options.dateRange ? 42 : (options.subtitle ? 36 : 30);
  doc.setDrawColor(200);
  doc.line(14, yPos, pageWidth - 14, yPos);
  
  return yPos + 8;
};

const addFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
};

export const exportVendorPerformanceToPDF = (
  data: VendorPerformance[],
  options: PDFExportOptions
) => {
  const doc = new jsPDF();
  const startY = addHeader(doc, { ...options, title: 'Vendor Performance Report' });
  
  autoTable(doc, {
    startY,
    head: [['Rank', 'Vendor/Source', 'Gallons', 'Total Spent', 'Avg $/Gal', 'Purchases', 'Last Purchase']],
    body: data.map((vendor, idx) => [
      `#${idx + 1}`,
      vendor.vendor_name,
      vendor.total_gallons.toFixed(1),
      `$${vendor.total_cost.toFixed(2)}`,
      `$${vendor.avg_cost_per_gallon.toFixed(3)}`,
      vendor.transaction_count.toString(),
      new Date(vendor.last_purchase_date).toLocaleDateString()
    ]),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
  });
  
  addFooter(doc);
  doc.save(`vendor-performance_${Date.now()}.pdf`);
};

export const exportCostPerMileToPDF = (
  data: CostPerMileMetrics,
  options: PDFExportOptions
) => {
  const doc = new jsPDF();
  const startY = addHeader(doc, { ...options, title: 'Cost Per Mile Report' });
  
  // Summary section
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Fleet Summary', 14, startY);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Total Fuel Cost: $${data.total_fuel_cost.toFixed(2)}`, 14, startY + 8);
  doc.text(`Total Miles Driven: ${data.total_miles_driven.toLocaleString()}`, 14, startY + 15);
  doc.text(`Average Cost Per Mile: $${data.cost_per_mile.toFixed(3)}`, 14, startY + 22);
  
  // Vehicle breakdown table
  autoTable(doc, {
    startY: startY + 30,
    head: [['Vehicle', 'Miles Driven', 'Fuel Cost', 'Cost/Mile']],
    body: data.by_vehicle.map(vehicle => [
      vehicle.license_plate,
      vehicle.miles_driven.toLocaleString(),
      `$${vehicle.fuel_cost.toFixed(2)}`,
      `$${vehicle.cost_per_mile.toFixed(3)}`
    ]),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
  });
  
  addFooter(doc);
  doc.save(`cost-per-mile_${Date.now()}.pdf`);
};

export const exportFleetMPGToPDF = (
  data: FleetMPGMetrics,
  options: PDFExportOptions
) => {
  const doc = new jsPDF();
  const startY = addHeader(doc, { ...options, title: 'Fleet MPG Report' });
  
  // Summary section
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Fleet Summary', 14, startY);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fleet Average MPG: ${data.fleet_avg_mpg.toFixed(2)}`, 14, startY + 8);
  doc.text(`Total Gallons: ${data.total_gallons.toFixed(1)}`, 14, startY + 15);
  doc.text(`Total Miles: ${data.total_miles.toLocaleString()}`, 14, startY + 22);
  
  // Vehicle breakdown table
  autoTable(doc, {
    startY: startY + 30,
    head: [['Vehicle', 'Miles', 'Gallons', 'MPG']],
    body: data.by_vehicle.map(vehicle => [
      vehicle.license_plate,
      vehicle.miles.toLocaleString(),
      vehicle.gallons.toFixed(1),
      vehicle.mpg.toFixed(2)
    ]),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
  });
  
  addFooter(doc);
  doc.save(`fleet-mpg_${Date.now()}.pdf`);
};

export const exportSourceComparisonToPDF = (
  data: SourceComparison[],
  options: PDFExportOptions
) => {
  const doc = new jsPDF();
  const startY = addHeader(doc, { ...options, title: 'Fuel Source Comparison Report' });
  
  autoTable(doc, {
    startY,
    head: [['Source Type', 'Gallons', 'Total Cost', 'Avg $/Gal', 'Transactions']],
    body: data.map(source => [
      source.source_type,
      source.total_gallons.toFixed(1),
      `$${source.total_cost.toFixed(2)}`,
      `$${source.avg_cost_per_gallon.toFixed(3)}`,
      source.transaction_count.toString()
    ]),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
  });
  
  addFooter(doc);
  doc.save(`source-comparison_${Date.now()}.pdf`);
};

export const exportAnalyticsSummaryToPDF = (
  data: {
    costPerMile: number;
    totalMiles: number;
    fleetMPG: number;
    totalGallons: number;
    totalCost: number;
    sourceCount: number;
  },
  options: PDFExportOptions
) => {
  const doc = new jsPDF();
  const startY = addHeader(doc, { ...options, title: 'Fuel Analytics Summary' });
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  
  const metrics = [
    { label: 'Cost Per Mile', value: `$${data.costPerMile.toFixed(3)}` },
    { label: 'Total Miles Driven', value: data.totalMiles.toLocaleString() },
    { label: 'Fleet Average MPG', value: `${data.fleetMPG.toFixed(2)} MPG` },
    { label: 'Total Gallons Consumed', value: data.totalGallons.toFixed(1) },
    { label: 'Total Fuel Cost', value: `$${data.totalCost.toFixed(2)}` },
    { label: 'Active Fuel Sources', value: data.sourceCount.toString() },
  ];
  
  let yPos = startY;
  metrics.forEach((metric, idx) => {
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(metric.label, 14, yPos);
    
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(metric.value, 14, yPos + 8);
    
    yPos += 20;
    
    if (idx < metrics.length - 1) {
      doc.setDrawColor(230);
      doc.line(14, yPos - 4, doc.internal.pageSize.getWidth() - 14, yPos - 4);
    }
  });
  
  addFooter(doc);
  doc.save(`analytics-summary_${Date.now()}.pdf`);
};

export const exportTransactionsToPDF = (
  data: UnifiedFuelConsumption[],
  options: PDFExportOptions
) => {
  const doc = new jsPDF('landscape');
  const startY = addHeader(doc, { ...options, title: 'Fuel Transactions Report' });
  
  autoTable(doc, {
    startY,
    head: [['Date', 'Source Type', 'Source Name', 'Vehicle', 'Gallons', 'Cost', '$/Gal', 'Odometer']],
    body: data.map(log => [
      log.fuel_date,
      log.source_type,
      log.source_name || '-',
      log.vehicle_id || '-',
      log.gallons?.toFixed(2) || '0',
      `$${log.cost?.toFixed(2) || '0'}`,
      `$${log.cost_per_gallon?.toFixed(3) || '0'}`,
      log.odometer_reading || '-'
    ]),
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
  });
  
  addFooter(doc);
  doc.save(`fuel-transactions_${Date.now()}.pdf`);
};
