export const roleAccessMap: Record<number, string[]> = {
  1: [
    "/dashboard",
    "/stream",
    "/playback",
    "/history",
    "/settings/user",
    "/settings/company",
    "/settings/site",
    "/settings/mission",
    "/settings/robot",
  ],

  2: [
    "/dashboard",
    "/stream",
    "/playback",
    "/history",
    "/settings/user",
    "/settings/site",
    "/settings/mission",
    "/settings/robot",
  ],

  3: [
    "/dashboard",
    "/stream",
    "/playback",
    "/history",
    "/settings/mission",
    "/settings/robot",
  ],
};

export const hasAccess = (role?: number, pathname?: string) => {
  if (!role || !pathname) return false;

  const allowedRoutes = roleAccessMap[role] || [];
  return allowedRoutes.some((route) => pathname.startsWith(route));
};