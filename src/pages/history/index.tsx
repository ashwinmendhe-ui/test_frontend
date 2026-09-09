import ActionIcon from "@/assets/table-action-icon.svg";
import ActionMenu from "@/components/common/actionMenu";
import WorkReportModal from "@/components/common/workReportModal";
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

  const {
    loading,
    list,
    getList,
    getDetail,
    detail,
  } = useHistoryStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [dateRange, setDateRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null);

  const [searchKeyword, setSearchKeyword] = useState("");

  const [selectedHistory, setSelectedHistory] =
    useState<HistoryManagementTable | null>(null);

  /*
   * Filters currently applied to the History list.
   */
  const [filters, setFilters] = useState<HistoryFilters>({
    ...EMPTY_FILTERS,
  });

  /*
   * Temporary selections inside Add Filter.
   * They are committed only after Apply.
   */
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

  const directDownloadRef = useRef<HTMLDivElement>(null);

  /*
   * Company filter options
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

  /*
   * Site filter options
   */
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

  /*
   * Mission filter options
   */
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

  /*
   * Robot filter options
   */
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

  /*
   * Worker filter options
   */
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

  /*
   * AI Detection Type options.
   *
   * A History record may contain multiple detection types.
   * Build one unique option list across all History records.
   */
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

  /*
   * Work Issue is free-text data.
   *
   * For filtering, the useful distinction is whether
   * a History record has an issue or not.
   */
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

  /*
   * All categories shown in + Add Filter.
   */
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

  /*
   * Search inside the currently selected filter category.
   */
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
   * Date filter
   */
  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    setDateRange(dates);
  };

  /*
   * Open Add Filter popup.
   *
   * Copy applied filters into draft state so Cancel can
   * safely discard any new selections.
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

  /*
   * Add/remove one temporary filter option.
   */
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

  /*
   * Commit filter selections.
   */
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

  /*
   * Discard selections made after opening the popup.
   */
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

  /*
   * Remove one applied chip.
   */
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
   * Convert applied filter values to UI chips.
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

      render: (
        _: unknown,
        __: HistoryManagementTable,
        index: number
      ) => index + 1,
    },
    {
      title: t("history_created_at"),
      dataIndex: "createdAt",
      key: "createdAt",
      enableSort: true,

      render: (item: string) => (
        <>{item || "-"}</>
      ),
    },
    {
      title: t("history_company_name"),
      dataIndex: "companyName",
      key: "companyName",
      enableSort: true,

      render: (value: string) => (
        <HighlightText
          text={value}
          query={searchKeyword}
        />
      ),
    },
    {
      title: t("history_site_name"),
      dataIndex: "siteName",
      key: "siteName",
      enableSort: true,

      render: (value: string) => (
        <HighlightText
          text={value}
          query={searchKeyword}
        />
      ),
    },
    {
      title: t("history_mission_name"),
      dataIndex: "missionName",
      key: "missionName",
      enableSort: true,

      render: (value: string) => (
        <HighlightText
          text={value}
          query={searchKeyword}
        />
      ),
    },
    {
      title: t("history_robot_name"),
      dataIndex: "deviceName",
      key: "deviceName",
      enableSort: true,

      render: (value: string) => (
        <HighlightText
          text={value}
          query={searchKeyword}
        />
      ),
    },
    {
      title: t("history_worker_name"),
      dataIndex: "userName",
      key: "userName",
      enableSort: true,

      render: (value: string) => (
        <HighlightText
          text={value}
          query={searchKeyword}
        />
      ),
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

      render: (
        _: unknown,
        record: HistoryManagementTable
      ) => (
        <Dropdown
          className="relative"
          trigger={["hover"]}
          popupRender={() => (
            <ActionMenu
              onEdit={() =>
                handleView(record)
              }
              onDownload={() =>
                handleDownload(record)
              }
              isShowEdit={true}
              isShowDownload={true}
              isShowDelete={false}
              editLabel={t(
                "history_view_report"
              )}
              isDownloading={
                downloadingHistoryId ===
                record.historyId
              }
            />
          )}
        >
          <a
            onClick={(e) =>
              e.preventDefault()
            }
          >
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
    ]
  );

  /*
   * Structured filtering
   *
   * OR inside the same category.
   * AND between different categories.
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

      /*
       * Same-category OR:
       *
       * Person OR Vehicle OR NO-Hardhat
       *
       * A row passes when at least one selected detection
       * type exists in its detectionTypes array.
       */
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

      /*
       * Work Issue options also use OR behavior.
       *
       * HAS_ISSUE OR NO_ISSUE means all records,
       * which follows the same-category OR rule.
       */
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
   * + Add Filter popup
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
        {/* Filter categories */}
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

        {/* Filter values */}
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

      {/* Footer */}
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