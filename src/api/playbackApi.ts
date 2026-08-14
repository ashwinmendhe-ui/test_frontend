import axiosClient from "./axiosClient";

export interface PlaybackListItem {
  segment: string;
  url: string;
  sessionId?: string | null;
}

export interface PlaybackOptionItem {
  deviceSn: string;
  deviceName: string;
  missionId?: string | null;
  missionName?: string;
}

export interface PlaybackTelemetryItem {
  recordedAt: string;
  offsetMs: number;

  status?: string | null;
  battery?: number | null;
  network?: string | null;
  gps?: string | null;

  latitude?: number | null;
  longitude?: number | null;
  altitude?: number | null;
  speed?: number | null;
}

export interface PlaybackListParams {
  companyId?: string;
  siteId?: string;
  deviceSn?: string;
  missionId?: string;
}

export const playbackApi = {
  getList: async (
    params: PlaybackListParams
  ): Promise<PlaybackListItem[]> => {
    const res = await axiosClient.get("/v1/playback/list", {
      params: {
        companyId: params.companyId || "",
        siteId: params.siteId || "",
        deviceSn: params.deviceSn || "",
        missionId: params.missionId || "",
      },
    });

    return Array.isArray(res.data) ? res.data : [];
  },

  getOptions: async (
    companyId?: string,
    siteId?: string
  ): Promise<PlaybackOptionItem[]> => {
    const res = await axiosClient.get("/v1/playback/options", {
      params: {
        companyId: companyId || "",
        siteId: siteId || "",
      },
    });

    return Array.isArray(res.data) ? res.data : [];
  },

  getTelemetry: async (
    sessionId: string
  ): Promise<PlaybackTelemetryItem[]> => {
    const res = await axiosClient.get(
      `/v1/playback/${sessionId}/telemetry`
    );

    return Array.isArray(res.data) ? res.data : [];
  },
};