import { Menu, Avatar, Button } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";
import { menuItems } from "../../constants/menu"; 
import LogoutIcon from "../../assets/logout-icon.svg"; 
import { useUserStore } from "../../stores/userStore";


export default function Sidebar({
  collapsed,
  width,
  setWidth,
}: {
  collapsed: boolean;
  width: number;
  setWidth: (w: number) => void;
}) {
  const user = useUserStore((state) => state.user);
    const clearUser = useUserStore((state) => state.clearUser);
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
              {user?.username || "Guest"}
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="mt-3 bg-[#0088FF] text-white text-[10px] rounded-[9px] px-2 py-1">
            {user?.role || "No role"}
          </div>
        )}

        {!collapsed && (
          <Button
            className="mt-6 mb-6 min-w-[130px] px-4 text-sm bg-[#DDE0E5]! text-[#374151] font-semibold flex items-center justify-center mx-auto"
            icon={<img src={LogoutIcon} alt="logout" />}
            onClick={() => {
              localStorage.removeItem("token");
              clearUser();
              navigate("/login");
            }}
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
        items={menuItems} // ✅ USING CONSTANT
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