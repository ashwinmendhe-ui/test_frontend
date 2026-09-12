export const normalizeDeviceType = (value?: string): string => {
  if (!value) return "";

  const normalized = value.trim().toLowerCase();

  if (
    normalized === "drone" ||
    normalized === "드론"
  ) {
    return "Drone";
  }

  if (
    normalized === "robot" ||
    normalized === "로봇" ||
    normalized === "4족보행 로봇" ||
    normalized === "quadruped" ||
    normalized === "quadruped robot"
  ) {
    return "Robot";
  }

  if (normalized === "dock") {
    return "Dock";
  }

  // Preserve unexpected backend values instead of hiding them.
  return value;
};