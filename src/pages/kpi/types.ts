export type KPIComparisonPeriod = "weekly" | "monthly" | "yearly" | "all";
export type KPIReliabilityRange = "daily" | "weekly" | "monthly" | "yearly";

export type KPITrendDirection = "up" | "down" | "neutral";

export interface KPIDelta {
  value: number;
  labelKey: string;
  unitKey: string;
  trend: KPITrendDirection;
}

export interface KPIStatCardItem {
  key: string;
  titleKey: string;
  value: number;
  unitKey: string;
  descriptionKey?: string;
  delta?: KPIDelta;
}

export interface KPIInterruptEventItem {
  key: string;
  labelKey: string;
  count: number;
  percent: number;
  color: string;
}

export interface KPIRobotStatusItem {
  key: string;
  labelKey: string;
  percent: number;
  displayValue: string;
  color: string;
}

export interface KPISiteOption {
  label: string;
  value: string;
}

export interface KPIReliabilitySnapshot {
  range: KPIReliabilityRange;
  statuses: KPIRobotStatusItem[];
}

export interface KPISectionData {
  deployment: KPIStatCardItem[];
  operation: KPIStatCardItem[];
  robotOperation: {
    avgRobotsPerOperator: KPIStatCardItem;
    maxRobotsPerOperator: KPIStatCardItem;
    totalDrivingTime: KPIStatCardItem;
  };
  interruptEvents: {
    totalCount: number;
    totalLabelKey: string;
    items: KPIInterruptEventItem[];
  };
  reliability: {
    mtbf: KPIStatCardItem;
    snapshots: KPIReliabilitySnapshot[];
  };
}

export interface KPIFilters {
  comparisonPeriod: KPIComparisonPeriod;
  siteId: string;
  reliabilityRange: KPIReliabilityRange;
}

export interface KPIState {
  filters: KPIFilters;
  siteOptions: KPISiteOption[];
  dashboardData: KPISectionData | null;
  loading: boolean;
  error: string | null;
  setComparisonPeriod: (period: KPIComparisonPeriod) => void;
  setSiteId: (siteId: string) => void;
  setReliabilityRange: (range: KPIReliabilityRange) => void;
  fetchDashboardData: () => Promise<void>;
  resetFilters: () => void;
}