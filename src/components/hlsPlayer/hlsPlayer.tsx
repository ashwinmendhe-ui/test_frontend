import Hls from "hls.js";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { HLSPlayerRef } from "./types";

interface HLSPlayerProps {
  src?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  onLoadedMetadata?: () => void;
  onTimeUpdate?: () => void;
  onEnded?: () => void;
}

const HLSPlayer = forwardRef<HLSPlayerRef, HLSPlayerProps>(
  (
    {
      src,
      className,
      autoPlay = true,
      muted = true,
      controls = false,
      onLoadedMetadata,
      onTimeUpdate,
      onEnded,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
      const video = videoRef.current;

      if (!video || !src) return;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, async () => {
          if (autoPlay) {
            try {
              await video.play();
            } catch (error) {
              console.error("Video autoplay failed:", error);
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        if (autoPlay) {
          video
            .play()
            .catch((error) => console.error("Native HLS autoplay failed:", error));
        }
      }

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [src, autoPlay]);

    useImperativeHandle(ref, () => ({
      play: async () => {
        const video = videoRef.current;
        if (!video) return;
        await video.play();
      },
      pause: () => {
        const video = videoRef.current;
        if (!video) return;
        video.pause();
      },
      seekBy: (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;

        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const nextTime = video.currentTime + seconds;

        if (duration > 0) {
          video.currentTime = Math.min(Math.max(nextTime, 0), duration);
        } else {
          video.currentTime = Math.max(nextTime, 0);
        }
      },
      seekTo: (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;

        const duration = Number.isFinite(video.duration) ? video.duration : 0;

        if (duration > 0) {
          video.currentTime = Math.min(Math.max(seconds, 0), duration);
        } else {
          video.currentTime = Math.max(seconds, 0);
        }
      },
      getCurrentTime: () => {
        return videoRef.current?.currentTime ?? 0;
      },
      getDuration: () => {
        const duration = videoRef.current?.duration ?? 0;
        return Number.isFinite(duration) ? duration : 0;
      },
      isPaused: () => {
        return videoRef.current?.paused ?? true;
      },
    }));

    return (
      <video
        ref={videoRef}
        className={className}
        muted={muted}
        controls={controls}
        playsInline
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
      />
    );
  }
);

HLSPlayer.displayName = "HLSPlayer";

export default HLSPlayer;