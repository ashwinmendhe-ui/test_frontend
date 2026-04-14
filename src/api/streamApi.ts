import axios from "axios";
import axiosClient from "./axiosClient";

export interface StreamData {
  deviceSn: string;
  urlType: number;
  videoId: {
    droneSn: string;
    payloadIndex: {
      type: number;
      subType?: number;
      position?: number;
    };
    videoType?: string;
  };
  videoQuality: number;
  videoType?: string;
  missionId?: string;
}

export interface CreateReport {
  deviceSn: string;
  playbackUrl: string;
  missionId: string;
}

export const streamApi = {
  start: async (data?: StreamData) => {
    const res = await axiosClient.post("/v1/live/streams/start", data);
    return res.data;
  },

  stop: async (data?: StreamData) => {
    const res = await axiosClient.post("/v1/live/streams/stop", data);
    return res.data;
  },

  startStream: async (id?: string) => {
    const res = await axios.get(`http://52.64.157.221:7879/api/stream/${id}`);
    return res.data;
  },

  heartBeat: async (sessionId: string) => {
    const res = await axiosClient.post(
      `/v1/live/streams/heartbeat?sessionId=${sessionId}`
    );
    return res.data;
  },

  createReport: async (data?: CreateReport) => {
    const res = await axiosClient.post("/v1/history", data);
    return res.data;
  },
};