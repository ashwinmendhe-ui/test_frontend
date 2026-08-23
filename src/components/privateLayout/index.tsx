import { Outlet } from "react-router-dom";
import Sidebar from "../sideBar";
import Header from "../header";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/userStore";
import { hasAccess } from "@/utils/roleAccess";
import { getKstNowText } from "@/utils/dateTime";
import {
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";

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
  <div className="relative flex h-screen overflow-hidden">
    <Sidebar
      collapsed={collapsed}
      width={sidebarWidth}
      setWidth={setSidebarWidth}
    />

   <button
  onClick={() => {
    setCollapsed(!collapsed);

    if (!collapsed) {
      setSidebarWidth(240);
    }
  }}
  className="absolute top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 px-2 py-1 bg-gray-100 rounded shadow-sm"
  style={{
    left: collapsed ? 100 : sidebarWidth,
  }}
>
  {collapsed ? <RightOutlined /> : <LeftOutlined />}
</button>
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