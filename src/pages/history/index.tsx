import ActionIcon from "@/assets/table-action-icon.svg";
import ActionMenu from "@/components/common/actionMenu";
import WorkReportModal from "@/components/common/workReportModal";
import { SortableTable, type SortableTableColumn } from "@/components/common/table";
import { useHistoryStore, type HistoryManagementTable } from "@/stores/historyStore";
import { formatDateTime } from "@/utils/date";
import { DatePicker, Dropdown, Input } from "antd";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import HighlightText from "@/components/common/HighlightText";
import { filterByQuery } from "@/utils/filterByQuery";

const { Search } = Input;
const { RangePicker } = DatePicker;

export default function History() {
  const { t } = useTranslation();
  const { loading, list, getList, getDetail, detail } = useHistoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleView = async (record: HistoryManagementTable) => {
    await getDetail(record.historyId);
    setAutoDownload(false);
    setIsModalOpen(true);
  };

  const handleDownload = async (record: HistoryManagementTable) => {
    await getDetail(record.historyId);
    setAutoDownload(true);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setAutoDownload(false);
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
      render: (item: string) => <>{formatDateTime(item, true)}</>,
    },
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
              isShowDownload={true}
              isShowDelete={false}
              onEdit={() => handleView(record)}
              onDownload={() => handleDownload(record)}
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
    "userName",
  ]);

  const filteredList = searchFilteredList.filter((item) => {
    const matchesDate =
      !dateRange ||
      !dateRange[0] ||
      !dateRange[1] ||
      (() => {
        const itemDate = new Date(item.createdAt).getTime();
        const from = dateRange[0]?.startOf("day").valueOf() ?? 0;
        const to = dateRange[1]?.endOf("day").valueOf() ?? 0;
        return itemDate >= from && itemDate <= to;
      })();

    return matchesDate;
  });

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
  };

  useEffect(() => {
    getList();
  }, [getList]);

  return (
    <>
      <div className="w-full relative">
        {loading && <div className="mb-3 text-sm text-gray-500">{t("common_loading")}</div>}
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
        onCancel={handleCancel}
        reportData={detail}
        autoDownload={autoDownload}
      />
    </>
  );
}