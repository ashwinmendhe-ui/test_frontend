import { useTranslation } from "react-i18next";
import type { KPIDelta } from "../types";

interface KPIDeltaBadgeProps {
  delta?: KPIDelta;
}

export default function KPIDeltaBadge({ delta }: KPIDeltaBadgeProps) {
  const { t } = useTranslation();

  if (!delta) return null;

  const isUp = delta.trend === "up";
  const isDown = delta.trend === "down";
  const isNeutral = delta.trend === "neutral";

  const badgeClass = isUp
    ? "bg-[#DDF7E5] text-[#22A447]"
    : isDown
      ? "bg-[#FFE2E2] text-[#E5484D]"
      : "bg-[#F1F3F5] text-[#6B7280]";

  return (
    <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#E5E7EB] pt-3">
      <span className="text-xs font-medium text-[#98A2B3]">
        {t(delta.labelKey)}
      </span>

      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${badgeClass}`}
      >
        {!isNeutral ? <span>{isUp ? "▲" : "▼"}</span> : null}
        <span>
          {delta.value}
          {t(delta.unitKey)}
        </span>
      </span>
    </div>
  );
}