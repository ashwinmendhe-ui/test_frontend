import axiosClient from "./axiosClient";

export const historyApi = {
  getList: async () => {
    const res = await axiosClient.get("/v1/history");
    return res.data;
  },

  getDetail: async (id: string) => {
    const res = await axiosClient.get(`/v1/history/${id}`);
    return res.data;
  },
};