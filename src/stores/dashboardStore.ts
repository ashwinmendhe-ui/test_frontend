import { create } from "zustand";
import { dashboardApi } from "@/api";

interface DashboardStat {
  totalCompanies: number;
  totalDevices: number;
  totalSites: number;
  totalUsers: number;
}

interface DashboardTable {
  deviceId: string;
  deviceSn: string;
  deviceName: string;
  companyName: string;
  siteName: string;
  status: string;
  activeMissionName?: string;
}

interface DashboardStore {
  loading: boolean;
  dashboard: DashboardTable[];
  stat: DashboardStat;

  getDashboard: (param?: string) => Promise<void>;
  getDashboardStat: () => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  loading: false,
  dashboard: [],
  stat: {
    totalCompanies: 0,
    totalDevices: 0,
    totalSites: 0,
    totalUsers: 0,
  },

  getDashboard: async (param) => {
    set({ loading: true });
    try {
      const res = await dashboardApi.getList(param);
      set({ dashboard: res?.data ?? res ?? [] });
    } catch (err) {
      console.error("getDashboard error:", err);
      set({ dashboard: [] });
    } finally {
      set({ loading: false });
    }
  },

  getDashboardStat: async () => {
    set({ loading: true });
    try {
      const res = await dashboardApi.getStat();
      set({
        stat:
          res?.data ??
          res ?? {
            totalCompanies: 0,
            totalDevices: 0,
            totalSites: 0,
            totalUsers: 0,
          },
      });
    } catch (err) {
      console.error("getDashboardStat error:", err);
    } finally {
      set({ loading: false });
    }
  },
}));