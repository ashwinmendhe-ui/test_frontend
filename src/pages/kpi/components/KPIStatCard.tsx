import { Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import KPIDeltaBadge from "./KPIDeltaBadge";
import type { KPIStatCardItem } from "../types";

interface KPIStatCardProps {
  item: KPIStatCardItem;
  valueFormatter?: (value: number, unitKey: string) => string;
  className?: string;
}

function defaultFormatter(value: number, unitKey: string, unitLabel: string) {
  if (unitKey === "kpi.units.percent") {
    return `${value.toFixed(1)} ${unitLabel}`;
  }

  if (Number.isInteger(value)) {
    return `${value} ${unitLabel}`;
  }

  return `${value.toFixed(1)} ${unitLabel}`;
}

export default function KPIStatCard({
  item,
  valueFormatter,
  className = "",
}: KPIStatCardProps) {
  const { t } = useTranslation();

  const displayValue = valueFormatter
    ? valueFormatter(item.value, item.unitKey)
    : defaultFormatter(item.value, item.unitKey, t(item.unitKey));

  return (
    <div
      className={`rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium leading-5 text-[#2F3847]">
          {t(item.titleKey)}
        </h3>

        {item.descriptionKey ? (
          <Tooltip title={t(item.descriptionKey)}>
            <InfoCircleOutlined className="cursor-pointer text-[#98A2B3]" />
          </Tooltip>
        ) : null}
      </div>

      <div className="text-[24px] font-semibold leading-none text-[#2F3847] md:text-[28px]">
        {displayValue}
      </div>

      <KPIDeltaBadge delta={item.delta} />
    </div>
  );
}