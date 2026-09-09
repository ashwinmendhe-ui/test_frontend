import ActionIcon from "@/assets/table-action-icon.svg";
import ActionMenu from "@/components/common/actionMenu";
import WorkReportModal from "@/components/common/workReportModal";
import { useNavigate } from "react-router-dom";
import {
  SortableTable,
  type SortableTableColumn,
} from "@/components/common/table";
import {
  useHistoryStore,
  type HistoryManagementTable,
  type ReportData,
} from "@/stores/historyStore";
import {
  Button,
  Checkbox,
  DatePicker,
  Dropdown,
  Input,
  message,
  Modal,
} from "antd";
import type { Dayjs } from "dayjs";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import HighlightText from "@/components/common/HighlightText";
import { filterByQuery } from "@/utils/filterByQuery";

import WorkReportContent from "@/components/common/WorkReportContent";
import { downloadWorkReportPdf } from "@/utils/downloadWorkReportPdf";

const { Search } = Input;
const { RangePicker } = DatePicker;

const WORK_ISSUE_HAS = "HAS_ISSUE";
const WORK_ISSUE_NONE = "NO_ISSUE";

interface HistoryFilters {
  companyIds: string[];
  siteIds: string[];
  missionIds: string[];
  deviceSns: string[];
  workers: string[];
  detectionTypes: string[];
  workIssues: string[];
}

type AvailableFilterKey =
  | "companyIds"
  | "siteIds"
  | "missionIds"
  | "deviceSns"
  | "workers"
  | "detectionTypes"
  | "workIssues";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterCategory {
  key: AvailableFilterKey;
  label: string;
  options: FilterOption[];
}

const EMPTY_FILTERS: HistoryFilters = {
  companyIds: [],
  siteIds: [],
  missionIds: [],
  deviceSns: [],
  workers: [],
  detectionTypes: [],
  workIssues: [],
};

export default function History() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    loading,
    list,
    getList,
    getDetail,
    updateWorkIssue,
    detail,
  } = useHistoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [searchKeyword, setSearchKeyword] = useState("");

  const [selectedHistory, setSelectedHistory] =
    useState<HistoryManagementTable | null>(null);

  const [filters, setFilters] = useState<HistoryFilters>({
    ...EMPTY_FILTERS,
  });

  const [draftFilters, setDraftFilters] =
    useState<HistoryFilters>({
      ...EMPTY_FILTERS,
    });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [activeFilterCategory, setActiveFilterCategory] =
    useState<AvailableFilterKey>("companyIds");

  const [filterSearchKeyword, setFilterSearchKeyword] =
    useState("");

  const [downloadDetail, setDownloadDetail] =
    useState<ReportData | null>(null);

  const [downloadingHistoryId, setDownloadingHistoryId] =
    useState<string | number | null>(null);

  const [isWorkIssueModalOpen, setIsWorkIssueModalOpen] =
    useState(false);

  const [workIssueRecord, setWorkIssueRecord] =
    useState<HistoryManagementTable | null>(null);

  const [workIssueText, setWorkIssueText] =
    useState("");

  const [savingWorkIssue, setSavingWorkIssue] =
    useState(false);

  const directDownloadRef = useRef<HTMLDivElement>(null);

  /*
   * Filter options
   */

  const companyOptions = useMemo<FilterOption[]>(() => {
    const map = new Map<string, string>();

    list.forEach((item) => {
      if (item.companyId && item.companyName) {
        map.set(item.companyId, item.companyName);
      }
    });

    return Array.from(map, ([value, label]) => ({
      value,
      label,
    }));
  }, [list]);

  const siteOptions = useMemo<FilterOption[]>(() => {
    const map = new Map<string, string>();

    list.forEach((item) => {
      if (item.siteId && item.siteName) {
        map.set(item.siteId, item.siteName);
      }
    });

    return Array.from(map, ([value, label]) => ({
      value,
      label,
    }));
  }, [list]);

  const missionOptions = useMemo<FilterOption[]>(() => {
    const map = new Map<string, string>();

    list.forEach((item) => {
      if (item.missionId && item.missionName) {
        map.set(item.missionId, item.missionName);
      }
    });

    return Array.from(map, ([value, label]) => ({
      value,
      label,
    }));
  }, [list]);

  const robotOptions = useMemo<FilterOption[]>(() => {
    const map = new Map<string, string>();

    list.forEach((item) => {
      if (item.deviceSn && item.deviceName) {
        map.set(item.deviceSn, item.deviceName);
      }
    });

    return Array.from(map, ([value, label]) => ({
      value,
      label,
    }));
  }, [list]);

  const workerOptions = useMemo<FilterOption[]>(() => {
    return Array.from(
      new Set(
        list
          .map((item) => item.userName)
          .filter(
            (name): name is string =>
              Boolean(name && name.trim())
          )
      )
    )
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        value: name,
        label: name,
      }));
  }, [list]);

  const detectionTypeOptions =
    useMemo<FilterOption[]>(() => {
      const values = new Set<string>();

      list.forEach((item) => {
        (item.detectionTypes || []).forEach(
          (detectionType) => {
            if (detectionType?.trim()) {
              values.add(detectionType.trim());
            }
          }
        );
      });

      return Array.from(values)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({
          value,
          label: value,
        }));
    }, [list]);

  const workIssueOptions =
    useMemo<FilterOption[]>(
      () => [
        {
          value: WORK_ISSUE_HAS,
          label: t("history_has_work_issue"),
        },
        {
          value: WORK_ISSUE_NONE,
          label: t("history_no_work_issue"),
        },
      ],
      [t]
    );

  const filterCategories = useMemo<FilterCategory[]>(
    () => [
      {
        key: "companyIds",
        label: t("history_company_name"),
        options: companyOptions,
      },
      {
        key: "siteIds",
        label: t("history_site_name"),
        options: siteOptions,
      },
      {
        key: "missionIds",
        label: t("history_mission_name"),
        options: missionOptions,
      },
      {
        key: "deviceSns",
        label: t("history_robot_name"),
        options: robotOptions,
      },
      {
        key: "workers",
        label: t("history_worker_name"),
        options: workerOptions,
      },
      {
        key: "detectionTypes",
        label: t("history_detection_type"),
        options: detectionTypeOptions,
      },
      {
        key: "workIssues",
        label: t("history_work_issue"),
        options: workIssueOptions,
      },
    ],
    [
      t,
      companyOptions,
      siteOptions,
      missionOptions,
      robotOptions,
      workerOptions,
      detectionTypeOptions,
      workIssueOptions,
    ]
  );

  const activeCategory = useMemo(
    () =>
      filterCategories.find(
        (category) =>
          category.key === activeFilterCategory
      ) ?? filterCategories[0],
    [filterCategories, activeFilterCategory]
  );

  const visibleFilterOptions = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    const keyword = filterSearchKeyword
      .trim()
      .toLowerCase();

    if (!keyword) {
      return activeCategory.options;
    }

    return activeCategory.options.filter((option) =>
      option.label
        .toLowerCase()
        .includes(keyword)
    );
  }, [activeCategory, filterSearchKeyword]);

  /*
   * Work Report
   */

  const handleView = async (
    record: HistoryManagementTable
  ) => {
    await getDetail(record.historyId);

    setSelectedHistory(record);
    setIsModalOpen(true);
  };

  /*
   * PDF download
   */

  const handleDownload = async (
    record: HistoryManagementTable
  ) => {
    if (downloadingHistoryId !== null) {
      return;
    }

    try {
      setDownloadingHistoryId(record.historyId);

      const reportDetail = await getDetail(
        record.historyId
      );

      setSelectedHistory(record);
      setDownloadDetail(reportDetail);
    } catch (error) {
      console.error(
        "Failed to prepare work report PDF:",
        error
      );

      message.error("Failed to download PDF.");
      setDownloadingHistoryId(null);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  /*
   * Playback navigation
   */

  const handlePlayVideo = (
    record: HistoryManagementTable
  ) => {
    if (!record.playbackUrl) {
      message.warning(
        t("history_video_unavailable")
      );
      return;
    }

    navigate("/playback", {
      state: {
        playbackUrl: record.playbackUrl,
        companyId: record.companyId,
        siteId: record.siteId,
        missionId: record.missionId,
        deviceSn: record.deviceSn,

        historyDetail: {
          historyId: record.historyId,

          companyName:
            record.companyName,

          siteName:
            record.siteName,

          missionName:
            record.missionName,

          deviceName:
            record.deviceName,

          userName:
            record.userName,

          startTime:
            record.startTime,

          endTime:
            record.endTime,

          totalTime:
            record.totalTime,

          detectionTypes:
            record.detectionTypes,

          mainDetectionType:
            record.mainDetectionType,

          workIssue:
            record.workIssue,
        },
      },
    });
  };

  /*
   * Work Issue
   */

  const handleEditWorkIssue = (
    record: HistoryManagementTable
  ) => {
    setWorkIssueRecord(record);
    setWorkIssueText(record.workIssue || "");
    setIsWorkIssueModalOpen(true);
  };

  const handleCloseWorkIssueModal = () => {
    if (savingWorkIssue) {
      return;
    }

    setIsWorkIssueModalOpen(false);
    setWorkIssueRecord(null);
    setWorkIssueText("");
  };

  const handleSaveWorkIssue = async () => {
    if (!workIssueRecord) {
      return;
    }

    try {
      setSavingWorkIssue(true);

      await updateWorkIssue(
        workIssueRecord.historyId,
        workIssueText
      );

      message.success(
        t("history_work_issue_saved")
      );

      setIsWorkIssueModalOpen(false);
      setWorkIssueRecord(null);
      setWorkIssueText("");
    } catch (error) {
      console.error(
        "Failed to update work issue:",
        error
      );

      message.error(
        t("history_work_issue_save_failed")
      );
    } finally {
      setSavingWorkIssue(false);
    }
  };

  /*
   * Date filter
   */

  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    setDateRange(dates);
  };

  /*
   * Filter popup
   */

  const openFilterPanel = () => {
    setDraftFilters({
      companyIds: [...filters.companyIds],
      siteIds: [...filters.siteIds],
      missionIds: [...filters.missionIds],
      deviceSns: [...filters.deviceSns],
      workers: [...filters.workers],
      detectionTypes: [
        ...filters.detectionTypes,
      ],
      workIssues: [...filters.workIssues],
    });

    setActiveFilterCategory("companyIds");
    setFilterSearchKeyword("");
    setIsFilterOpen(true);
  };

  const handleFilterOpenChange = (
    open: boolean
  ) => {
    if (open) {
      openFilterPanel();
      return;
    }

    setIsFilterOpen(false);
    setFilterSearchKeyword("");
  };

  const toggleDraftFilter = (
    key: AvailableFilterKey,
    value: string
  ) => {
    setDraftFilters((prev) => {
      const currentValues = prev[key];

      const exists =
        currentValues.includes(value);

      return {
        ...prev,

        [key]: exists
          ? currentValues.filter(
              (item) => item !== value
            )
          : [...currentValues, value],
      };
    });
  };

  const handleApplyFilters = () => {
    setFilters({
      companyIds: [...draftFilters.companyIds],
      siteIds: [...draftFilters.siteIds],
      missionIds: [...draftFilters.missionIds],
      deviceSns: [...draftFilters.deviceSns],
      workers: [...draftFilters.workers],
      detectionTypes: [
        ...draftFilters.detectionTypes,
      ],
      workIssues: [...draftFilters.workIssues],
    });

    setFilterSearchKeyword("");
    setIsFilterOpen(false);
  };

  const handleCancelFilter = () => {
    setDraftFilters({
      companyIds: [...filters.companyIds],
      siteIds: [...filters.siteIds],
      missionIds: [...filters.missionIds],
      deviceSns: [...filters.deviceSns],
      workers: [...filters.workers],
      detectionTypes: [
        ...filters.detectionTypes,
      ],
      workIssues: [...filters.workIssues],
    });

    setFilterSearchKeyword("");
    setIsFilterOpen(false);
  };

  const removeAppliedFilter = (
    key: AvailableFilterKey,
    value: string
  ) => {
    setFilters((prev) => ({
      ...prev,

      [key]: prev[key].filter(
        (item) => item !== value
      ),
    }));
  };

  /*
   * Applied filter chips
   */

  const appliedFilterChips = useMemo(() => {
    return filterCategories.flatMap(
      (category) => {
        const selectedValues =
          filters[category.key];

        return selectedValues.map((value) => {
          const option =
            category.options.find(
              (item) => item.value === value
            );

          return {
            key: category.key,
            categoryLabel: category.label,
            value,
            valueLabel:
              option?.label ?? value,
          };
        });
      }
    );
  }, [filterCategories, filters]);

  /*
   * History table
   */

  const columns = [
    {
      title: t("table_id"),
      key: "rowIndex",
      enableSort: false,
      width: 70,

      render: (
        _: unknown,
        __: HistoryManagementTable,
        index: number
      ) => index + 1,
    },

    {
      title: t("history_work_time"),
      key: "workTime",
      enableSort: false,
      width: 190,

      render: (
        _: unknown,
        record: HistoryManagementTable
      ) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-[#111827]">
            {record.startTime ||
              record.createdAt ||
              "-"}
          </span>

          <span className="text-xs text-[#6B7280]">
            {record.totalTime || "-"}
          </span>
        </div>
      ),
    },

    {
      title: t("history_site_mission"),
      key: "siteMission",
      enableSort: false,
      width: 190,

      render: (
        _: unknown,
        record: HistoryManagementTable
      ) => (
        <div className="flex flex-col gap-1">
          <HighlightText
            text={record.siteName || "-"}
            query={searchKeyword}
          />

          <span className="text-xs text-[#6B7280]">
            <HighlightText
              text={
                record.missionName || "-"
              }
              query={searchKeyword}
            />
          </span>
        </div>
      ),
    },

    {
      title: t("history_robot_name"),
      key: "robot",
      enableSort: false,
      width: 170,

      render: (
        _: unknown,
        record: HistoryManagementTable
      ) => (
        <div className="flex flex-col gap-1">
          <HighlightText
            text={record.deviceName || "-"}
            query={searchKeyword}
          />

          <span className="text-xs text-[#6B7280]">
            {record.deviceSn || "-"}
          </span>
        </div>
      ),
    },

    {
      title: t("history_worker_name"),
      dataIndex: "userName",
      key: "userName",
      enableSort: true,
      width: 150,

      render: (value: string) => (
        <HighlightText
          text={value || "-"}
          query={searchKeyword}
        />
      ),
    },

    {
      title: t("history_detection_result"),
      key: "detectionResult",
      enableSort: false,
      width: 190,

      render: (
        _: unknown,
        record: HistoryManagementTable
      ) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-[#111827]">
            {record.totalRecognition ?? 0}
          </span>

          {record.detectionTypes?.length >
            0 && (
            <span
              className="text-xs text-[#6B7280] truncate max-w-[170px]"
              title={record.detectionTypes.join(
                ", "
              )}
            >
              {record.detectionTypes.join(
                ", "
              )}
            </span>
          )}
        </div>
      ),
    },

    {
      title: t(
        "history_main_detection_type"
      ),
      key: "mainDetectionType",
      enableSort: false,
      width: 175,

      render: (
        _: unknown,
        record: HistoryManagementTable
      ) => (
        <span
          title={
            record.mainDetectionType || ""
          }
        >
          {record.mainDetectionType || "-"}
        </span>
      ),
    },

    {
      title: t("history_work_issue"),
      key: "workIssue",
      enableSort: false,
      width: 220,

      render: (
        _: unknown,
        record: HistoryManagementTable
      ) => (
        <button
          type="button"
          onClick={() =>
            handleEditWorkIssue(record)
          }
          className="w-full text-left"
        >
          {record.workIssue ? (
            <span
              className="block truncate text-[#374151] hover:text-[#1677ff]"
              title={record.workIssue}
            >
              {record.workIssue}
            </span>
          ) : (
            <span className="text-[#9CA3AF] hover:text-[#1677ff]">
              +{" "}
              {t(
                "history_add_work_issue"
              )}
            </span>
          )}
        </button>
      ),
    },

    {
      title: "",
      key: "playVideo",
      enableSort: false,
      width: 125,

      render: (
        _: unknown,
        record: HistoryManagementTable
      ) => (
        <Button
          type="primary"
          disabled={
            !record.playbackUrl ||
            record.videoStatus !==
              "AVAILABLE"
          }
          onClick={() =>
            handlePlayVideo(record)
          }
        >
          {t("history_play_video")}
        </Button>
      ),
    },

    {
  title: "",
  key: "action",
  enableSort: false,

  render: (
    _: unknown,
    record: HistoryManagementTable
  ) => (
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
          isDownloading={
            downloadingHistoryId === record.historyId
          }
        />
      )}
    >
      <a onClick={(e) => e.preventDefault()}>
        <img
          src={ActionIcon}
          alt="ActionIcon"
        />
      </a>
    </Dropdown>
  ),
},
  ] satisfies SortableTableColumn<HistoryManagementTable>[];

  /*
   * Keyword search
   */

  const searchFilteredList = filterByQuery(
    list,
    searchKeyword,
    [
      "companyName",
      "siteName",
      "missionName",
      "deviceName",
      "deviceSn",
      "userName",
      "workIssue",
      "mainDetectionType",
    ]
  );

  /*
   * Structured filtering
   */

  const filteredList =
    searchFilteredList.filter((item) => {
      const matchesDate =
        !dateRange ||
        !dateRange[0] ||
        !dateRange[1] ||
        (() => {
          const itemDate = new Date(
            item.createdAt.replace(
              " ",
              "T"
            )
          ).getTime();

          const from =
            dateRange[0]
              .startOf("day")
              .valueOf();

          const to =
            dateRange[1]
              .endOf("day")
              .valueOf();

          return (
            itemDate >= from &&
            itemDate <= to
          );
        })();

      const matchesCompany =
        filters.companyIds.length === 0 ||
        (!!item.companyId &&
          filters.companyIds.includes(
            item.companyId
          ));

      const matchesSite =
        filters.siteIds.length === 0 ||
        (!!item.siteId &&
          filters.siteIds.includes(
            item.siteId
          ));

      const matchesMission =
        filters.missionIds.length === 0 ||
        (!!item.missionId &&
          filters.missionIds.includes(
            item.missionId
          ));

      const matchesRobot =
        filters.deviceSns.length === 0 ||
        (!!item.deviceSn &&
          filters.deviceSns.includes(
            item.deviceSn
          ));

      const matchesWorker =
        filters.workers.length === 0 ||
        filters.workers.includes(
          item.userName
        );

      const matchesDetectionType =
        filters.detectionTypes.length ===
          0 ||
        filters.detectionTypes.some(
          (selectedType) =>
            (
              item.detectionTypes || []
            ).includes(selectedType)
        );

      const hasWorkIssue =
        Boolean(item.workIssue?.trim());

      const matchesWorkIssue =
        filters.workIssues.length === 0 ||
        filters.workIssues.some(
          (selectedIssue) => {
            if (
              selectedIssue ===
              WORK_ISSUE_HAS
            ) {
              return hasWorkIssue;
            }

            if (
              selectedIssue ===
              WORK_ISSUE_NONE
            ) {
              return !hasWorkIssue;
            }

            return false;
          }
        );

      return (
        matchesDate &&
        matchesCompany &&
        matchesSite &&
        matchesMission &&
        matchesRobot &&
        matchesWorker &&
        matchesDetectionType &&
        matchesWorkIssue
      );
    });

  /*
   * Filter popup
   */

  const filterPopup = (
    <div
      className="bg-white rounded-[8px] shadow-lg overflow-hidden"
      style={{
        width: 560,
        border: "1px solid #E5E7EB",
      }}
    >
      <div
        className="flex"
        style={{
          minHeight: 350,
        }}
      >
        <div className="w-[190px] border-r border-gray-200 bg-gray-50">
          <div className="px-4 py-4 font-semibold text-[15px] border-b border-gray-200">
            {t("history_add_filter")}
          </div>

          <div className="py-2">
            {filterCategories.map(
              (category) => {
                const selectedCount =
                  draftFilters[
                    category.key
                  ].length;

                const active =
                  activeFilterCategory ===
                  category.key;

                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => {
                      setActiveFilterCategory(
                        category.key
                      );

                      setFilterSearchKeyword(
                        ""
                      );
                    }}
                    className={[
                      "w-full flex items-center justify-between",
                      "px-4 py-3 text-left text-sm",
                      "transition-colors",

                      active
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700 hover:bg-gray-100",
                    ].join(" ")}
                  >
                    <span>
                      {category.label}
                    </span>

                    {selectedCount > 0 && (
                      <span className="text-xs text-gray-500">
                        {selectedCount}
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-[15px]">
                {activeCategory?.label}
              </div>

              <div className="text-xs text-gray-500">
                {activeCategory
                  ?.options.length ?? 0}
              </div>
            </div>

            <Input
              allowClear
              value={filterSearchKeyword}
              onChange={(e) =>
                setFilterSearchKeyword(
                  e.target.value
                )
              }
              placeholder={`${t(
                "history_filter_search"
              )} ${
                activeCategory?.label ??
                ""
              }`}
            />
          </div>

          <div className="flex-1 max-h-[260px] overflow-y-auto px-4 py-3">
            {visibleFilterOptions.length ===
            0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                {t(
                  "history_filter_no_results"
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleFilterOptions.map(
                  (option) => (
                    <Checkbox
                      key={option.value}
                      checked={draftFilters[
                        activeFilterCategory
                      ].includes(
                        option.value
                      )}
                      onChange={() =>
                        toggleDraftFilter(
                          activeFilterCategory,
                          option.value
                        )
                      }
                    >
                      {option.label}
                    </Checkbox>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-white">
        <Button
          onClick={handleCancelFilter}
        >
          {t("history_filter_cancel")}
        </Button>

        <Button
          type="primary"
          onClick={handleApplyFilters}
        >
          {t("history_filter_apply")}
        </Button>
      </div>
    </div>
  );

  /*
   * Load History
   */

  useEffect(() => {
    getList();
  }, [getList]);

  /*
   * PDF generation
   */

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
        await new Promise<void>(
          (resolve) => {
            requestAnimationFrame(
              () => {
                requestAnimationFrame(
                  () => resolve()
                );
              }
            );
          }
        );

        if (
          cancelled ||
          !directDownloadRef.current
        ) {
          return;
        }

        await downloadWorkReportPdf(
          directDownloadRef.current,
          downloadDetail
        );
      } catch (error) {
        console.error(
          "Failed to download work report PDF:",
          error
        );

        message.error(
          "Failed to download PDF."
        );
      } finally {
        if (!cancelled) {
          setDownloadDetail(null);
          setDownloadingHistoryId(
            null
          );
        }
      }
    };

    void generatePdf();

    return () => {
      cancelled = true;
    };
  }, [
    downloadDetail,
    downloadingHistoryId,
  ]);

  return (
    <>
      <div className="w-full relative">
        {loading && (
          <div className="mb-3 text-sm text-gray-500">
            {t("common_loading")}
          </div>
        )}

        {/* Date + Search */}
        <div className="flex gap-4 mt-[26px] mb-[14px] w-1/2">
          <RangePicker
            size="large"
            className="min-w-[300px]"
            onChange={
              handleDateRangeChange
            }
            value={dateRange}
            placeholder={[
              t("common_from"),
              t("common_to"),
            ]}
          />

          <Search
            size="large"
            placeholder={t(
              "history_search_placeholder"
            )}
            value={searchKeyword}
            onChange={(e) =>
              setSearchKeyword(
                e.target.value
              )
            }
            className="flex-1 rounded-[7px]"
            allowClear
          />
        </div>

        {/* Applied filter chips */}
        <div className="flex flex-wrap items-center gap-2 mb-[22px] min-h-[34px]">
          {appliedFilterChips.length >
            0 && (
            <span className="text-sm text-gray-500 mr-1">
              {t(
                "history_applied_filters"
              )}
            </span>
          )}

          {appliedFilterChips.map(
            (chip) => (
              <div
                key={`${chip.key}-${chip.value}`}
                className={[
                  "inline-flex items-center gap-2",
                  "h-[32px] px-3",
                  "border border-gray-200",
                  "rounded-[6px]",
                  "bg-gray-50 text-sm",
                ].join(" ")}
              >
                <span className="text-xs text-gray-400">
                  {
                    chip.categoryLabel
                  }
                </span>

                <span className="text-gray-700">
                  {chip.valueLabel}
                </span>

                <button
                  type="button"
                  aria-label={`Remove ${chip.valueLabel}`}
                  onClick={() =>
                    removeAppliedFilter(
                      chip.key,
                      chip.value
                    )
                  }
                  className="text-gray-400 hover:text-gray-700 text-base leading-none"
                >
                  ×
                </button>
              </div>
            )
          )}

          <Dropdown
            open={isFilterOpen}
            onOpenChange={
              handleFilterOpenChange
            }
            trigger={["click"]}
            placement="bottomLeft"
            popupRender={() =>
              filterPopup
            }
          >
            <Button
              type="default"
              onClick={(e) => {
                e.preventDefault();
              }}
            >
              + {t("history_add_filter")}
            </Button>
          </Dropdown>
        </div>

        <SortableTable
          columns={columns}
          data={filteredList}
          rowKey="historyId"
        />
      </div>

      {/* Work Issue edit */}
      <Modal
        open={isWorkIssueModalOpen}
        title={t("history_work_issue")}
        onCancel={
          handleCloseWorkIssueModal
        }
        onOk={handleSaveWorkIssue}
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
            reportRef={
              directDownloadRef
            }
            isExportingPdf={true}
          />
        </div>
      )}
    </>
  );
}