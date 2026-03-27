export const roleAccessMap: Record<number, string[]> = {
  // System Administrator
  1: [
    "/dashboard",
    "/stream",
    "/history",
    "/settings/user",
    "/settings/company",
    "/settings/site",
    "/settings/mission",
    "/settings/robot",
  ],

  // Company Admin
  2: [
    "/dashboard",
    "/stream",
    "/history",
    "/settings/user",
    "/settings/site",
    "/settings/mission",
    "/settings/robot",
  ],

  // Company User
  3: [
    "/dashboard",
    "/stream",
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