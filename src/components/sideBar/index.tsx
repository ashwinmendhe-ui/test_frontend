import { Menu, Avatar, Button, Popover } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  LeftOutlined,
  RightOutlined,
  DownOutlined,
} from "@ant-design/icons";
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

type SidebarProps = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  width: number;
  setWidth: (w: number) => void;
};

export default function Sidebar({
  collapsed,
  setCollapsed,
  width,
  setWidth,
}: SidebarProps) {
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

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);

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

  const profileContent = (
    <div className="w-[220px]">
      <div className="flex items-center gap-3 pb-3 border-b border-[#EDF1F5]">
        <Avatar size={36} icon={<UserOutlined />} />

        <div className="min-w-0">
          <div className="font-bold text-[#263548] text-sm truncate">
            {detailUserLogin?.user?.username || t("common_guest")}
          </div>

          <div className="text-[11px] text-[#8C97A4] mt-1">
            {roleLabel}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center justify-between px-2 py-2 text-xs">
          <span className="font-medium text-[#465468]">
            {t("common_role")}
          </span>

          <span className="text-[#8792A1] ml-4 text-right">
            {roleLabel}
          </span>
        </div>

        <div className="border-t border-[#EDF1F5] mt-1 pt-1">
          <Button
            type="text"
            danger
            onClick={handleLogout}
            className="w-full flex! items-center! justify-start! px-2!"
            icon={<img src={LogoutIcon} alt="logout" />}
          >
            {t("button_logout")}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <aside
      style={{
        width: collapsed ? 64 : width,
        flexBasis: collapsed ? 64 : width,
      }}
      className="
        bg-white
        border-r
        border-[#E5E7EB]
        h-screen
        shrink-0
        relative
        transition-[width,flex-basis]
        duration-300
        overflow-visible
        z-20
      "
    >
      <div className="h-full flex flex-col px-2 py-3">
        {/* Profile + collapse button */}
        <div
          className={`
            flex
            items-center
            gap-2
            pb-3
            border-b
            border-[#DDE0E5]

            ${
              collapsed
                ? "flex-col justify-center"
                : "justify-between"
            }
          `}
        >
          <Popover
            content={profileContent}
            trigger="click"
            placement={collapsed ? "rightTop" : "bottomLeft"}
            arrow={false}
          >
            <button
              type="button"
              className={`
                border-0
                bg-transparent
                hover:bg-[#F5F8FB]
                rounded-lg
                transition-colors
                min-w-0

                ${
                  collapsed
                    ? "w-[42px] h-[42px] flex items-center justify-center"
                    : "flex-1 h-[48px] px-2 flex items-center gap-2 text-left"
                }
              `}
            >
              <Avatar
                size={collapsed ? 32 : 34}
                icon={<UserOutlined />}
                className="shrink-0"
              />

              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#333D4B] text-sm truncate">
                      {detailUserLogin?.user?.username || t("common_guest")}
                    </div>

                    <div className="text-[10px] text-[#8C97A4] mt-[2px] truncate">
                      {roleLabel}
                    </div>
                  </div>

                  <DownOutlined className="text-[10px] text-[#9AA4B2]" />
                </>
              )}
            </button>
          </Popover>

          <Button
            type="default"
            aria-label={
              collapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={
              collapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            onClick={() => setCollapsed(!collapsed)}
            className={`
              shrink-0
              flex!
              items-center!
              justify-center!
              p-0!
              rounded-lg!

              ${
                collapsed
                  ? "w-[42px]! h-[34px]!"
                  : "w-[36px]! h-[36px]!"
              }
            `}
            icon={
              collapsed ? (
                <RightOutlined className="text-xs" />
              ) : (
                <LeftOutlined className="text-xs" />
              )
            }
          />
        </div>

        {/* Navigation */}
        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[location.pathname]}
          onClick={(e) => navigate(e.key)}
          items={translatedMenuItems}
          className={`
            mt-3
            flex-1

            [&_.ant-menu-item]:h-[46px]
            [&_.ant-menu-item]:flex
            [&_.ant-menu-item]:items-center
            [&_.ant-menu-item]:gap-2
            [&_.ant-menu-item]:px-3
            [&_.ant-menu-item]:rounded-[8px]
            [&_.ant-menu-item]:text-[#4B5563]
            [&_.ant-menu-item]:font-medium
            [&_.ant-menu-item]:transition-all
            [&_.ant-menu-item]:duration-200

            [&_.ant-menu-submenu-title]:h-[46px]
            [&_.ant-menu-submenu-title]:flex
            [&_.ant-menu-submenu-title]:items-center
            [&_.ant-menu-submenu-title]:px-3
            [&_.ant-menu-submenu-title]:rounded-[8px]
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

                    [&_.ant-menu-item]:w-[44px]
                    [&_.ant-menu-submenu-title]:w-[44px]
                  `
                : ""
            }
          `}
          style={{
            borderInlineEnd: 0,
            backgroundColor: "transparent",
          }}
        />

        {/* Resize handle - expanded only */}
        {!collapsed && (
          <div
            onMouseDown={handleMouseDown}
            className="
              absolute
              top-0
              right-0
              w-1
              h-full
              cursor-col-resize
              hover:bg-blue-400
              transition-colors
            "
          />
        )}
      </div>
    </aside>
  );
}