
import { Modal, Button, message } from "antd";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { downloadWorkReportPdf } from "@/utils/downloadWorkReportPdf";
import WorkReportContent from "./WorkReportContent";
import type {
  ReportData,
  HistoryManagementTable,
} from "@/stores/historyStore";

interface Props {
  open: boolean;
  onClose: () => void;
  detail: ReportData;
  reportMeta?: HistoryManagementTable | null;
}

const WorkReportModal: React.FC<Props> = ({
  open,
  onClose,
  detail,
  reportMeta,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const reportRef = useRef<HTMLDivElement>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);


const handleDownload = async () => {
  if (!reportRef.current || isDownloading) {
    return;
  }

  try {
    setIsDownloading(true);
    setIsExportingPdf(true);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    await downloadWorkReportPdf(reportRef.current, detail);
  } catch (error) {
    console.error("Failed to download work report PDF:", error);
    message.error("Failed to download PDF.");
  } finally {
    setIsExportingPdf(false);
    setIsDownloading(false);
  }
};

const handleViewDetail = (record: {
  label: string;
  mdisplay: string;
  duration?: string;
}) => {
  navigate("/playback", {
    state: {
      playbackUrl: detail.playbackUrl,
      timestamp: record.duration || "00:00:00",
      displayTime: record.mdisplay,
      label: record.label,

      companyId: reportMeta!.companyId,
      siteId: reportMeta!.siteId,
      missionId: reportMeta!.missionId,
      deviceSn: detail.deviceSn,

      historyDetail: detail,
      historyMeta: reportMeta,
    },
  });
};

  return (
  <Modal open={open} onCancel={onClose} footer={null} width={1250}>
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-end gap-4">
        <h2 className="text-2xl font-semibold">
          {t("work_report_title")}
        </h2>

        <p className="text-sm text-gray-500">
          {t("work_report_created")}: {detail.reportCreatedAt}
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={onClose}>
          {t("button_close")}
        </Button>

        <Button
          type="primary"
          onClick={handleDownload}
          loading={isDownloading}
          disabled={isDownloading}
        >
          {isDownloading
            ? "Generating PDF..."
            : t("work_report_download_pdf")}
        </Button>
      </div>
    </div>

    <WorkReportContent
      detail={detail}
      reportMeta={reportMeta}
      reportRef={reportRef}
      isExportingPdf={isExportingPdf}
      onViewDetail={handleViewDetail}
    />
  </Modal>
);
};

export default WorkReportModal;