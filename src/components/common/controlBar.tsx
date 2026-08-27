import NextIcon from "@/assets/next-button-icon.svg";
import PauseIcon from "@/assets/pause-button-icon.svg";
import PlayIcon from "@/assets/play-button-icon.svg";
import PrevIcon from "@/assets/prev-button-icon.svg";
import { Slider, Tooltip } from "antd";
import { useMemo, useRef, useState } from "react";

interface BookmarkItem {
  id?: string;
  timeSec: number | null;
  type?: string;
  label?: string;
  confidence?: number;
  position?: "top" | "bottom";
  classIds?: number[];
  labels?: string[];
  c_ar?: number[];
}

interface ControlBarProps {
  isLive?: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onTimeChange: (value: number) => void;
  onTimeChangeComplete: (value: number) => void;
  disabled?: boolean;
  bookmarks?: BookmarkItem[];
  onBookmarkClick?: (time: number) => void;
  className?: string;
  showCommonDetection?: boolean;
showDangerDetection?: boolean;
selectedClassIds?: number[];
}

const CLASS_LABELS: Record<number, string> = {
  0: "Construction",
  1: "Hardhat",
  2: "Mask",
  3: "NO-Hardhat",
  4: "NO-Mask",
  5: "NO-Safety Vest",
  6: "Person",
  7: "Safety Cone",
  8: "Safety Vest",
  9: "Machinery",
  10: "Vehicle",
  20: "NO-Hardhat(LLM)",
  21: "NO-Safety Vest(LLM)",
  22: "NO-Safety Rope(LLM)",
};

const formatTime = (value: number): string => {
  if (!Number.isFinite(value) || value < 0) return "00:00:00";

  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};

const getMarkerColor = (type?: string, classIds: number[] = []) => {
  const firstClassId = classIds[0];

  const colorByClassId: Record<number, string> = {
    0: "#8B6F63", // Construction
    1: "#FFD600", // HardHat
    2: "#A855F7", // Mask
    3: "#FF2D55", // NO-Hardhat
    4: "#D100D8", // NO-Mask
    5: "#FF8A00", // NO-Safety Vest
    6: "#22C55E", // Person
    7: "#FF8A00", // Safety Cone
    8: "#1683FF", // Safety Vest
    9: "#14B8C8", // Machinery
    10: "#1683FF", // Vehicle
    20: "#FF2D55", // NO-Hardhat LLM
    21: "#FF8A00", // NO-Safety Vest LLM
    22: "#FF2D55", // NO-Safety Rope LLM
  };

  if (typeof firstClassId === "number" && colorByClassId[firstClassId]) {
    return colorByClassId[firstClassId];
  }

  switch (type) {
    case "vehicle":
      return "#1683FF";
    case "person":
      return "#22C55E";
    case "safety":
      return "#FF8A00";
    case "alert":
      return "#FF2D55";
    default:
      return "#FF2D55";
  }
};

export default function ControlBar({
  isLive = false,
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onPrevious,
  onNext,
  onTimeChange,
  onTimeChangeComplete,
  disabled = false,
  bookmarks = [],
  onBookmarkClick,
  className = "",
  showCommonDetection = true,
  showDangerDetection = true,
  selectedClassIds = [],
}: ControlBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const lastUpdateRef = useRef(0);
  
  const displayTime = isDragging ? dragTime : currentTime;
  const timelineDuration = isLive
  ? Math.max(duration, currentTime + 7)
  : duration;

  const clusteredBookmarks = useMemo(() => {
    if (timelineDuration <= 0) return [];

    return bookmarks.map((bm, idx) => {
      if (bm.timeSec == null) {
        return {
          ...bm,
          idx,
          positionPercent: 0,
          stackOffset: 0,
        };
      }

      const positionPercent = Math.max(
        0,
        Math.min(100, (bm.timeSec / timelineDuration) * 100)
      );

      let stackOffset = 0;
      for (let i = 0; i < idx; i++) {
        const prev = bookmarks[i];
        if (prev.timeSec == null) continue;

        const prevPercent = Math.max(
          0,
          Math.min(100, (prev.timeSec / timelineDuration) * 100)
        );

        if (Math.abs(prevPercent - positionPercent) < 1.2) {
          stackOffset += 4;
        }
      }

      return {
        ...bm,
        idx,
        positionPercent,
        stackOffset,
      };
    });
  }, [bookmarks, timelineDuration]);

  const handleChange = (value: number) => {
    if (!isDragging) {
      setIsDragging(true);
    }

    setDragTime(value);

    const now = Date.now();
    if (now - lastUpdateRef.current > 16) {
      onTimeChange(value);
      lastUpdateRef.current = now;
    }
  };

  const handleAfterChange = (value: number) => {
    setIsDragging(false);
    onTimeChangeComplete(value);
  };

  const handleBookmarkTap = (time: number) => {
    if (onBookmarkClick) {
      onBookmarkClick(time);
      return;
    }

    onTimeChangeComplete(time);
  };

  const DANGER_CLASS_IDS = [3, 4, 5, 20, 21, 22];

const filteredBookmarks = clusteredBookmarks
  .map((bm) => {
    const classIds = bm.classIds?.length
      ? bm.classIds.map(Number)
      : (bm.c_ar ?? []).map(Number);

    const visibleClassIds = classIds.filter((classId) => {
      if (!selectedClassIds.includes(classId)) {
        return false;
      }

      const isDanger = DANGER_CLASS_IDS.includes(classId);

      if (isDanger && !showDangerDetection) {
        return false;
      }

      if (!isDanger && !showCommonDetection) {
        return false;
      }

      return true;
    });

    return {
      ...bm,
      visibleClassIds,
    };
  })
  .filter((bm) => bm.visibleClassIds.length > 0);

  return (
    <div className={`w-full mt-3 bg-white rounded-[7px] px-4 py-2.5 ${className}`}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onPrevious}
          disabled={disabled}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary disabled:opacity-50"
        >
          <img src={PrevIcon} alt="Previous" />
        </button>

        <button
          type="button"
          onClick={onPlayPause}
          disabled={disabled}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary disabled:opacity-50"
        >
          <img src={isPlaying ? PauseIcon : PlayIcon} alt="Play pause" />
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={disabled}
          className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-primary disabled:opacity-50"
        >
          <img src={NextIcon} alt="Next" />
        </button>

        <div className="flex-1 px-2">
          <div className="relative w-full">
              <Slider
              value={displayTime}
              max={timelineDuration > 0 ? timelineDuration : 100}
              min={0}
              step={0.1}
              onChange={handleChange}
              onChangeComplete={handleAfterChange}
              disabled={disabled}
              tooltip={{
                formatter: (value) => formatTime(value || 0),
              }}
              className="m-0! p-0! h-[31px]!"
              styles={{
                track: {
                  backgroundColor: "#D1D1D6",
                  height: "28px",
                },
                rail: {
                  backgroundColor: "#E9ECF0",
                  height: "28px",
                },
                handle: {
                  width: "2px",
                  height: "32px",
                  backgroundColor: "#9BA2A9",
                  marginTop: "-5px",
                  zIndex: 5,
                  boxShadow: "none",
                },
              }}
            />
            

            {duration > 0 && filteredBookmarks.length > 0 && (
              <div className="pointer-events-none absolute inset-0">
                {filteredBookmarks.map((bm) => {
                  if (bm.timeSec == null) return null;

                 const classIds = bm.visibleClassIds;


                  const markerColor = getMarkerColor(
                    bm.type,
                    classIds
                  );

                  const markerLabels = classIds.map(
                      (id) =>
                        CLASS_LABELS[Number(id)] ||
                        `Class ${id}`
                    );

                  const tooltipContent = (
                    <div className="text-xs leading-5">
                      <div className="font-semibold">
                        {markerLabels.length > 0
                          ? markerLabels.join(", ")
                          : bm.type || "Event"}
                      </div>

                      <div>
                        Time: {formatTime(bm.timeSec)}
                      </div>

                      {classIds.length > 0 && (
                        <div>
                          Class ID: {classIds.join(", ")}
                        </div>
                      )}

                      {typeof bm.confidence === "number" && (
                        <div>
                          Confidence: {bm.confidence}%
                        </div>
                      )}
                    </div>
                  );
                  return (
                    <Tooltip
                    key={bm.id || `${bm.timeSec}-${bm.idx}`}
                    title={tooltipContent}
                  >
                    <div
                      className="cursor-pointer pointer-events-auto absolute"
                      style={{
                        left: `${bm.positionPercent}%`,
                        top: bm.position === "bottom" ? "50%" : "0",
                        transform: "translateX(-50%)",
                        zIndex: 4,
                      }}
                      onClick={() =>
                        handleBookmarkTap(bm.timeSec as number)
                      }
                    >
                      <div
                        className="w-1"
                        style={{
                          height: "14px",
                          backgroundColor: markerColor,
                        }}
                      />
                    </div>
                  </Tooltip>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="text-[18px] font-medium text-[#4B5563] min-w-[170px] text-left pl-2">
          {formatTime(displayTime)} / {formatTime(timelineDuration)}
        </div>
      </div>
    </div>
  );
}