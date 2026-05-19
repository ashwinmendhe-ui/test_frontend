import React from "react";

interface LiveMapProps {
  latitude?: number;
  longitude?: number;
  currentTime?: number;
  videoUrl?: string;
  gpsData?: any[];
  mode?: "stream" | "playback";
  streamStatus?: {
    error?: string | null;
    isLoading?: boolean;
    videoConnected?: boolean;
    isPaused?: boolean;
    isReconnecting?: boolean;
  };
}

export const LiveMap: React.FC<LiveMapProps> = ({
  latitude,
  longitude,
  streamStatus,
}) => {
  const hasValidLocation =
  latitude !== undefined &&
  longitude !== undefined;
  return (
    <div className="relative w-full h-full overflow-hidden rounded-[10px] bg-[#788191]">
      {hasValidLocation ? (
  <>
    <iframe
      title="Live Route Map"
      width="100%"
      height="100%"
      loading="lazy"
      className="border-0"
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=17&output=embed`}
    />

    {/* Center marker like ref */}
    <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#06B6D4] shadow-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-white"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" />
        </svg>
      </div>
    </div>
  </>
) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2m0 18l6-2m-6 2V2m6 16l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 14V4m-6-2l6 2"
              />
            </svg>
          </div>

          <p className="text-white text-[15px] font-medium">
            {streamStatus?.isLoading ||
            streamStatus?.isReconnecting ||
            streamStatus?.videoConnected
              ? "Waiting for GPS data..."
              : "Map will appear after stream starts"}
          </p>
        </div>
      )}
    </div>
  );
};