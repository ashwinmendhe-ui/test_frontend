import { streamApi } from "@/api";
import { create } from "zustand";

export interface BookmarkItem {
  label: string;
  mdisplay: string;
  m: number;
  s: string;
  o: number;
  duration: string;
}

export interface ReportData {
  deviceSn: string;
  siteName: string;
  deviceName: string;
  userName: string;
  startTime: string;
  endTime: string;
  totalTime: string;
  playbackUrl: string;
  labelCounts: Record<string, number>;
  bookmarks: BookmarkItem[];
  robotName?: string;
  missionName?: string;
  workerName?: string;
  distance?: string;
  duration?: string;
  reportCreatedAt?: string;
}

export interface CreateReport {
  deviceSn: string;
  playbackUrl: string;
  missionId: string;
}

interface Store {
  loading: boolean;
  list: any[];
  report: ReportData;
  startStream: (id: string) => Promise<any>;
  heartBeat: (sessionId: string) => Promise<any>;
  createReport: (data?: CreateReport) => Promise<any>;
}

const defaultReport: ReportData = {
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
};

export const useStreamStore = create<Store>((set) => ({
  loading: false,
  list: [],
  report: defaultReport,

  startStream: async (id: string) => {
    if (!id) {
      console.warn("[streamStore] startStream called without id");
      return null;
    }

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const maxAttempts = 10;
    const intervalMs = 1000;
    let lastData: any = null;

    set({ loading: true });

    try {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const resp = await streamApi.startStream(id);
        lastData = resp?.data ?? resp;

        const state = lastData?.state;
        const playbackUrl = lastData?.playback_url;

        if (state === "RUNNING" && playbackUrl) {
          set({ list: [lastData] });
          return lastData;
        }

        await delay(intervalMs);
      }

      set({ list: lastData ? [lastData] : [] });
      return lastData;
    } finally {
      set({ loading: false });
    }
  },

  heartBeat: async (sessionId: string) => {
    const res = await streamApi.heartBeat(sessionId);
    return res;
  },

  createReport: async (data?: CreateReport) => {
    const res = await streamApi.createReport(data);
    set({ report: res || defaultReport });
    return res;
  },
}));