import { Outlet } from "react-router-dom";
import Sidebar from "../sideBar";
import Header from "../header";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/userStore";
import { hasAccess } from "@/utils/roleAccess";
import { getKstNowText } from "@/utils/dateTime";

export default function PrivateLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [kstTime, setKstTime] = useState(getKstNowText());

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

  useEffect(() => {
    const timer = setInterval(() => {
      setKstTime(getKstNowText());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FA]">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        width={sidebarWidth}
        setWidth={setSidebarWidth}
      />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="px-6 pt-0 pb-4 bg-[#F5F7FA] flex-1 min-w-0 overflow-auto">
          <Header />

          <div className="text-[13px] font-bold text-[#8E8E93] mb-0">
            {kstTime}
          </div>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}