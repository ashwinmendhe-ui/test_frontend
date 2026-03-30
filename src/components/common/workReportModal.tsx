import { Button, Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ReportData } from "@/stores/historyStore";

interface WorkReportModalProps {
  open: boolean;
  onCancel: () => void;
  reportData: ReportData;
  autoDownload?: boolean;
}

interface BookmarkRow {
  key: string;
  time: string;
  label: string;
  type: string;
  detail: string;
}

const dangerKeywords = ["NO-", "DANGER", "WARNING", "위험"];

export default function WorkReportModal({
  open,
  onCancel,
  reportData,
  autoDownload = false,
}: WorkReportModalProps) {
  const { t } = useTranslation();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalDetectCount = useMemo(() => {
    return Object.values(reportData.labelCounts || {}).reduce(
      (sum, value) => sum + value,
      0
    );
  }, [reportData.labelCounts]);

  const summaryRows = useMemo(() => {
    return Object.entries(reportData.labelCounts || {}).map(([label, count]) => ({
      label,
      count,
      type: dangerKeywords.some((keyword) =>
        label.toUpperCase().includes(keyword)
      )
        ? t("work_report_danger")
        : t("work_report_common"),
    }));
  }, [reportData.labelCounts, t]);

  const bookmarkRows: BookmarkRow[] = useMemo(() => {
    return (reportData.bookmarks || []).map((item, index) => {
      const detectType = dangerKeywords.some((keyword) =>
        item.label.toUpperCase().includes(keyword)
      )
        ? t("work_report_danger")
        : t("work_report_common");

      return {
        key: `${item.label}-${index}`,
        time: item.mdisplay || item.duration || "-",
        label: item.label,
        type: detectType,
        detail: t("work_report_detail_view"),
      };
    });
  }, [reportData.bookmarks, t]);

  const handlePdfDownload = async () => {
    if (!pdfRef.current) return;

    try {
      setIsGenerating(true);

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${t("history_download_filename")}_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (open && autoDownload) {
      const timer = setTimeout(() => {
        handlePdfDownload();
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [open, autoDownload]);

  const bookmarkColumns: ColumnsType<BookmarkRow> = [
    {
      title: t("work_report_timestamp"),
      dataIndex: "time",
      key: "time",
      width: 140,
    },
    {
      title: t("work_report_detect_content"),
      dataIndex: "label",
      key: "label",
    },
    {
      title: t("work_report_detect_type"),
      dataIndex: "type",
      key: "type",
      width: 120,
    },
    {
      title: t("work_report_detail_view"),
      dataIndex: "detail",
      key: "detail",
      width: 120,
      render: (value: string) => (
        <span className="text-[#0088FF] font-medium cursor-pointer">
          {value}
        </span>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
      className="work-report-modal"
      destroyOnHidden
    >
      <div ref={pdfRef} className="bg-white p-4">
        <div className="flex items-start justify-between border-b pb-4 mb-6">
          <div>
            <div className="flex items-center">
              <span className="text-[28px] font-bold text-[#333D4B]">
                {t("work_report_title")}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {t("work_report_created_at")}:{" "}
              {reportData.reportCreatedAt || reportData.endTime || "-"}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onCancel}>{t("work_report_close")}</Button>
            <Button
              type="primary"
              onClick={handlePdfDownload}
              loading={isGenerating}
            >
              {isGenerating
                ? t("work_report_pdf_generating")
                : t("work_report_pdf_download")}
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-[20px] font-semibold text-[#333D4B] mb-4">
            {t("work_report_operation_info")}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F6F7F9] rounded-[10px] p-4">
              <div className="text-sm text-gray-500">
                {t("work_report_device_sn")}
              </div>
              <div className="text-base font-medium">
                {reportData.deviceSn || "-"}
              </div>
            </div>

            <div className="bg-[#F6F7F9] rounded-[10px] p-4">
              <div className="text-sm text-gray-500">
                {t("history_site_name")}
              </div>
              <div className="text-base font-medium">
                {reportData.siteName || "-"}
              </div>
            </div>

            <div className="bg-[#F6F7F9] rounded-[10px] p-4">
              <div className="text-sm text-gray-500">
                {t("history_robot_name")}
              </div>
              <div className="text-base font-medium">
                {reportData.robotName || reportData.deviceName || "-"}
              </div>
            </div>

            <div className="bg-[#F6F7F9] rounded-[10px] p-4">
              <div className="text-sm text-gray-500">
                {t("history_mission_name")}
              </div>
              <div className="text-base font-medium">
                {reportData.missionName || "-"}
              </div>
            </div>

            <div className="bg-[#F6F7F9] rounded-[10px] p-4">
              <div className="text-sm text-gray-500">
                {t("history_worker_name")}
              </div>
              <div className="text-base font-medium">
                {reportData.workerName || reportData.userName || "-"}
              </div>
            </div>

            <div className="bg-[#F6F7F9] rounded-[10px] p-4">
              <div className="text-sm text-gray-500">
                {t("work_report_total_detect")}
              </div>
              <div className="text-base font-medium">{totalDetectCount}</div>
            </div>

            <div className="bg-[#F6F7F9] rounded-[10px] p-4">
              <div className="text-sm text-gray-500">
                {t("work_report_start_time")}
              </div>
              <div className="text-base font-medium">
                {reportData.startTime || "-"}
              </div>
            </div>

            <div className="bg-[#F6F7F9] rounded-[10px] p-4">
              <div className="text-sm text-gray-500">
                {t("work_report_end_time")}
              </div>
              <div className="text-base font-medium">
                {reportData.endTime || "-"}
              </div>
            </div>

            <div className="bg-[#F6F7F9] rounded-[10px] p-4">
              <div className="text-sm text-gray-500">
                {t("work_report_duration")}
              </div>
              <div className="text-base font-medium">
                {reportData.duration || reportData.totalTime || "-"}
              </div>
            </div>

            <div className="bg-[#F6F7F9] rounded-[10px] p-4">
              <div className="text-sm text-gray-500">
                {t("work_report_playback_url")}
              </div>
              <div className="text-base font-medium break-all">
                {reportData.playbackUrl || "-"}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-[20px] font-semibold text-[#333D4B] mb-4">
            {t("work_report_ai_summary")}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {summaryRows.map((item) => (
              <div key={item.label} className="bg-[#F6F7F9] rounded-[10px] p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#333D4B]">
                    {item.label}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      item.type === t("work_report_danger")
                        ? "bg-[#FFE5E5] text-[#FF3B30]"
                        : "bg-[#EAFBF0] text-[#34C759]"
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
                <div className="text-2xl font-bold text-[#333D4B] mt-2">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[20px] font-semibold text-[#333D4B] mb-4">
            {t("work_report_ai_by_time")}
          </h3>

          <Table
            columns={bookmarkColumns}
            dataSource={bookmarkRows}
            pagination={false}
            rowKey="key"
          />
        </div>
      </div>
    </Modal>
  );
}