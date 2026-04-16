import { Slider } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { HLSPlayerRef } from "@/components/hlsPlayer/types";
import PlayIcon from "@/assets/play-button-icon.svg";
import PauseIcon from "@/assets/pause-button-icon.svg";
import PrevIcon from "@/assets/prev-button-icon.svg";
import NextIcon from "@/assets/next-button-icon.svg";

interface ControlBarProps {
  playerRef: React.RefObject<HLSPlayerRef | null>;
  className?: string;
  disabled?: boolean;
}

const formatTime = (timeInSeconds: number): string => {
  if (!Number.isFinite(timeInSeconds) || timeInSeconds < 0) return "00:00:00";

  const totalSeconds = Math.floor(timeInSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};

export default function ControlBar({
  playerRef,
  className = "",
  disabled = false,
}: ControlBarProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const player = playerRef.current;

      if (!player || disabled) {
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        return;
      }

      const nextCurrentTime = player.getCurrentTime();
      const nextDuration = player.getDuration();
      const paused = player.isPaused();

      setIsPlaying(!paused);
      setDuration(nextDuration);

      if (!isSliding) {
        setCurrentTime(nextCurrentTime);
      }
    }, 300);

    return () => {
      window.clearInterval(interval);
    };
  }, [playerRef, isSliding, disabled]);

  const canSeek = !disabled && duration > 0 && Number.isFinite(duration);

  const progressPercent = useMemo(() => {
    if (!canSeek) return 0;
    return (currentTime / duration) * 100;
  }, [canSeek, currentTime, duration]);

  const handleTogglePlay = async () => {
    if (disabled) return;

    const player = playerRef.current;
    if (!player) return;

    try {
      if (player.isPaused()) {
        await player.play();
        setIsPlaying(true);
      } else {
        player.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Failed to toggle play state:", error);
    }
  };

  const handleSeekBackward = () => {
    if (!canSeek) return;
    playerRef.current?.seekBy(-10);
  };

  const handleSeekForward = () => {
    if (!canSeek) return;
    playerRef.current?.seekBy(10);
  };

  const handleSliderChange = (value: number) => {
    if (!canSeek) return;

    const nextTime = (value / 100) * duration;
    setCurrentTime(nextTime);
  };

  const handleSliderAfterChange = (value: number) => {
    if (!canSeek) {
      setIsSliding(false);
      return;
    }

    const nextTime = (value / 100) * duration;
    playerRef.current?.seekTo(nextTime);
    setIsSliding(false);
  };

  const buttonBaseClass =
    "shrink-0 flex items-center justify-center bg-[#F3F4F6] border border-[#E1E5EA] rounded-[8px] disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div
      className={`w-full rounded-[10px] bg-white border border-[#ECEFF3] px-6 py-3 min-h-[82px] flex items-center ${className}`}
    >
      <div className="flex items-center gap-4 shrink-0">
        <button
          type="button"
          onClick={handleSeekBackward}
          disabled={!canSeek}
          className={`${buttonBaseClass} w-[48px] h-[40px]`}
        >
          <img src={PrevIcon} alt="Previous" className="w-[16px] h-[16px]" />
        </button>

        <button
          type="button"
          onClick={handleTogglePlay}
          disabled={disabled}
          className={`${buttonBaseClass} w-[48px] h-[40px]`}
        >
          <img
            src={isPlaying ? PauseIcon : PlayIcon}
            alt="Play pause"
            className="w-[16px] h-[16px]"
          />
        </button>

        <button
          type="button"
          onClick={handleSeekForward}
          disabled={!canSeek}
          className={`${buttonBaseClass} w-[48px] h-[40px]`}
        >
          <img src={NextIcon} alt="Next" className="w-[16px] h-[16px]" />
        </button>

        <div className="w-px h-[42px] bg-[#C9CED6] ml-1 mr-2 shrink-0" />
      </div>

      <div className="flex-1 min-w-0 px-2">
        <Slider
          value={progressPercent}
          min={0}
          max={100}
          step={0.1}
          disabled={!canSeek}
          tooltip={{ open: false }}
          onChange={(value) => {
            setIsSliding(true);
            handleSliderChange(value);
          }}
          onChangeComplete={handleSliderAfterChange}
          styles={{
            rail: {
              backgroundColor: "#ECEDEF",
              height: 6,
            },
            track: {
              backgroundColor: "#D2D6DC",
              height: 6,
            },
            handle: {
              width: 16,
              height: 16,
              marginTop: -5,
              borderColor: "#B8BEC8",
              boxShadow: "none",
              backgroundColor: "#FFFFFF",
            },
          }}
        />
      </div>

      <div className="shrink-0 min-w-[155px] text-right text-[16px] font-medium text-[#4B5565] pl-4">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}