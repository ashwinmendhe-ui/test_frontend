import { Outlet } from "react-router-dom";
import Sidebar from "../sideBar";
import Header from "../header";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
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
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        width={sidebarWidth}
        setWidth={setSidebarWidth}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        
        {/* Top Bar (Toggle only) */}
        <div className="h-14 bg-white flex items-center px-4 border-b">
          <button
            onClick={() => {
              setCollapsed(!collapsed);

              // Reset width when collapsing
              if (!collapsed) {
                setSidebarWidth(240);
              }
            }}
            className="px-2 py-1 bg-gray-100 rounded"
          >
            ☰
          </button>
        </div>

        {/* Page Content */}
        <div className="px-6 py-4 bg-[#F5F7FA] flex-1 overflow-auto">
          <Header />
          <Outlet />
        </div>
      </div>
    </div>
  );
}