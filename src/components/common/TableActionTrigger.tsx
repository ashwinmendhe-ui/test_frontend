import ActionIcon from "@/assets/table-action-icon.svg";
import { Dropdown } from "antd";
import ActionMenu from "@/components/common/actionMenu";

interface TableActionTriggerProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TableActionTrigger({
  onEdit,
  onDelete,
}: TableActionTriggerProps) {
  return (
    <div className="flex items-center justify-center w-full">
      <Dropdown
        className="relative"
        trigger={["hover"]}
        popupRender={() => (
          <ActionMenu onEdit={onEdit} onDelete={onDelete} />
        )}
      >
        <a
          onClick={(e) => e.preventDefault()}
          className="flex items-center justify-center w-10 h-10"
        >
          <img src={ActionIcon} alt="ActionIcon" className="w-5 h-5" />
        </a>
      </Dropdown>
    </div>
  );
}