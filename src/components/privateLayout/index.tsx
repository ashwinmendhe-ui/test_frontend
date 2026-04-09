import { Outlet } from "react-router-dom";
import Sidebar from "../sideBar";
import Header from "../header";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/userStore";
import { hasAccess } from "@/utils/roleAccess";

export default function PrivateLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const location = useLocation();
  const navigate = useNavigate();
  const { detailUserLogin } = useUserStore();

  const currentRole = detailUserLogin?.roles?.[0];

  useEffect(() => {
    if (!currentRole) return;

    if (!hasAccess(currentRole, location.pathname)) {
      navigate("/dashboard", { replace: true });
    }
  }, [currentRole, location.pathname, navigate]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        width={sidebarWidth}
        setWidth={setSidebarWidth}
      />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="h-14 shrink-0 bg-white flex items-center px-4 border-b">
          <button
            onClick={() => {
              setCollapsed(!collapsed);

              if (!collapsed) {
                setSidebarWidth(240);
              }
            }}
            className="px-2 py-1 bg-gray-100 rounded"
          >
            ☰
          </button>
        </div>

        <div className="px-6 py-4 bg-[#F5F7FA] flex-1 min-w-0 overflow-auto">
          <Header />
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}