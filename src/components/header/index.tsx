import { Breadcrumb, Select } from "antd";
import { Link, useLocation } from "react-router-dom";
import { breadcrumbNameMap } from "../../constants/breadcrumbMap";
import { useTranslation } from "react-i18next";

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    localStorage.setItem("lang", value);
  };

  const normalizePath = (pathname: string) => {
  if (pathname.startsWith("/stream/")) return "/stream";

  return pathname
    .replace(/\/settings\/company\/[^/]+\/edit$/, "/settings/company/edit")
    .replace(/\/settings\/user\/[^/]+\/edit$/, "/settings/user/edit")
    .replace(/\/settings\/site\/[^/]+\/edit$/, "/settings/site/edit")
    .replace(/\/settings\/mission\/[^/]+\/edit$/, "/settings/mission/edit")
    .replace(/\/settings\/robot\/[^/]+\/edit$/, "/settings/robot/edit");
};

  const pathSnippets = location.pathname.split("/").filter(Boolean);
  const filteredPathSnippets = pathSnippets.filter(
    (part) => !/^[0-9a-fA-F-]{36}$/.test(part)
  );
  const items =
    filteredPathSnippets.length === 0
      ? [
          {
            title: <Link to="/dashboard">{t("page_dashboard")}</Link>,
          },
        ]
      : filteredPathSnippets.map((_, index) => {
          const rawUrl = "/" + filteredPathSnippets.slice(0, index + 1).join("/");
          const url = normalizePath(rawUrl);

          return {
  title:
    rawUrl === "/settings" ? (
      <span>
        {t(breadcrumbNameMap[url] || breadcrumbNameMap["/dashboard"])}
      </span>
    ) : (
      <Link to={rawUrl}>
        {t(breadcrumbNameMap[url] || breadcrumbNameMap["/dashboard"])}
      </Link>
    ),
};
        });

  const rawCurrentPath =
    filteredPathSnippets.length > 0
      ? "/" + filteredPathSnippets.join("/")
      : "/dashboard";

  const currentPath = normalizePath(rawCurrentPath);
  const title = t(breadcrumbNameMap[currentPath] || "page_dashboard");

  return (
  <div className="flex flex-col mb-1">
    <div className="flex justify-between items-center">
      <Breadcrumb
        items={items}
        className="text-[16px] text-[#8E8E93]"
      />

      <Select
        value={i18n.language}
        onChange={handleLanguageChange}
        style={{ width: 120 }}
        options={[
          { value: "ko", label: "한국어" },
          { value: "en", label: "English" },
        ]}
      />
    </div>

    <h1 className="text-[24px] font-semibold text-[#333D4B] mt-0 leading-tight">
      {title}
    </h1>
  </div>
);
}