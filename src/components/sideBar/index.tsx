import { Menu, Avatar, Button } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";
import { menuItems } from "../../constants/menu";
import LogoutIcon from "../../assets/logout-icon.svg";
import { useAuthStore } from "../../stores/authStore";
import { useEffect, useMemo } from "react";
import { useUserStore } from "@/stores/userStore";
import { useTranslation } from "react-i18next";

type MenuItem = {
  key: string;
  icon?: React.ReactNode;
  label?: React.ReactNode;
  labelKey?: string;
  children?: MenuItem[];
};

export default function Sidebar({
  collapsed,
  width,
  setWidth,
}: {
  collapsed: boolean;
  width: number;
  setWidth: (w: number) => void;
}) {
  const { t } = useTranslation();
  const { detailUserLogin, getDetailUserLogin } = useUserStore();
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();
  const navigate = useNavigate();

  const userRole = detailUserLogin?.roles?.[0];

  const filterMenuByRole = (items: typeof menuItems, role?: number) => {
    if (role === 1) return items;

    if (role === 2) {
      return items
        .map((item) => {
          if (item.key === "/settings" && item.children) {
            return {
              ...item,
              children: item.children.filter(
                (child) => child.key !== "/settings/company"
              ),
            };
          }
          return item;
        })
        .filter((item) => {
          if (item.key === "/settings" && item.children) {
            return item.children.length > 0;
          }
          return true;
        });
    }

    if (role === 3) {
      return items
        .map((item) => {
          if (item.key === "/settings" && item.children) {
            return {
              ...item,
              children: item.children.filter((child) =>
                ["/settings/mission", "/settings/robot"].includes(child.key)
              ),
            };
          }
          return item;
        })
        .filter((item) => {
          if (item.key !== "/settings") return true;
          return !!item.children && item.children.length > 0;
        });
    }

    return items;
  };

  const translateMenu = (items: MenuItem[]): MenuItem[] =>
    items.map(({ labelKey, children, ...rest }) => ({
      ...rest,
      label: labelKey ? t(labelKey) : rest.label,
      children: children ? translateMenu(children) : undefined,
    }));

  const filteredMenuItems = useMemo(
    () => filterMenuByRole(menuItems, userRole),
    [userRole]
  );

  const translatedMenuItems = useMemo(
    () => translateMenu(filteredMenuItems as MenuItem[]),
    [filteredMenuItems, t]
  );

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
      ? t("role_system_administrator")
      : currentRole === 2
      ? t("role_company_admin")
      : currentRole === 3
      ? t("role_company_user")
      : t("role_none");

  return (
    <div
      style={{ width: collapsed ? 100 : width }}
      className="bg-white border-r border-[#E5E7EB] min-h-screen px-[8px] py-[24px] relative transition-all duration-300"
    >
      <div className="flex flex-col items-center border-b border-[#DDE0E5] pb-4 gap-2">
        <div className="flex items-center">
          <Avatar shape="square" size={42} icon={<UserOutlined />} />
          {!collapsed && (
            <div className="ml-3 font-bold text-[#757575] text-base">
              {detailUserLogin?.user?.username || t("common_guest")}
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="flex items-center justify-center mt-2">
            <span className="bg-[#0088FF] text-white text-[10px] rounded-[9px] px-2 py-2">
              {t("common_role")}
            </span>
            <span className="font-semibold text-[#333D4B] text-xs ml-4">
              {roleLabel}
            </span>
          </div>
        )}

        {!collapsed && (
          <Button
            className="mt-3 mb-3 min-w-[130px] px-4 text-sm bg-[#DDE0E5]! text-[#374151] font-semibold flex items-center justify-center mx-auto"
            icon={<img src={LogoutIcon} alt="logout" />}
            onClick={handleLogout}
          >
            {t("button_logout")}
          </Button>
        )}
      </div>

      <Menu
  mode="inline"
  inlineCollapsed={collapsed}
  selectedKeys={[location.pathname]}
  onClick={(e) => navigate(e.key)}
  items={translatedMenuItems}
  className={`
    mt-6
    [&_.ant-menu-item]:h-[50px]
    [&_.ant-menu-item]:flex
    [&_.ant-menu-item]:items-center
    [&_.ant-menu-item]:gap-2
    [&_.ant-menu-item]:px-3
    [&_.ant-menu-item]:rounded-[10px]
    [&_.ant-menu-item]:text-[#4B5563]
    [&_.ant-menu-item]:font-medium
    [&_.ant-menu-item]:transition-all
    [&_.ant-menu-item]:duration-200

    [&_.ant-menu-submenu-title]:h-[50px]
    [&_.ant-menu-submenu-title]:flex
    [&_.ant-menu-submenu-title]:items-center
    [&_.ant-menu-submenu-title]:px-3
    [&_.ant-menu-submenu-title]:rounded-[10px]
    [&_.ant-menu-submenu-title]:text-[#4B5563]
    [&_.ant-menu-submenu-title]:font-medium
    [&_.ant-menu-submenu-title]:transition-all
    [&_.ant-menu-submenu-title]:duration-200

    [&_.ant-menu-title-content]:truncate

    [&_.ant-menu-item-icon]:min-w-[24px]
    [&_.ant-menu-item-icon]:flex
    [&_.ant-menu-item-icon]:items-center
    [&_.ant-menu-item-icon]:justify-center

    [&_.ant-menu-item:hover]:bg-[#F3F7FF]
    [&_.ant-menu-submenu-title:hover]:bg-[#F3F7FF]

    [&_.ant-menu-item-selected]:bg-[#EAF3FF]
    [&_.ant-menu-item-selected]:text-[#1677FF]
    [&_.ant-menu-item-selected]:font-semibold

    [&_.ant-menu-submenu-selected>.ant-menu-submenu-title]:bg-[#EAF3FF]
    [&_.ant-menu-submenu-selected>.ant-menu-submenu-title]:text-[#1677FF]
    [&_.ant-menu-submenu-selected>.ant-menu-submenu-title]:font-semibold

    ${collapsed ? "[&_.ant-menu-submenu-arrow]:hidden" : ""}

    ${
      collapsed
        ? `
          [&_.ant-menu-item]:justify-center
          [&_.ant-menu-submenu-title]:justify-center
          [&_.ant-menu-item]:px-0
          [&_.ant-menu-submenu-title]:px-0
          [&_.ant-menu-item]:mx-auto
          [&_.ant-menu-submenu-title]:mx-auto
          [&_.ant-menu-item]:w-[52px]
          [&_.ant-menu-submenu-title]:w-[52px]
        `
        : ""
    }
  `}
  style={{
    borderInlineEnd: 0,
    backgroundColor: "transparent",
  }}
/>

      {!collapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-gray-300 hover:bg-blue-500"
        />
      )}
    </div>
  );
}