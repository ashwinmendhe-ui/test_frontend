import { playbackApi } from "@/api";
import { create } from "zustand";

export interface PlaybackItem {
  segment: string;
  url: string;
}

export interface PlaybackQueryParams {
  companyId?: string;
  siteId?: string;
  deviceSn?: string;
  missionId?: string;
}

interface Store {
  loading: boolean;
  list: PlaybackItem[];
  getPlayback: (params: PlaybackQueryParams) => Promise<void>;
  resetPlayback: () => void;
}

export const usePlaybackStore = create<Store>((set) => ({
  loading: false,
  list: [],

  getPlayback: async (params) => {
    set({ loading: true });

    try {
      const data = await playbackApi.getList(params);

      set({
        loading: false,
        list: Array.isArray(data) ? data : [],
      });
    } catch (error) {
      console.error("Failed to fetch playback list:", error);
      set({
        loading: false,
        list: [],
      });
    }
  },

  resetPlayback: () => {
    set({
      loading: false,
      list: [],
    });
  },
}));