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

const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const useStreamStore = create<Store>((set) => ({
  loading: false,
  list: [],
  report: defaultReport,

  startStream: async (id: string) => {
    if (!id) {
      console.warn("[streamStore] startStream called without id");
      return null;
    }

    const maxAttempts = 10;
    const intervalMs = 1000;

    let lastData: any = null;

    set({ loading: true });

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          /*
           * This method is being used to retrieve/poll stream information.
           * Keep it unchanged until the API method name is verified.
           */
          const response = await streamApi.startStream(id);

          lastData = response?.data ?? response;

          const state =
            lastData?.state ??
            lastData?.status ??
            lastData?.sessionStatus ??
            lastData?.session_status;

          const playbackUrl =
            lastData?.playback_url ??
            lastData?.playbackUrl;

          console.debug("[streamStore] Stream polling result", {
            id,
            attempt,
            state,
            playbackUrl,
          });

          const isRunning =
            state === "RUNNING" ||
            state === "ACTIVE" ||
            state === "LIVE" ||
            state === "WORKING";

          if (isRunning && playbackUrl) {
            set({
              list: [lastData],
            });

            return lastData;
          }
        } catch (error) {
          console.warn("[streamStore] Stream polling failed", {
            id,
            attempt,
            error,
          });

          /*
           * Continue polling because the stream info endpoint may temporarily
           * return 404/400 while the playlist and session are being prepared.
           */
        }

        if (attempt < maxAttempts) {
          await delay(intervalMs);
        }
      }

      set({
        list: lastData ? [lastData] : [],
      });

      return lastData;
    } finally {
      set({ loading: false });
    }
  },

  heartBeat: async (sessionId: string) => {
    if (!sessionId) {
      console.warn("[streamStore] heartBeat called without sessionId");
      return null;
    }

    return streamApi.heartBeat(sessionId);
  },
}));