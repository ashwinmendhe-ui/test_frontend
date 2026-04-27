import axiosClient from "./axiosClient";

export interface PlaybackListItem {
  segment: string;
  url: string;
}

export interface PlaybackListParams {
  companyId?: string;
  siteId?: string;
  deviceSn?: string;
  missionId?: string;
}

export const playbackApi = {
  getList: async (params: PlaybackListParams): Promise<PlaybackListItem[]> => {
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
};