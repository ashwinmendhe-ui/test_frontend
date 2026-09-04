import axiosClient from "./axiosClient";

export const historyApi = {
  getList: async () => {
    const res = await axiosClient.get("/v1/history");
    return res.data;
  },

  getDetail: async (id: string) => {
    const res = await axiosClient.get(
      `/v1/history/${id}`
    );

    return res.data;
  },

  getBySessionId: async (sessionId: string) => {
    const res = await axiosClient.get(
      `/v1/history/session/${sessionId}`
    );

    return res.data?.data ?? res.data;
  },

  updateWorkIssue: async (
    id: string,
    workIssue: string
  ) => {
    const res = await axiosClient.patch(
      `/v1/history/${id}/work-issue`,
      {
        workIssue,
      }
    );

    return res.data;
  },
};