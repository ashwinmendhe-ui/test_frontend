import { Menu, Avatar, Button } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";
import { menuItems } from "../../constants/menu";
import LogoutIcon from "../../assets/logout-icon.svg";
import { useAuthStore } from "../../stores/authStore";
import { useEffect } from "react";
import { useUserStore } from "@/stores/userStore";

export default function Sidebar({
  collapsed,
  width,
  setWidth,
}: {
  collapsed: boolean;
  width: number;
  setWidth: (w: number) => void;
}) {

  const { detailUserLogin, getDetailUserLogin } = useUserStore();
  const userRole = detailUserLogin?.roles?.[0];

  const filterMenuByRole = (items: typeof menuItems, role?: number) => {
  // Admin
  if (role === 1) {
    return items;
  }

  // Company Admin
  if (role === 2) {
    return items;
  }

  // Operator
  if (role === 3) {
    return items.filter((item) => item.key !== "/settings");
  }

  return items;
};
  const filteredMenuItems = filterMenuByRole(menuItems, userRole);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();

  const MIN_WIDTH = 180;
  const MAX_WIDTH = 600;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (collapsed) return;

    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      if (newWidth > MIN_WIDTH && newWidth < MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  useEffect(() => {
  getDetailUserLogin();
}, [getDetailUserLogin]);
const currentRole = detailUserLogin?.roles?.[0];

const roleLabel =
  currentRole === 1
    ? "Admin"
    : currentRole === 2
    ? "Company Admin"
    : currentRole === 3
    ? "Operator"
    : "No role";

  return (
    <div
      style={{ width: collapsed ? 80 : width }}
      className="bg-white border-r border-[#E5E7EB] min-h-screen px-[16px] py-[40px] relative transition-all duration-300"
    >
      {/* 🔹 Top Section */}
      <div className="flex flex-col items-center border-b border-[#DDE0E5] pb-8 gap-4">
        <div className="flex items-center">
          <Avatar shape="square" size={40} icon={<UserOutlined />} />
          {!collapsed && (
            <div className="ml-3 font-bold text-[#757575] text-base">
              {detailUserLogin?.user?.username || "Guest"}
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-3 bg-[#0088FF] text-white text-[10px] rounded-[9px] px-2 py-1">
            {roleLabel}
          </div>
        )}

        {!collapsed && (
          <Button
            className="mt-6 mb-6 min-w-[130px] px-4 text-sm bg-[#DDE0E5]! text-[#374151] font-semibold flex items-center justify-center mx-auto"
            icon={<img src={LogoutIcon} alt="logout" />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        )}
      </div>

      {/* 🔹 Menu */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={(e) => navigate(e.key)}
        items={filteredMenuItems}
        className="
          mt-6
          [&_.ant-menu-item]:h-[50px]
          [&_.ant-menu-item]:flex
          [&_.ant-menu-item]:items-center
          [&_.ant-menu-item]:gap-2
          [&_.ant-menu-submenu-title]:h-[50px]
          [&_.ant-menu-title-content]:truncate
        "
        style={{
          borderInlineEnd: 0,
          backgroundColor: "transparent",
        }}
      />

      {/* 🔹 Drag Handle */}
      {!collapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-gray-300 hover:bg-blue-500"
        />
      )}
    </div>
  );
}