import { useEffect, useMemo } from "react";
import { Spin, Empty } from "antd";
import { useTranslation } from "react-i18next";
import { useKpiStore } from "@/stores/kpiStore";
import {
  KPIHeaderFilters,
  KPIInterruptChartCard,
  KPIReliabilityChartCard,
  KPISection,
  KPIStatCard,
} from "./components";
import type { KPIStatCardItem } from "./types";

function formatHoursAndMinutes(value: number, language: string) {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);

  if (language === "ko") {
    return `${hours} 시간 ${minutes} 분`;
  }

  return `${hours} h ${minutes} m`;
}

function formatDeltaValue(value: number, unitKey: string, t: (key: string) => string) {
  if (unitKey === "kpi.units.percent") {
    return `${value.toFixed(1)}${t(unitKey)}`;
  }

  if (unitKey === "kpi.units.hour") {
    return `${value.toFixed(1)}${t(unitKey)}`;
  }

  if (unitKey === "kpi.units.minute") {
    return `${value.toFixed(1)}${t(unitKey)}`;
  }

  if (unitKey === "kpi.units.case") {
    return `${value.toFixed(1)}${t(unitKey)}`;
  }

  if (unitKey === "kpi.units.person" || unitKey === "kpi.units.robot") {
    return `${value.toFixed(1)}${t(unitKey)}`;
  }

  if (unitKey === "kpi.units.day") {
    return `${value.toFixed(1)}${t(unitKey)}`;
  }

  return `${value}${t(unitKey)}`;
}

function getDeltaLabelKey(comparisonPeriod: string) {
  switch (comparisonPeriod) {
    case "monthly":
      return "kpi.change.comparedToLastMonth";
    case "yearly":
      return "kpi.change.comparedToLastYear";
    case "all":
      return "kpi.change.comparedToAllTime";
    case "weekly":
    default:
      return "kpi.change.comparedToLastWeek";
  }
}

function normalizeStatCardItem(
  item: KPIStatCardItem,
  comparisonPeriod: string
): KPIStatCardItem {
  if (!item.delta) return item;

  return {
    ...item,
    delta: {
      ...item.delta,
      labelKey: getDeltaLabelKey(comparisonPeriod),
    },
  };
}

export default function KPIPage() {
  const { t, i18n } = useTranslation();

  const {
    filters,
    siteOptions,
    dashboardData,
    loading,
    error,
    setComparisonPeriod,
    setSiteId,
    setReliabilityRange,
    fetchDashboardData,
  } = useKpiStore();

  useEffect(() => {
  fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [filters.comparisonPeriod, filters.siteId]);

  const deploymentCards = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.deployment.map((item) =>
      normalizeStatCardItem(item, filters.comparisonPeriod)
    );
  }, [dashboardData, filters.comparisonPeriod]);

  const operationCards = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.operation.map((item) =>
      normalizeStatCardItem(item, filters.comparisonPeriod)
    );
  }, [dashboardData, filters.comparisonPeriod]);

  const avgRobotsPerOperator = useMemo(() => {
    if (!dashboardData) return null;
    return normalizeStatCardItem(
      dashboardData.robotOperation.avgRobotsPerOperator,
      filters.comparisonPeriod
    );
  }, [dashboardData, filters.comparisonPeriod]);

  const maxRobotsPerOperator = useMemo(() => {
    if (!dashboardData) return null;
    return normalizeStatCardItem(
      dashboardData.robotOperation.maxRobotsPerOperator,
      filters.comparisonPeriod
    );
  }, [dashboardData, filters.comparisonPeriod]);

  const totalDrivingTime = useMemo(() => {
    if (!dashboardData) return null;
    return normalizeStatCardItem(
      dashboardData.robotOperation.totalDrivingTime,
      filters.comparisonPeriod
    );
  }, [dashboardData, filters.comparisonPeriod]);

  const mtbfCard = useMemo(() => {
    if (!dashboardData) return null;
    return normalizeStatCardItem(
      dashboardData.reliability.mtbf,
      filters.comparisonPeriod
    );
  }, [dashboardData, filters.comparisonPeriod]);

  const statFormatter = (value: number, unitKey: string) => {
    if (unitKey === "kpi.units.hourMinute") {
      return formatHoursAndMinutes(value, i18n.language);
    }

    if (unitKey === "kpi.units.percent") {
      return `${value.toFixed(1)} ${t(unitKey)}`;
    }

    if (Number.isInteger(value)) {
      return `${value} ${t(unitKey)}`;
    }

    return `${value.toFixed(1)} ${t(unitKey)}`;
  };

  const enhancedDeploymentCards = deploymentCards.map((item) => ({
    ...item,
    delta: item.delta
      ? {
          ...item.delta,
          // keep same structure, visual formatter can use page context later if needed
        }
      : undefined,
  }));

  const enhancedOperationCards = operationCards.map((item) => ({
    ...item,
    delta: item.delta
      ? {
          ...item.delta,
        }
      : undefined,
  }));

  const handleDownloadPdf = () => {
    // Placeholder for future PDF export integration
    // Can later connect to backend report generation or frontend PDF export
    console.log("Download KPI PDF");
  };

  return (
    <div className="space-y-6 p-6 bg-[#FCFCFD] min-h-full">
      <KPIHeaderFilters
        comparisonPeriod={filters.comparisonPeriod}
        onChangeComparisonPeriod={setComparisonPeriod}
        siteId={filters.siteId}
        siteOptions={siteOptions}
        onChangeSiteId={setSiteId}
        onDownloadPdf={handleDownloadPdf}
      />

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl bg-white">
          <div className="flex flex-col items-center gap-3">
            <Spin size="large" />
            <p className="text-sm text-[#667085]">{t("kpi.loading")}</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-white p-10">
          <Empty description={error} />
        </div>
      ) : !dashboardData ? (
        <div className="rounded-2xl bg-white p-10">
          <Empty description={t("kpi.empty")} />
        </div>
      ) : (
        <>
          <KPISection title={t("kpi.sections.deployment")}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {enhancedDeploymentCards.map((item) => (
                <KPIStatCard
                  key={item.key}
                  item={{
                    ...item,
                    delta: item.delta
                      ? {
                          ...item.delta,
                          labelKey: getDeltaLabelKey(filters.comparisonPeriod),
                        }
                      : undefined,
                  }}
                  valueFormatter={statFormatter}
                />
              ))}
            </div>
          </KPISection>

          <KPISection title={t("kpi.sections.operation")}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {enhancedOperationCards.map((item) => (
                  <KPIStatCard
                    key={item.key}
                    item={{
                      ...item,
                      delta: item.delta
                        ? {
                            ...item.delta,
                            labelKey: getDeltaLabelKey(filters.comparisonPeriod),
                          }
                        : undefined,
                    }}
                    valueFormatter={statFormatter}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <div className="xl:col-span-6">
                  <KPIInterruptChartCard
                    interruptEvents={dashboardData.interruptEvents}
                  />
                </div>

                <div className="xl:col-span-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {avgRobotsPerOperator ? (
                      <KPIStatCard
                        item={{
                          ...avgRobotsPerOperator,
                          delta: avgRobotsPerOperator.delta
                            ? {
                                ...avgRobotsPerOperator.delta,
                                labelKey: getDeltaLabelKey(
                                  filters.comparisonPeriod
                                ),
                              }
                            : undefined,
                        }}
                        valueFormatter={statFormatter}
                      />
                    ) : null}

                    {maxRobotsPerOperator ? (
                      <KPIStatCard
                        item={{
                          ...maxRobotsPerOperator,
                          delta: maxRobotsPerOperator.delta
                            ? {
                                ...maxRobotsPerOperator.delta,
                                labelKey: getDeltaLabelKey(
                                  filters.comparisonPeriod
                                ),
                              }
                            : undefined,
                        }}
                        valueFormatter={statFormatter}
                      />
                    ) : null}

                    {totalDrivingTime ? (
                      <div className="md:col-span-2">
                        <KPIStatCard
                          item={{
                            ...totalDrivingTime,
                            delta: totalDrivingTime.delta
                              ? {
                                  ...totalDrivingTime.delta,
                                  labelKey: getDeltaLabelKey(
                                    filters.comparisonPeriod
                                  ),
                                }
                              : undefined,
                          }}
                          valueFormatter={statFormatter}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </KPISection>

          <KPISection title={t("kpi.sections.reliability")}>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="xl:col-span-8">
                <KPIReliabilityChartCard
                  reliabilitySnapshots={dashboardData.reliability.snapshots}
                  selectedRange={filters.reliabilityRange}
                  onChangeRange={setReliabilityRange}
                />
              </div>

              <div className="xl:col-span-4">
                {mtbfCard ? (
                  <KPIStatCard
                    item={{
                      ...mtbfCard,
                      delta: mtbfCard.delta
                        ? {
                            ...mtbfCard.delta,
                            labelKey: getDeltaLabelKey(filters.comparisonPeriod),
                          }
                        : undefined,
                    }}
                    valueFormatter={statFormatter}
                    className="h-full"
                  />
                ) : null}
              </div>
            </div>
          </KPISection>
        </>
      )}
    </div>
  );
}