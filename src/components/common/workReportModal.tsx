import {
  Button,
  Input,
  message,
  Modal,
} from "antd";
import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { downloadWorkReportPdf } from "@/utils/downloadWorkReportPdf";
import WorkReportContent from "./WorkReportContent";

import {
  useHistoryStore,
  type ReportData,
  type HistoryManagementTable,
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

  const { updateWorkIssue } = useHistoryStore();

  const reportRef =
    useRef<HTMLDivElement>(null);

  const [isDownloading, setIsDownloading] =
    useState(false);

  const [isExportingPdf, setIsExportingPdf] =
    useState(false);

  const [isIssueModalOpen, setIsIssueModalOpen] =
    useState(false);

  const [workIssueText, setWorkIssueText] =
    useState("");

  const [savingWorkIssue, setSavingWorkIssue] =
    useState(false);

  const [currentDetail, setCurrentDetail] =
    useState<ReportData>(detail);

  /*
   * Keep local report detail synchronized whenever
   * a new History record is opened.
   */
  useEffect(() => {
    setCurrentDetail(detail);
    setWorkIssueText(detail.workIssue || "");
  }, [detail]);

  const handleDownload = async () => {
    if (
      !reportRef.current ||
      isDownloading
    ) {
      return;
    }

    try {
      setIsDownloading(true);
      setIsExportingPdf(true);

      await new Promise<void>(
        (resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(
              () => resolve()
            );
          });
        }
      );

      await downloadWorkReportPdf(
        reportRef.current,
        currentDetail
      );
    } catch (error) {
      console.error(
        "Failed to download work report PDF:",
        error
      );

      message.error(
        t("work_report_pdf_failed")
      );
    } finally {
      setIsExportingPdf(false);
      setIsDownloading(false);
    }
  };

  const handlePlayVideo = () => {
    if (!currentDetail.playbackUrl) {
      message.warning(
        t("history_video_unavailable")
      );

      return;
    }

    if (!reportMeta) {
      message.warning(
        t("work_report_playback_info_unavailable")
      );

      return;
    }

    navigate("/playback", {
      state: {
        playbackUrl:
          currentDetail.playbackUrl,

        timestamp: "00:00:00",
        displayTime: "",
        label: "",

        companyId:
          reportMeta.companyId,

        siteId:
          reportMeta.siteId,

        missionId:
          reportMeta.missionId,

        deviceSn:
          currentDetail.deviceSn,

        historyDetail:
          currentDetail,

        historyMeta:
          reportMeta,
      },
    });
  };

  const handleViewDetail = (
    record: {
      label: string;
      mdisplay: string;
      duration?: string;
    }
  ) => {
    if (!currentDetail.playbackUrl) {
      message.warning(
        t("history_video_unavailable")
      );

      return;
    }

    if (!reportMeta) {
      message.warning(
        t("work_report_playback_info_unavailable")
      );

      return;
    }

    navigate("/playback", {
      state: {
        playbackUrl:
          currentDetail.playbackUrl,

        timestamp:
          record.duration ||
          "00:00:00",

        displayTime:
          record.mdisplay,

        label:
          record.label,

        companyId:
          reportMeta.companyId,

        siteId:
          reportMeta.siteId,

        missionId:
          reportMeta.missionId,

        deviceSn:
          currentDetail.deviceSn,

        historyDetail:
          currentDetail,

        historyMeta:
          reportMeta,
      },
    });
  };

  /*
   * Work Issue
   */

  const handleOpenWorkIssue = () => {
    setWorkIssueText(
      currentDetail.workIssue || ""
    );

    setIsIssueModalOpen(true);
  };

  const handleCloseWorkIssue = () => {
    if (savingWorkIssue) {
      return;
    }

    setIsIssueModalOpen(false);

    setWorkIssueText(
      currentDetail.workIssue || ""
    );
  };

  const handleSaveWorkIssue = async () => {
    const historyId =
      currentDetail.historyId ||
      reportMeta?.historyId;

    if (!historyId) {
      message.error(
        t(
          "work_report_history_id_unavailable"
        )
      );

      return;
    }

    try {
      setSavingWorkIssue(true);

      const updated =
        await updateWorkIssue(
          historyId,
          workIssueText
        );

      /*
       * updateWorkIssue already updates Zustand.
       * Keep this modal's local copy synchronized too.
       */
      setCurrentDetail(updated);

      setWorkIssueText(
        updated.workIssue || ""
      );

      setIsIssueModalOpen(false);

      message.success(
        t("history_work_issue_saved")
      );
    } catch (error) {
      console.error(
        "Failed to save work issue from Work Report:",
        error
      );

      message.error(
        t(
          "history_work_issue_save_failed"
        )
      );
    } finally {
      setSavingWorkIssue(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width={1250}
        closable={false}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-end gap-4">
            <h2 className="text-2xl font-semibold">
              {t("work_report_title")}
            </h2>

            <p className="text-sm text-gray-500">
              {t(
                "work_report_created"
              )}
              :{" "}
              {
                currentDetail.reportCreatedAt
              }
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onClose}
            >
              {t("button_close")}
            </Button>

            <Button
              onClick={
                handleOpenWorkIssue
              }
            >
              {currentDetail.workIssue
                ? t(
                    "work_report_edit_work_issue"
                  )
                : t(
                    "work_report_add_work_issue"
                  )}
            </Button>

            <Button
              onClick={handlePlayVideo}
              disabled={
                !currentDetail.playbackUrl
              }
            >
              {t(
                "history_play_video"
              )}
            </Button>

            <Button
              type="primary"
              onClick={handleDownload}
              loading={isDownloading}
              disabled={isDownloading}
            >
              {isDownloading
                ? t(
                    "work_report_generating_pdf"
                  )
                : t(
                    "work_report_download_pdf"
                  )}
            </Button>
          </div>
        </div>

        <WorkReportContent
          detail={currentDetail}
          reportMeta={reportMeta}
          reportRef={reportRef}
          isExportingPdf={
            isExportingPdf
          }
          onViewDetail={
            handleViewDetail
          }
        />
      </Modal>

      {/* Work Issue editor */}
      <Modal
        open={isIssueModalOpen}
        title={t(
          "history_work_issue"
        )}
        onCancel={
          handleCloseWorkIssue
        }
        onOk={
          handleSaveWorkIssue
        }
        okText={t(
          "history_work_issue_save"
        )}
        cancelText={t(
          "history_filter_cancel"
        )}
        confirmLoading={
          savingWorkIssue
        }
        destroyOnHidden
      >
        <Input.TextArea
          value={workIssueText}
          onChange={(e) =>
            setWorkIssueText(
              e.target.value
            )
          }
          placeholder={t(
            "history_work_issue_placeholder"
          )}
          autoSize={{
            minRows: 4,
            maxRows: 8,
          }}
          maxLength={1000}
          showCount
        />
      </Modal>
    </>
  );
};

export default WorkReportModal;