import ActionIcon from "@/assets/table-action-icon.svg";
import ActionMenu from "@/components/common/actionMenu";
import WorkReportModal from "@/components/common/workReportModal";
import { SortableTable, type SortableTableColumn } from "@/components/common/table";
import { useHistoryStore, type HistoryManagementTable, type ReportData, } from "@/stores/historyStore";
import { DatePicker, Dropdown, Input , message} from "antd";
import type { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import HighlightText from "@/components/common/HighlightText";
import { filterByQuery } from "@/utils/filterByQuery";

import WorkReportContent from "@/components/common/WorkReportContent";
import { downloadWorkReportPdf } from "@/utils/downloadWorkReportPdf";

const { Search } = Input;
const { RangePicker } = DatePicker;

export default function History() {
  const { t } = useTranslation();
  const { loading, list, getList, getDetail, detail } = useHistoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedHistory, setSelectedHistory] =
    useState<HistoryManagementTable | null>(null);

  const handleView = async (record: HistoryManagementTable) => {
  await getDetail(record.historyId);
  setSelectedHistory(record);
  setIsModalOpen(true);
};
  const handleDownload = async (record: HistoryManagementTable) => {
  if (downloadingHistoryId !== null) {
    return;
  }

  try {
    setDownloadingHistoryId(record.historyId);

    const reportDetail = await getDetail(record.historyId);

    setSelectedHistory(record);
    setDownloadDetail(reportDetail);
  } catch (error) {
    console.error("Failed to prepare work report PDF:", error);
    message.error("Failed to download PDF.");
    setDownloadingHistoryId(null);
  }
};

  const handleCancel = () => {
  setIsModalOpen(false);
};

  const columns = [
    {
      title: t("table_id"),
      key: "rowIndex",
      enableSort: false,
      render: (_: unknown, __: HistoryManagementTable, index: number) => index + 1,
    },
    {
      title: t("history_created_at"),
      dataIndex: "createdAt",
      key: "createdAt",
      enableSort: true,
      render: (item: string) => <>{item || "-"}</>,    },
    {
      title: t("history_company_name"),
      dataIndex: "companyName",
      key: "companyName",
      enableSort: true,
      render: (value: string) => <HighlightText text={value} query={searchKeyword} />,
    },
    {
      title: t("history_site_name"),
      dataIndex: "siteName",
      key: "siteName",
      enableSort: true,
      render: (value: string) => <HighlightText text={value} query={searchKeyword} />,
    },
    {
      title: t("history_mission_name"),
      dataIndex: "missionName",
      key: "missionName",
      enableSort: true,
      render: (value: string) => <HighlightText text={value} query={searchKeyword} />,
    },
    {
      title: t("history_robot_name"),
      dataIndex: "deviceName",
      key: "deviceName",
      enableSort: true,
      render: (value: string) => <HighlightText text={value} query={searchKeyword} />,
    },
    {
      title: t("history_worker_name"),
      dataIndex: "userName",
      key: "userName",
      enableSort: true,
      render: (value: string) => <HighlightText text={value} query={searchKeyword} />,
    },
    {
      title: t("history_total_recognition"),
      dataIndex: "totalRecognition",
      key: "totalRecognition",
      enableSort: false,
    },
    {
      title: "",
      key: "action",
      render: (_: unknown, record: HistoryManagementTable) => (
        <Dropdown
          className="relative"
          trigger={["hover"]}
          popupRender={() => (
            <ActionMenu
            onEdit={() => handleView(record)}
            onDownload={() => handleDownload(record)}
            isShowEdit={true}
            isShowDownload={true}
            isShowDelete={false}
            editLabel={t("history_view_report")}
            isDownloading={downloadingHistoryId === record.historyId}
          />
          )}
        >
          <a onClick={(e) => e.preventDefault()}>
            <img src={ActionIcon} alt="ActionIcon" />
          </a>
        </Dropdown>
      ),
    },
  ] satisfies SortableTableColumn<HistoryManagementTable>[];

  const searchFilteredList = filterByQuery(list, searchKeyword, [
    "companyName",
    "siteName",
    "missionName",
    "deviceName",
    "deviceSn",
    "userName",
  ]);

  const filteredList = searchFilteredList.filter((item) => {
    const matchesDate =
      !dateRange ||
      !dateRange[0] ||
      !dateRange[1] ||
      (() => {
        const itemDate = new Date(item.createdAt.replace(" ", "T")).getTime();
        const from = dateRange[0]?.startOf("day").valueOf() ?? 0;
        const to = dateRange[1]?.endOf("day").valueOf() ?? 0;
        return itemDate >= from && itemDate <= to;
      })();

    return matchesDate;
  });

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
  };


  const directDownloadRef = useRef<HTMLDivElement>(null);

const [downloadDetail, setDownloadDetail] =
  useState<ReportData | null>(null);

const [downloadingHistoryId, setDownloadingHistoryId] =
  useState<string | number | null>(null);

  useEffect(() => {
    getList();
  }, [getList]);

  useEffect(() => {
  if (
    !downloadDetail ||
    !directDownloadRef.current ||
    downloadingHistoryId === null
  ) {
    return;
  }

  let cancelled = false;

  const generatePdf = async () => {
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      if (cancelled || !directDownloadRef.current) {
        return;
      }

      await downloadWorkReportPdf(
        directDownloadRef.current,
        downloadDetail
      );
    } catch (error) {
      console.error("Failed to download work report PDF:", error);
      message.error("Failed to download PDF.");
    } finally {
      if (!cancelled) {
        setDownloadDetail(null);
        setDownloadingHistoryId(null);
      }
    }
  };

  void generatePdf();

  return () => {
    cancelled = true;
  };
}, [downloadDetail, downloadingHistoryId]);

  return (
    <>
      <div className="w-full relative">
        {loading && (
          <div className="mb-3 text-sm text-gray-500">{t("common_loading")}</div>
        )}

        <div className="flex gap-4 mt-[26px] mb-[22px] w-1/2">
          <RangePicker
            size="large"
            className="min-w-[300px]"
            onChange={handleDateRangeChange}
            value={dateRange}
            placeholder={[t("common_from"), t("common_to")]}
          />
          <Search
            size="large"
            placeholder={t("history_search_placeholder")}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="flex-1 rounded-[7px]"
            allowClear
          />
        </div>

        <SortableTable columns={columns} data={filteredList} rowKey="historyId" />
      </div>

      <WorkReportModal
        open={isModalOpen}
        onClose={handleCancel}
        detail={detail}
        reportMeta={selectedHistory}
      />

      {downloadDetail && (
  <div
    aria-hidden="true"
    style={{
      position: "fixed",
      left: "-10000px",
      top: 0,
      width: "1200px",
      pointerEvents: "none",
      opacity: 0,
    }}
  >
    <WorkReportContent
      detail={downloadDetail}
      reportMeta={selectedHistory}
      reportRef={directDownloadRef}
      isExportingPdf={true}
    />
  </div>
)}
    </>
  );
}