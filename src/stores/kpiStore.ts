import { create } from "zustand";
import { getMockKpiDashboardData, kpiSiteOptions } from "@/pages/kpi/mockData";
import type { KPIFilters, KPIState } from "@/pages/kpi/types";

const initialFilters: KPIFilters = {
  comparisonPeriod: "weekly",
  siteId: "fpt-5-sites",
  reliabilityRange: "daily",
};

export const useKpiStore = create<KPIState>((set, get) => ({
  filters: initialFilters,
  siteOptions: kpiSiteOptions,
  dashboardData: null,
  loading: false,
  error: null,

  setComparisonPeriod: (period) => {
    set((state) => ({
      filters: {
        ...state.filters,
        comparisonPeriod: period,
      },
    }));
  },

  setSiteId: (siteId) => {
    set((state) => ({
      filters: {
        ...state.filters,
        siteId,
      },
    }));
  },

  setReliabilityRange: (range) => {
    set((state) => ({
      filters: {
        ...state.filters,
        reliabilityRange: range,
      },
    }));
  },

  fetchDashboardData: async () => {
    const { filters } = get();

    set({
      loading: true,
      error: null,
    });

    try {
      const data = await getMockKpiDashboardData(
        filters.comparisonPeriod,
        filters.siteId
      );

      set({
        dashboardData: data,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch KPI dashboard data:", error);

      set({
        error: "Failed to load KPI dashboard data.",
        loading: false,
      });
    }
  },

  resetFilters: () => {
  set({
    filters: initialFilters,
  });

  get().fetchDashboardData();
},
}));