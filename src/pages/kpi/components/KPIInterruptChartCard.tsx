import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { KPISectionData } from "../types";

interface KPIInterruptChartCardProps {
  interruptEvents: KPISectionData["interruptEvents"];
}

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

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

export default function KPIInterruptChartCard({
  interruptEvents,
}: KPIInterruptChartCardProps) {
  const { t } = useTranslation();

  const chartData = useMemo(
    () =>
      interruptEvents.items.map((item) => ({
        ...item,
        name: t(item.labelKey),
      })),
    [interruptEvents.items, t]
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      <h3 className="mb-5 text-sm font-medium text-[#2F3847]">
        {t("kpi.labels.interruptEvents")}
      </h3>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
        <div className="relative w-full min-w-0 xl:w-[320px]">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="name"
                innerRadius={52}
                outerRadius={102}
                paddingAngle={0}
                labelLine={false}
                label={renderPercentLabel}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] leading-4 text-[#98A2B3] text-center">
                {t(interruptEvents.totalLabelKey)}
            </span>
            <span className="mt-1 text-[20px] font-semibold leading-6 text-[#2F3847]">
                {interruptEvents.totalCount}
            </span>
            <span className="text-[11px] leading-4 text-[#667085]">
                {t("kpi.units.case")}
            </span>
            </div>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          {chartData.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="inline-block h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[#475467] break-words">{item.name}</span>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="text-[#98A2B3]">{item.percent}%</span>
                <span className="min-w-[40px] text-right font-medium text-[#2F3847]">
                  {item.count}
                  {t("kpi.units.case")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}