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

  const pathSnippets = location.pathname.split("/").filter(Boolean);
  const filteredPathSnippets = pathSnippets.filter((part) => isNaN(Number(part)));

  const items =
    filteredPathSnippets.length === 0
      ? [
          {
            title: <Link to="/dashboard">{t("page_dashboard")}</Link>,
          },
        ]
      : filteredPathSnippets.map((_, index) => {
          const url = "/" + filteredPathSnippets.slice(0, index + 1).join("/");

          return {
            title: <Link to={url}>{t(breadcrumbNameMap[url] || url)}</Link>,
          };
        });

  const currentPath =
    filteredPathSnippets.length > 0
      ? "/" + filteredPathSnippets.join("/")
      : "/dashboard";

  const title = t(breadcrumbNameMap[currentPath] || "page_dashboard");

  return (
    <div className="flex flex-col mb-6">
      <div className="flex justify-between items-center">
        <Breadcrumb items={items} className="text-[16px] text-[#8E8E93]" />

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

      <h1 className="text-[24px] font-semibold text-[#333D4B] mt-2">
        {title}
      </h1>
    </div>
  );
}