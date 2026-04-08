import { Button, Select } from "antd";
import { useTranslation } from "react-i18next";
import downloadIcon from "@/assets/download-icon.svg";
import type { KPIComparisonPeriod, KPISiteOption } from "../types";

interface KPIHeaderFiltersProps {
  comparisonPeriod: KPIComparisonPeriod;
  onChangeComparisonPeriod: (period: KPIComparisonPeriod) => void;
  siteId: string;
  siteOptions: KPISiteOption[];
  onChangeSiteId: (siteId: string) => void;
  onDownloadPdf?: () => void;
}

const comparisonPeriods: KPIComparisonPeriod[] = [
  "weekly",
  "monthly",
  "yearly",
  "all",
];

export default function KPIHeaderFilters({
  comparisonPeriod,
  onChangeComparisonPeriod,
  siteId,
  siteOptions,
  onChangeSiteId,
  onDownloadPdf,
}: KPIHeaderFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">
          {comparisonPeriods.map((period) => {
            const isActive = comparisonPeriod === period;

            return (
              <button
                key={period}
                type="button"
                onClick={() => onChangeComparisonPeriod(period)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-[#D0D5DD] bg-white text-[#2F3847]"
                    : "border-transparent bg-[#F2F4F7] text-[#667085] hover:bg-[#EAECF0]"
                }`}
              >
                {t(`kpi.comparison.${period}`)}
              </button>
            );
          })}
        </div>

        <Select
          value={siteId}
          onChange={onChangeSiteId}
          className="min-w-[260px]"
          options={siteOptions.map((option) => ({
            label: option.label,
            value: option.value,
          }))}
        />
      </div>

      <Button
        type="primary"
        className="h-[44px] min-w-[160px] rounded-lg"
        onClick={onDownloadPdf}
      >
        <span className="flex items-center gap-2">
          <img src={downloadIcon} alt="download" className="h-4 w-4" />
          {t("kpi.labels.downloadPdf")}
        </span>
      </Button>
    </div>
  );
}