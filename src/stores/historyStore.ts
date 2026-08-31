import { create } from "zustand";

import { historyApi } from "@/api/historyApi";

export interface HistoryManagementTable {
  historyId: string;
  companyId?: string;
  companyName: string;
  siteId?: string;
  siteName: string;
  missionId?: string;
  missionName: string;
  deviceSn?: string;
  deviceName: string;
  playbackUrl?: string;
  userName: string;
  totalRecognition: number;
  createdAt: string;
  videoStatus?: string;
}

export interface ReportData {
  deviceSn: string;
  siteName: string;
  deviceName: string;
  companyId?: string;
  siteId?: string;
  missionId?: string;
  robotName?: string;
  missionName?: string;
  userName: string;
  workerName?: string;
  startTime: string;
  endTime: string;
  totalTime?: string;
  totalRecognition?: number;
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
  getList: () => Promise<void>;
  getDetail: (id: string) => Promise<ReportData>;
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

  getList: async () => {
  try {
    set({ loading: true });

    const res = await historyApi.getList();

    set({ list: res });
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

    const normalizedDetail: ReportData = {
      ...res,
      robotName: res.deviceName,
      workerName: res.userName,
      duration: res.totalTime,
      reportCreatedAt: res.endTime || res.startTime,
      labelCounts: res.labelCounts || {},
      bookmarks: res.bookmarks || [],
    };

    set({
      detail: normalizedDetail,
    });

    return normalizedDetail;
  } catch (error) {
    console.error("History detail API error:", error);
    throw error;
  } finally {
    set({ loading: false });
  }
},

  downloadHistory: async () => {
    return { code: 0 };
  },
}));