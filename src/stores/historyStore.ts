import { create } from "zustand";

export interface HistoryManagementTable {
  historyId: string;
  companyName: string;
  siteName: string;
  missionName: string;
  deviceName: string;
  userName: string;
  totalRecognition: number;
  createdAt: string;
}

export interface ReportData {
  deviceSn: string;
  siteName: string;
  deviceName: string;
  robotName?: string;
  missionName?: string;
  userName: string;
  workerName?: string;
  startTime: string;
  endTime: string;
  totalTime?: string;
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
  getList: (param?: string, from?: string, to?: string) => void;
  getDetail: (id: string) => void;
  downloadHistory: (id: string) => Promise<{ code?: number | string; message?: string }>;
}

const mockHistoryList: HistoryManagementTable[] = [
  {
    historyId: "1",
    companyName: "Dhive",
    siteName: "Site Alpha",
    missionName: "Alpha Patrol",
    deviceName: "Robot Alpha",
    userName: "Ashwin",
    totalRecognition: 12,
    createdAt: "2026-03-25 10:20",
  },
  {
    historyId: "2",
    companyName: "Test Company",
    siteName: "Site Beta",
    missionName: "Beta Monitoring",
    deviceName: "Robot Beta",
    userName: "John",
    totalRecognition: 7,
    createdAt: "2026-03-24 15:10",
  },
];

const mockHistoryDetail: Record<string, ReportData> = {
  "1": {
    deviceSn: "SN-1001",
    siteName: "Site Alpha",
    deviceName: "Robot Alpha",
    robotName: "Robot Alpha",
    missionName: "Alpha Patrol",
    userName: "Ashwin",
    workerName: "Ashwin",
    startTime: "2026-03-25 09:00",
    endTime: "2026-03-25 10:20",
    totalTime: "01:20:00",
    duration: "01:20:00",
    distance: "3.2 km",
    playbackUrl: "https://example.com/playback-alpha.mp4",
    reportCreatedAt: "2026-03-25 10:30",
    labelCounts: {
      Helmet: 4,
      Vest: 3,
      "NO-MASK": 2,
      "NO-HELMET": 3,
    },
    bookmarks: [
      { label: "Helmet", mdisplay: "00:03:15", duration: "00:03:15" },
      { label: "NO-MASK", mdisplay: "00:11:40", duration: "00:11:40" },
      { label: "NO-HELMET", mdisplay: "00:24:05", duration: "00:24:05" },
    ],
  },
  "2": {
    deviceSn: "SN-2001",
    siteName: "Site Beta",
    deviceName: "Robot Beta",
    robotName: "Robot Beta",
    missionName: "Beta Monitoring",
    userName: "John",
    workerName: "John",
    startTime: "2026-03-24 14:00",
    endTime: "2026-03-24 15:10",
    totalTime: "01:10:00",
    duration: "01:10:00",
    distance: "2.1 km",
    playbackUrl: "https://example.com/playback-beta.mp4",
    reportCreatedAt: "2026-03-24 15:15",
    labelCounts: {
      Helmet: 2,
      Vest: 2,
      "NO-MASK": 1,
      Gloves: 2,
    },
    bookmarks: [
      { label: "Vest", mdisplay: "00:05:30", duration: "00:05:30" },
      { label: "NO-MASK", mdisplay: "00:18:10", duration: "00:18:10" },
    ],
  },
};

export const useHistoryStore = create<Store>((set) => ({
  loading: false,
  list: mockHistoryList,
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

  getList: (param, from, to) => {
    set({ loading: true });

    let filtered = [...mockHistoryList];

    if (param?.trim()) {
      const q = param.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.companyName.toLowerCase().includes(q) ||
          item.siteName.toLowerCase().includes(q) ||
          item.missionName.toLowerCase().includes(q) ||
          item.deviceName.toLowerCase().includes(q) ||
          item.userName.toLowerCase().includes(q)
      );
    }

    if (from && to) {
      const fromTime = new Date(from).getTime();
      const toTime = new Date(to).getTime();

      filtered = filtered.filter((item) => {
        const itemTime = new Date(item.createdAt).getTime();
        return itemTime >= fromTime && itemTime <= toTime;
      });
    }

    set({ loading: false, list: filtered });
  },

  getDetail: (id) => {
    set({ loading: true });
    set({
      loading: false,
      detail:
        mockHistoryDetail[id] || {
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
    });
  },

  downloadHistory: async () => {
    return { code: 0 };
  },
}));