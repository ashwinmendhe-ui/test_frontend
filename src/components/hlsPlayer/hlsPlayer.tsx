import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Hls from "hls.js";

export type HLSPlayerRef = {
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
};

interface HLSPlayerProps {
  videoUrl?: string;
  autoPlay?: boolean;
  className?: string;
}

const HLSPlayer = forwardRef<HLSPlayerRef, HLSPlayerProps>(
  ({ videoUrl, autoPlay = true, className }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize HLS
    useEffect(() => {
      if (!videoUrl || !videoRef.current) return;

      setIsLoading(true);
      setError(null);

      const video = videoRef.current;

      // Clean previous instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          lowLatencyMode: true,
        });

        hlsRef.current = hls;

        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          if (autoPlay) {
            video.play().catch(() => {});
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error("HLS error:", data);
          setError("Stream error");
          setIsLoading(false);
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = videoUrl;
        video.addEventListener("loadedmetadata", () => {
          setIsLoading(false);
          if (autoPlay) {
            video.play().catch(() => {});
          }
        });
      } else {
        setError("HLS not supported in this browser");
        setIsLoading(false);
      }

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [videoUrl, autoPlay]);

    // Expose controls
    useImperativeHandle(ref, () => ({
      play: async () => {
        await videoRef.current?.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
      seek: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      getCurrentTime: () => videoRef.current?.currentTime || 0,
      getDuration: () => videoRef.current?.duration || 0,
    }));

    return (
      <div className={`relative w-full h-full bg-black ${className || ""}`}>
        {/* Video */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          controls={false}
          muted
          playsInline
        />

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            Loading stream...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-red-400">
            {error}
          </div>
        )}
      </div>
    );
  }
);

export default HLSPlayer;