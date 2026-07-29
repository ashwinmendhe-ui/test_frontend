import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import type { ReportData } from "@/stores/historyStore";

export async function downloadWorkReportPdf(
  reportElement: HTMLDivElement,
  detail: ReportData
): Promise<void> {
  const canvas = await html2canvas(reportElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
    windowWidth: reportElement.scrollWidth,
    windowHeight: reportElement.scrollHeight,
  });

  const imageData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 8;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;

  const renderedImageHeight =
    (canvas.height * printableWidth) / canvas.width;

  let remainingHeight = renderedImageHeight;
  let verticalOffset = 0;
  let pageNumber = 0;

  while (remainingHeight > 0) {
    if (pageNumber > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      imageData,
      "PNG",
      margin,
      margin - verticalOffset,
      printableWidth,
      renderedImageHeight,
      undefined,
      "FAST"
    );

    remainingHeight -= printableHeight;
    verticalOffset += printableHeight;
    pageNumber += 1;
  }

  const deviceName = detail.deviceName || detail.deviceSn || "device";
  const safeDeviceName = deviceName.replace(/[^a-zA-Z0-9-_]/g, "_");

  const reportDate =
    detail.reportCreatedAt?.slice(0, 10) ||
    new Date().toISOString().slice(0, 10);

  pdf.save(`work-report-${safeDeviceName}-${reportDate}.pdf`);
}