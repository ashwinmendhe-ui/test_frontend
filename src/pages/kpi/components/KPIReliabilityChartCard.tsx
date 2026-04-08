import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type {
  KPIReliabilityRange,
  KPISectionData,
} from "../types";

interface KPIReliabilityChartCardProps {
  reliabilitySnapshots: KPISectionData["reliability"]["snapshots"];
  selectedRange: KPIReliabilityRange;
  onChangeRange: (range: KPIReliabilityRange) => void;
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

const reliabilityRanges: KPIReliabilityRange[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

const RADIAN = Math.PI / 180;

function formatChartPercent(percent: number) {
  if (percent <= 0) return "0%";
  const normalized = percent > 1 ? percent : percent * 100;
  return `${Math.round(normalized)}%`;
}

function renderPercentLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: PieLabelProps) {
  if (percent <= 0) return null;

  const radius = innerRadius + (outerRadius - innerRadius) * 0.62;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#FFFFFF"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {formatChartPercent(percent)}
    </text>
  );
}

export default function KPIReliabilityChartCard({
  reliabilitySnapshots,
  selectedRange,
  onChangeRange,
}: KPIReliabilityChartCardProps) {
  const { t } = useTranslation();

  const selectedSnapshot = useMemo(
    () =>
      reliabilitySnapshots.find((snapshot) => snapshot.range === selectedRange) ??
      reliabilitySnapshots[0],
    [reliabilitySnapshots, selectedRange]
  );

  const centerLabel = t(`kpi.reliabilityRange.${selectedSnapshot.range}`);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h3 className="text-sm font-medium text-[#2F3847]">
          {t("kpi.labels.robotOperatingStatus")}
        </h3>

        <div className="inline-flex w-fit rounded-lg bg-[#F2F4F7] p-1">
          {reliabilityRanges.map((range) => {
            const isActive = selectedRange === range;

            return (
              <button
                key={range}
                type="button"
                onClick={() => onChangeRange(range)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-white text-[#2F3847] shadow-sm"
                    : "text-[#667085]"
                }`}
              >
                {t(`kpi.reliabilityRange.${range}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
        <div className="relative w-full min-w-0 xl:w-[320px]">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={selectedSnapshot.statuses}
                dataKey="percent"
                nameKey="key"
                innerRadius={52}
                outerRadius={102}
                labelLine={false}
                label={renderPercentLabel}
              >
                {selectedSnapshot.statuses.map((item) => (
                  <Cell key={item.key} fill={item.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
        <span className="text-[14px] font-semibold leading-6 text-[#2F3847] text-center">
            {centerLabel}
        </span>
        </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          {selectedSnapshot.statuses.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="inline-block h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[#475467] break-words">
                  {t(item.labelKey)}
                </span>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="min-w-[48px] text-right text-[#98A2B3]">
                  {item.percent}%
                </span>
                <span className="min-w-[90px] text-right font-medium text-[#2F3847]">
                  {item.displayValue}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}