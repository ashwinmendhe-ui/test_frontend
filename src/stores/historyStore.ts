import { create } from "zustand";

import { historyApi } from "@/api/historyApi";

export interface HistoryManagementTable {
  historyId: string;
  companyName: string;
  siteName: string;
  missionName: string;
  deviceName: string;
  userName: string;
  totalRecognition: number;
  createdAt: string;
}

export interface ReportData {
  deviceSn: string;
  siteName: string;
  deviceName: string;
  robotName?: string;
  missionName?: string;
  userName: string;
  workerName?: string;
  startTime: string;
  endTime: string;
  totalTime?: string;
  duration?: string;
  distance?: string;
  playbackUrl: string;
  reportCreatedAt?: string;
  labelCounts: Record<string, number>;
  bookmarks: Array<{
    label: string;
    mdisplay: string;
    duration?: string;
  }>;
}

interface Store {
  loading: boolean;
  list: HistoryManagementTable[];
  detail: ReportData;
  getList: (param?: string, from?: string, to?: string) => void;
  getDetail: (id: string) => void;
  downloadHistory: (id: string) => Promise<{ code?: number | string; message?: string }>;
}



export const useHistoryStore = create<Store>((set) => ({
  loading: false,
  list: [],
  detail: {
    deviceSn: "",
    siteName: "",
    deviceName: "",
    userName: "",
    startTime: "",
    endTime: "",
    totalTime: "",
    playbackUrl: "",
    labelCounts: {},
    bookmarks: [],
  },

  getList: async (param, from, to) => {
    try {
      set({ loading: true });

      const res = await historyApi.getList();

      let filtered = [...res];

      // 🔍 Search filter (frontend)
      if (param?.trim()) {
        const q = param.toLowerCase();
        filtered = filtered.filter(
          (item) =>
            item.companyName?.toLowerCase().includes(q) ||
            item.siteName?.toLowerCase().includes(q) ||
            item.missionName?.toLowerCase().includes(q) ||
            item.deviceName?.toLowerCase().includes(q) ||
            item.userName?.toLowerCase().includes(q)
        );
      }

      // 📅 Date filter (frontend)
      if (from && to) {
        const fromTime = new Date(from).getTime();
        const toTime = new Date(to).getTime();

        filtered = filtered.filter((item) => {
          const itemTime = new Date(item.createdAt.replace(" ", "T")).getTime();
          return itemTime >= fromTime && itemTime <= toTime;
        });
      }

      set({ list: filtered });
    } catch (error) {
      console.error("History list API error:", error);
      set({ list: [] });
    } finally {
      set({ loading: false });
    }
  },

  getDetail: async (id) => {
    try {
      set({ loading: true });

      const res = await historyApi.getDetail(id);

      set({
        detail: {
          ...res,
          robotName: res.deviceName,
          workerName: res.userName,
          duration: res.totalTime,
          reportCreatedAt: res.endTime || res.startTime,
          labelCounts: res.labelCounts || {},
          bookmarks: res.bookmarks || [],
        },
      });
    } catch (error) {
      console.error("History detail API error:", error);
    } finally {
      set({ loading: false });
    }
  },

  downloadHistory: async () => {
    return { code: 0 };
  },
}));