import type {
  KPIComparisonPeriod,
  KPIReliabilityRange,
  KPISectionData,
  KPISiteOption,
} from "./types";

export const kpiSiteOptions: KPISiteOption[] = [
  {
    label: "FPT Software and 5 Sites",
    value: "fpt-5-sites",
  },
  {
    label: "Seoul Main Site",
    value: "seoul-main-site",
  },
  {
    label: "Busan Logistics Site",
    value: "busan-logistics-site",
  },
];

const reliabilitySnapshots: Record<KPIReliabilityRange, KPISectionData["reliability"]["snapshots"][number]> = {
  daily: {
    range: "daily",
    statuses: [
      {
        key: "running",
        labelKey: "kpi.robotStatus.runningTime",
        percent: 65,
        displayValue: "15h 36m",
        color: "#41C95B",
      },
      {
        key: "idle",
        labelKey: "kpi.robotStatus.idleTime",
        percent: 30,
        displayValue: "7h 12m",
        color: "#F59E0B",
      },
      {
        key: "downtime",
        labelKey: "kpi.robotStatus.downTime",
        percent: 5,
        displayValue: "1h 12m",
        color: "#FF5E5E",
      },
    ],
  },
  weekly: {
    range: "weekly",
    statuses: [
      {
        key: "running",
        labelKey: "kpi.robotStatus.runningTime",
        percent: 62,
        displayValue: "109h 12m",
        color: "#41C95B",
      },
      {
        key: "idle",
        labelKey: "kpi.robotStatus.idleTime",
        percent: 31,
        displayValue: "54h 36m",
        color: "#F59E0B",
      },
      {
        key: "downtime",
        labelKey: "kpi.robotStatus.downTime",
        percent: 7,
        displayValue: "12h 24m",
        color: "#FF5E5E",
      },
    ],
  },
  monthly: {
    range: "monthly",
    statuses: [
      {
        key: "running",
        labelKey: "kpi.robotStatus.runningTime",
        percent: 60,
        displayValue: "300h 00m",
        color: "#41C95B",
      },
      {
        key: "idle",
        labelKey: "kpi.robotStatus.idleTime",
        percent: 33,
        displayValue: "165h 00m",
        color: "#F59E0B",
      },
      {
        key: "downtime",
        labelKey: "kpi.robotStatus.downTime",
        percent: 7,
        displayValue: "35h 00m",
        color: "#FF5E5E",
      },
    ],
  },
  yearly: {
    range: "yearly",
    statuses: [
      {
        key: "running",
        labelKey: "kpi.robotStatus.runningTime",
        percent: 58,
        displayValue: "3650h 00m",
        color: "#41C95B",
      },
      {
        key: "idle",
        labelKey: "kpi.robotStatus.idleTime",
        percent: 34,
        displayValue: "2140h 00m",
        color: "#F59E0B",
      },
      {
        key: "downtime",
        labelKey: "kpi.robotStatus.downTime",
        percent: 8,
        displayValue: "504h 00m",
        color: "#FF5E5E",
      },
    ],
  },
};

const baseDashboardData: KPISectionData = {
  deployment: [
    {
      key: "setupTime",
      titleKey: "kpi.cards.setupTime",
      value: 3.2,
      unitKey: "kpi.units.day",
      descriptionKey: "kpi.tooltips.setupTime",
      delta: {
        value: 0.5,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.day",
        trend: "down",
      },
    },
    {
      key: "setupManpower",
      titleKey: "kpi.cards.setupManpower",
      value: 5,
      unitKey: "kpi.units.person",
      descriptionKey: "kpi.tooltips.setupManpower",
      delta: {
        value: 0.0,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.person",
        trend: "neutral",
      },
    },
    {
      key: "autonomousTransitionTime",
      titleKey: "kpi.cards.autonomousTransitionTime",
      value: 18,
      unitKey: "kpi.units.day",
      descriptionKey: "kpi.tooltips.autonomousTransitionTime",
      delta: {
        value: 0.2,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.day",
        trend: "up",
      },
    },
  ],
  operation: [
    {
      key: "missionSuccessRate",
      titleKey: "kpi.cards.missionSuccessRate",
      value: 87.5,
      unitKey: "kpi.units.percent",
      descriptionKey: "kpi.tooltips.missionSuccessRate",
      delta: {
        value: 3.2,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.percent",
        trend: "up",
      },
    },
    {
      key: "remoteInterventionSuccessRate",
      titleKey: "kpi.cards.remoteInterventionSuccessRate",
      value: 80.0,
      unitKey: "kpi.units.percent",
      descriptionKey: "kpi.tooltips.remoteInterventionSuccessRate",
      delta: {
        value: 2.2,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.percent",
        trend: "up",
      },
    },
    {
      key: "fieldDispatchRate",
      titleKey: "kpi.cards.fieldDispatchRate",
      value: 2.5,
      unitKey: "kpi.units.percent",
      descriptionKey: "kpi.tooltips.fieldDispatchRate",
      delta: {
        value: 1.1,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.percent",
        trend: "down",
      },
    },
    {
      key: "remoteInterventionEventFrequency",
      titleKey: "kpi.cards.remoteInterventionEventFrequency",
      value: 1.2,
      unitKey: "kpi.units.case",
      descriptionKey: "kpi.tooltips.remoteInterventionEventFrequency",
      delta: {
        value: 0.3,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.case",
        trend: "down",
      },
    },
    {
      key: "interventionTimePerRemoteIntervention",
      titleKey: "kpi.cards.interventionTimePerRemoteIntervention",
      value: 1.5,
      unitKey: "kpi.units.minute",
      descriptionKey: "kpi.tooltips.interventionTimePerRemoteIntervention",
      delta: {
        value: 0.1,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.minute",
        trend: "down",
      },
    },
    {
      key: "remoteInterventionFrequencyTimeline",
      titleKey: "kpi.cards.remoteInterventionFrequencyTimeline",
      value: 88.5,
      unitKey: "kpi.units.percent",
      descriptionKey: "kpi.tooltips.remoteInterventionFrequencyTimeline",
      delta: {
        value: 5.3,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.percent",
        trend: "up",
      },
    },
  ],
  robotOperation: {
    avgRobotsPerOperator: {
      key: "avgRobotsPerOperator",
      titleKey: "kpi.cards.avgRobotsPerOperator",
      value: 5,
      unitKey: "kpi.units.robot",
      descriptionKey: "kpi.tooltips.avgRobotsPerOperator",
      delta: {
        value: 0.0,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.robot",
        trend: "neutral",
      },
    },
    maxRobotsPerOperator: {
      key: "maxRobotsPerOperator",
      titleKey: "kpi.cards.maxRobotsPerOperator",
      value: 7,
      unitKey: "kpi.units.robot",
      descriptionKey: "kpi.tooltips.maxRobotsPerOperator",
      delta: {
        value: 0.1,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.robot",
        trend: "up",
      },
    },
    totalDrivingTime: {
      key: "totalDrivingTime",
      titleKey: "kpi.cards.totalDrivingTime",
      value: 253.75,
      unitKey: "kpi.units.hourMinute",
      descriptionKey: "kpi.tooltips.totalDrivingTime",
      delta: {
        value: 31.3,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.hour",
        trend: "up",
      },
    },
  },
  interruptEvents: {
    totalCount: 50,
    totalLabelKey: "kpi.labels.interruptEventTotal",
    items: [
      {
        key: "obstacleAvoidanceFailure",
        labelKey: "kpi.interrupts.obstacleAvoidanceFailure",
        count: 14,
        percent: 28,
        color: "#2F80ED",
      },
      {
        key: "unstableLocalization",
        labelKey: "kpi.interrupts.unstableLocalization",
        count: 9,
        percent: 18,
        color: "#41C95B",
      },
      {
        key: "communicationFailure",
        labelKey: "kpi.interrupts.communicationFailure",
        count: 8,
        percent: 16,
        color: "#9B51E0",
      },
      {
        key: "emergencyStop",
        labelKey: "kpi.interrupts.emergencyStop",
        count: 7,
        percent: 14,
        color: "#FF5E5E",
      },
      {
        key: "batteryDischarge",
        labelKey: "kpi.interrupts.batteryDischarge",
        count: 7,
        percent: 14,
        color: "#FF9F43",
      },
      {
        key: "breakdown",
        labelKey: "kpi.interrupts.breakdown",
        count: 5,
        percent: 10,
        color: "#2D9CDB",
      },
    ],
  },
  reliability: {
    mtbf: {
      key: "mtbf",
      titleKey: "kpi.cards.mtbf",
      value: 50,
      unitKey: "kpi.units.hour",
      descriptionKey: "kpi.tooltips.mtbf",
      delta: {
        value: 2.2,
        labelKey: "kpi.change.comparedToLastWeek",
        unitKey: "kpi.units.hour",
        trend: "down",
      },
    },
    snapshots: Object.values(reliabilitySnapshots),
  },
};

function applyPeriodAdjustment(
  data: KPISectionData,
  comparisonPeriod: KPIComparisonPeriod
): KPISectionData {
  if (comparisonPeriod === "weekly") return data;

  if (comparisonPeriod === "monthly") {
    return {
      ...data,
      deployment: data.deployment.map((item) => ({
        ...item,
        value:
          item.key === "setupTime"
            ? 3.5
            : item.key === "setupManpower"
              ? 5
              : 20,
      })),
      operation: data.operation.map((item) => ({
        ...item,
        value:
          item.key === "missionSuccessRate"
            ? 85.8
            : item.key === "remoteInterventionSuccessRate"
              ? 78.4
              : item.key === "fieldDispatchRate"
                ? 3.1
                : item.key === "remoteInterventionEventFrequency"
                  ? 1.4
                  : item.key === "interventionTimePerRemoteIntervention"
                    ? 1.7
                    : 84.9,
      })),
    };
  }

  if (comparisonPeriod === "yearly") {
    return {
      ...data,
      deployment: data.deployment.map((item) => ({
        ...item,
        value:
          item.key === "setupTime"
            ? 4.1
            : item.key === "setupManpower"
              ? 6
              : 26,
      })),
      operation: data.operation.map((item) => ({
        ...item,
        value:
          item.key === "missionSuccessRate"
            ? 82.2
            : item.key === "remoteInterventionSuccessRate"
              ? 75.0
              : item.key === "fieldDispatchRate"
                ? 4.0
                : item.key === "remoteInterventionEventFrequency"
                  ? 1.8
                  : item.key === "interventionTimePerRemoteIntervention"
                    ? 2.1
                    : 80.3,
      })),
    };
  }

  return {
    ...data,
    deployment: data.deployment.map((item) => ({
      ...item,
      value:
        item.key === "setupTime"
          ? 3.8
          : item.key === "setupManpower"
            ? 5
            : 22,
    })),
    operation: data.operation.map((item) => ({
      ...item,
      value:
        item.key === "missionSuccessRate"
          ? 84.6
          : item.key === "remoteInterventionSuccessRate"
            ? 77.2
            : item.key === "fieldDispatchRate"
              ? 3.5
              : item.key === "remoteInterventionEventFrequency"
                ? 1.6
                : item.key === "interventionTimePerRemoteIntervention"
                  ? 1.9
                  : 82.7,
    })),
  };
}

function applySiteAdjustment(data: KPISectionData, siteId: string): KPISectionData {
  if (siteId === "fpt-5-sites") return data;

  if (siteId === "seoul-main-site") {
    return {
      ...data,
      deployment: data.deployment.map((item) => ({
        ...item,
        value:
          item.key === "setupTime"
            ? 2.8
            : item.key === "setupManpower"
              ? 4
              : 15,
      })),
      operation: data.operation.map((item) => ({
        ...item,
        value:
          item.key === "missionSuccessRate"
            ? 90.2
            : item.key === "remoteInterventionSuccessRate"
              ? 84.5
              : item.key === "fieldDispatchRate"
                ? 1.9
                : item.key === "remoteInterventionEventFrequency"
                  ? 1.0
                  : item.key === "interventionTimePerRemoteIntervention"
                    ? 1.2
                    : 91.4,
      })),
      robotOperation: {
        ...data.robotOperation,
        avgRobotsPerOperator: {
          ...data.robotOperation.avgRobotsPerOperator,
          value: 4,
        },
        maxRobotsPerOperator: {
          ...data.robotOperation.maxRobotsPerOperator,
          value: 6,
        },
        totalDrivingTime: {
          ...data.robotOperation.totalDrivingTime,
          value: 201.4,
        },
      },
      reliability: {
        ...data.reliability,
        mtbf: {
          ...data.reliability.mtbf,
          value: 57,
        },
      },
    };
  }

  return {
    ...data,
    deployment: data.deployment.map((item) => ({
      ...item,
      value:
        item.key === "setupTime"
          ? 3.7
          : item.key === "setupManpower"
            ? 5
            : 21,
    })),
    operation: data.operation.map((item) => ({
      ...item,
      value:
        item.key === "missionSuccessRate"
          ? 84.1
          : item.key === "remoteInterventionSuccessRate"
            ? 77.8
            : item.key === "fieldDispatchRate"
              ? 3.2
              : item.key === "remoteInterventionEventFrequency"
                ? 1.5
                : item.key === "interventionTimePerRemoteIntervention"
                  ? 1.8
                  : 83.6,
    })),
    robotOperation: {
      ...data.robotOperation,
      avgRobotsPerOperator: {
        ...data.robotOperation.avgRobotsPerOperator,
        value: 5,
      },
      maxRobotsPerOperator: {
        ...data.robotOperation.maxRobotsPerOperator,
        value: 7,
      },
      totalDrivingTime: {
        ...data.robotOperation.totalDrivingTime,
        value: 229.2,
      },
    },
    reliability: {
      ...data.reliability,
      mtbf: {
        ...data.reliability.mtbf,
        value: 48,
      },
    },
  };
}

export async function getMockKpiDashboardData(
  comparisonPeriod: KPIComparisonPeriod,
  siteId: string
): Promise<KPISectionData> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const periodAdjusted = applyPeriodAdjustment(baseDashboardData, comparisonPeriod);
  return applySiteAdjustment(periodAdjusted, siteId);
}