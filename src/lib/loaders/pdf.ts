/**
 * Dynamic loader for PDF generation libraries
 * Prevents jsPDF, jspdf-autotable, and html2canvas from landing in main bundle
 */

export async function loadPdfLibs() {
  const [jsPDFMod, autoTableMod, html2canvasMod] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    import('html2canvas'),
  ]);
  
  return {
    jsPDF: jsPDFMod.default,
    autoTable: autoTableMod.default,
    html2canvas: html2canvasMod.default,
  };
}

export type PdfLibs = Awaited<ReturnType<typeof loadPdfLibs>>;
