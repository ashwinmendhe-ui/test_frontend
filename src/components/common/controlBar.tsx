import NextIcon from "@/assets/next-button-icon.svg";
import PauseIcon from "@/assets/pause-button-icon.svg";
import PlayIcon from "@/assets/play-button-icon.svg";
import PrevIcon from "@/assets/prev-button-icon.svg";
import { Slider, Tooltip } from "antd";
import { useMemo, useRef, useState } from "react";

interface BookmarkItem {
  timeSec: number | null;
  type?: string;
  label?: string;
  confidence?: number;
  position?: "top" | "bottom";
  c_ar?: number[];
}

interface ControlBarProps {
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
}

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

const getMarkerColor = (type?: string) => {
  switch (type) {
    case "vehicle":
      return "#3B82F6";
    case "person":
      return "#22C55E";
    case "safety":
      return "#F97316";
    case "alert":
      return "#EF4444";
    default:
      return "#6B7280";
  }
};

const getMarkerHeight = (index: number, type?: string) => {
  if (type === "alert") return 26;
  if (index % 4 === 0) return 24;
  if (index % 3 === 0) return 20;
  return 16;
};

export default function ControlBar({
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
}: ControlBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const lastUpdateRef = useRef(0);

  const displayTime = isDragging ? dragTime : currentTime;

  const clusteredBookmarks = useMemo(() => {
    if (duration <= 0) return [];

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
        Math.min(100, (bm.timeSec / duration) * 100)
      );

      let stackOffset = 0;
      for (let i = 0; i < idx; i++) {
        const prev = bookmarks[i];
        if (prev.timeSec == null) continue;

        const prevPercent = Math.max(
          0,
          Math.min(100, (prev.timeSec / duration) * 100)
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
  }, [bookmarks, duration]);

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

        <div className="flex-1 px-4">
          <div className="relative w-full">
            <Slider
              value={displayTime}
              max={duration > 0 ? duration : 100}
              min={0}
              step={0.1}
              onChange={handleChange}
              onChangeComplete={handleAfterChange}
              disabled={disabled}
              tooltip={{ formatter: (value) => formatTime(value || 0) }}
              className="m-0! p-0! h-[31px]!"
              styles={{
                track: {
                  backgroundColor: "#D1D1D6",
                  height: "31px",
                },
                rail: {
                  backgroundColor: "#E9ECF0",
                  height: "31px",
                },
                handle: {
                  width: "2px",
                  height: "35px",
                  backgroundColor: "#9BA2A9",
                  marginTop: "-5px",
                  zIndex: 2,
                  boxShadow: "none",
                },
              }}
            />

            {duration > 0 && clusteredBookmarks.length > 0 && (
              <div className="pointer-events-none absolute inset-0">
                {clusteredBookmarks.map((bm) => {
                  if (bm.timeSec == null) return null;

                  const markerHeight = getMarkerHeight(bm.idx, bm.type);
                  const markerColor = getMarkerColor(bm.type);

                  const tooltipContent = (
                    <div className="text-xs leading-5">
                      <div className="font-semibold">{bm.label || bm.type || "Event"}</div>
                      <div>{formatTime(bm.timeSec)}</div>
                      {typeof bm.confidence === "number" && (
                        <div>Confidence: {bm.confidence}%</div>
                      )}
                    </div>
                  );

                  return (
                    <Tooltip key={`${bm.timeSec}-${bm.idx}`} title={tooltipContent}>
                      <div
                        className="absolute pointer-events-auto cursor-pointer"
                        style={{
                          left: `${bm.positionPercent}%`,
                          top: `${4 + bm.stackOffset}px`,
                          transform: "translateX(-50%)",
                          zIndex: 3,
                        }}
                        onClick={() => handleBookmarkTap(bm.timeSec as number)}
                      >
                        <div
                          className="rounded-sm"
                          style={{
                            width: "3px",
                            height: `${markerHeight}px`,
                            backgroundColor: markerColor,
                            boxShadow: `0 0 0 1px ${markerColor}20`,
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

        <div className="text-sm text-gray-600 min-w-[140px] text-left">
          {formatTime(displayTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}