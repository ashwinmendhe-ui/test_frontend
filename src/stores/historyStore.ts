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

  userId?: string;
  userName: string;

  sessionId?: string;

  startTime?: string;
  endTime?: string;
  totalTime?: string;

  playbackUrl?: string;

  totalRecognition: number;

  detectionTypes: string[];
  mainDetectionType?: string | null;

  workIssue?: string | null;

  createdAt: string;
  videoStatus?: string;
}

export interface ReportData {
  historyId?: string;

  companyId?: string;
  companyName?: string;

  siteId?: string;
  siteName: string;

  missionId?: string;
  missionName?: string;

  deviceSn: string;
  deviceName: string;
  robotName?: string;

  userId?: string;
  userName: string;
  workerName?: string;

  sessionId?: string;

  startTime: string;
  endTime: string;
  totalTime?: string;

  totalRecognition?: number;

  duration?: string;
  distance?: string;

  playbackUrl: string;
  reportCreatedAt?: string;

  detectionTypes: string[];
  mainDetectionType?: string | null;

  workIssue?: string | null;

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

  getDetail: (
    id: string
  ) => Promise<ReportData>;

  updateWorkIssue: (
    id: string,
    workIssue: string
  ) => Promise<ReportData>;

  downloadHistory: (
    id: string
  ) => Promise<{
    code?: number | string;
    message?: string;
  }>;
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

    detectionTypes: [],
    mainDetectionType: null,
    workIssue: null,

    labelCounts: {},
    bookmarks: [],
  },

  getList: async () => {
    try {
      set({
        loading: true,
      });

      const res =
        await historyApi.getList();

      const normalizedList: HistoryManagementTable[] =
        res.map(
          (item: HistoryManagementTable) => ({
            ...item,

            detectionTypes:
              item.detectionTypes || [],

            mainDetectionType:
              item.mainDetectionType ?? null,

            workIssue:
              item.workIssue ?? null,
          })
        );

      set({
        list: normalizedList,
      });
    } catch (error) {
      console.error(
        "History list API error:",
        error
      );

      set({
        list: [],
      });
    } finally {
      set({
        loading: false,
      });
    }
  },

  getDetail: async (id) => {
    try {
      set({
        loading: true,
      });

      const res =
        await historyApi.getDetail(id);

      const normalizedDetail: ReportData = {
        ...res,

        robotName:
          res.robotName ||
          res.deviceName,

        workerName:
          res.workerName ||
          res.userName,

        duration:
          res.duration ||
          res.totalTime,

        reportCreatedAt:
          res.reportCreatedAt ||
          res.endTime ||
          res.startTime,

        detectionTypes:
          res.detectionTypes || [],

        mainDetectionType:
          res.mainDetectionType ?? null,

        workIssue:
          res.workIssue ?? null,

        labelCounts:
          res.labelCounts || {},

        bookmarks:
          res.bookmarks || [],
      };

      set({
        detail: normalizedDetail,
      });

      return normalizedDetail;
    } catch (error) {
      console.error(
        "History detail API error:",
        error
      );

      throw error;
    } finally {
      set({
        loading: false,
      });
    }
  },

  updateWorkIssue: async (
    id,
    workIssue
  ) => {
    try {
      set({
        loading: true,
      });

      const res =
        await historyApi.updateWorkIssue(
          id,
          workIssue
        );

      const normalizedDetail: ReportData = {
        ...res,

        robotName:
          res.robotName ||
          res.deviceName,

        workerName:
          res.workerName ||
          res.userName,

        duration:
          res.duration ||
          res.totalTime,

        reportCreatedAt:
          res.reportCreatedAt ||
          res.endTime ||
          res.startTime,

        detectionTypes:
          res.detectionTypes || [],

        mainDetectionType:
          res.mainDetectionType ?? null,

        workIssue:
          res.workIssue ?? null,

        labelCounts:
          res.labelCounts || {},

        bookmarks:
          res.bookmarks || [],
      };

      /*
       * Update the History list immediately so we do not
       * need another GET /history request after editing.
       */
      set((state) => ({
        detail: normalizedDetail,

        list: state.list.map((item) =>
          item.historyId === id
            ? {
                ...item,
                workIssue:
                  normalizedDetail.workIssue ??
                  null,
              }
            : item
        ),
      }));

      return normalizedDetail;
    } catch (error) {
      console.error(
        "Failed to update work issue:",
        error
      );

      throw error;
    } finally {
      set({
        loading: false,
      });
    }
  },

  downloadHistory: async () => {
    return {
      code: 0,
    };
  },
}));