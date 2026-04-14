import type React from "react";

export const getMetadataBaseUrl = (videoUrl: string): string => {
  if (videoUrl.includes("/")) {
    const parts = videoUrl.split("/");
    parts.pop();
    return parts.join("/");
  }
  return videoUrl;
};

export const createSingleVideoControls = (
  playerRef: React.RefObject<any>,
  currentTime: number,
  duration: number,
  setCurrentTime: (time: number) => void,
  setIsPlaying: (playing: boolean) => void
) => {
  const handlePlayPause = (isPlaying: boolean) => {
    if (isPlaying) {
      playerRef.current?.pause?.();
      setIsPlaying(false);
    } else {
      playerRef.current
        ?.play?.()
        ?.then(() => setIsPlaying(true))
        ?.catch((e: Error) => {
          console.error("Playback error:", e);
          alert("Playback error: " + e.message);
        });
    }
  };

  const handlePrevious = () => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    playerRef.current?.seek?.(newTime);
  };

  const handleNext = () => {
    const newTime = Math.min(duration, currentTime + 10);
    setCurrentTime(newTime);
    playerRef.current?.seek?.(newTime);
  };

  const handleTimeChange = (value: number) => {
    setCurrentTime(Math.max(0, Math.min(duration, value)));
  };

  const handleTimeChangeComplete = (value: number) => {
    const clampedTime = Math.max(0, Math.min(duration, value));
    setCurrentTime(clampedTime);
    playerRef.current?.seek?.(clampedTime);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  return {
    handlePlayPause,
    handlePrevious,
    handleNext,
    handleTimeChange,
    handleTimeChangeComplete,
    handleTimeUpdate,
  };
};