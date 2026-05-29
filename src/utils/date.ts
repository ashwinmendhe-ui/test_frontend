const KOREA_TIMEZONE = "Asia/Seoul";

export const formatDateTime = (
  dateString: string | number | Date | undefined,
  showHour?: boolean
) => {
  if (!dateString) return "-";

  const date = new Date(dateString);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KOREA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: showHour ? "2-digit" : undefined,
    minute: showHour ? "2-digit" : undefined,
    second: showHour ? "2-digit" : undefined,
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";

  const yyyy = get("year");
  const mm = get("month");
  const dd = get("day");

  if (!showHour) {
    return `${yyyy}-${mm}-${dd}`;
  }

  const hh = get("hour");
  const mi = get("minute");
  const ss = get("second");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

export const formatTime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;
};

export const formatTimestamp = (timestamp: string | number | undefined) => {
  if (!timestamp) return "-";

  const ts = typeof timestamp === "string" ? Number(timestamp) : timestamp;
  const date = ts < 10000000000 ? new Date(ts * 1000) : new Date(ts);

  return formatDateTime(date, true);
};