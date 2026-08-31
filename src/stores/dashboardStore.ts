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

  companyId?: string;
  companyName: string;

  siteId?: string;
  siteName: string;

  location?: string;

  missionId?: string;
  missionName?: string;

  status: string;
}

interface DashboardStore {
  loading: boolean;
  dashboard: DashboardTable[];
  stat: DashboardStat;

  getDashboard: (param?: string) => Promise<void>;
  getDashboardStat: () => Promise<void>;
  getDashboardSilent: (param?: string) => Promise<void>;
  getDashboardStatSilent: () => Promise<void>;
  optimisticStopDevice: (deviceSn: string) => void;

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

  optimisticStopDevice: (deviceSn) => {
  if (!deviceSn) return;

  set((state) => ({
    dashboard: state.dashboard.map((device) =>
      device.deviceSn === deviceSn
        ? {
            ...device,
            status: "Online",
            missionId: undefined,
            missionName: "",
          }
        : device
    ),
  }));
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
  getDashboardSilent: async (param) => {
    try {
      const res = await dashboardApi.getList(param);
      set({ dashboard: res?.data ?? res ?? [] });
    } catch (err) {
      console.error("getDashboardSilent error:", err);
    }
  },
  getDashboardStatSilent: async () => {
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
      console.error("getDashboardStatSilent error:", err);
    }
  },
}));