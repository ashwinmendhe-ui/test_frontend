import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import { breadcrumbNameMap } from "../../constants/breadcrumbMap";

export default function Header() {
  const location = useLocation();

  // Split path → ["settings", "user"]
  const pathSnippets = location.pathname.split("/").filter(Boolean);

  // Build breadcrumb
  const items = pathSnippets.map((_, index) => {
    const url = "/" + pathSnippets.slice(0, index + 1).join("/");

    return {
      title: (
        <Link to={url}>
          {breadcrumbNameMap[url] || url}
        </Link>
      ),
    };
  });

  // Page title
  const currentPath = "/" + pathSnippets.join("/");
  const title = breadcrumbNameMap[currentPath] || "Dashboard";

  return (
    <div className="flex flex-col mb-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={items}
        className="text-[16px] text-[#8E8E93]"
      />

      {/* Title */}
      <h1 className="text-[24px] font-semibold text-[#333D4B] mt-2">
        {title}
      </h1>
    </div>
  );
}