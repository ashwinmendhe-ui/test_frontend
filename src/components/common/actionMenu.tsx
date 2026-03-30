import DeleteIcon from "@/assets/delete-icon.svg";
import DownloadIcon from "@/assets/download-icon.svg";
import EditIcon from "@/assets/edit-icon.svg";
import { useTranslation } from "react-i18next";

interface ActionMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  isShowEdit?: boolean;
  isShowDownload?: boolean;
  isShowDelete?: boolean;
  editLabel?: string;
}

export default function ActionMenu({
  onEdit,
  onDelete,
  onDownload,
  isShowEdit = true,
  isShowDownload = false,
  isShowDelete = true,
  editLabel,
}: ActionMenuProps) {
  const { t } = useTranslation();

  return (
    <div className="absolute top-0 right-8 bg-white rounded-xl shadow-[4px_4px_4px_0px_#0000000D] overflow-hidden w-[140px]">
      {isShowEdit && (
        <button
          onClick={onEdit}
          className="w-full h-11 flex items-center gap-3 px-5 py-4 hover:border-transparent!"
        >
          <img src={EditIcon} alt="Edit icon" />
          <span className="text-xs font-semibold text-[#374151]">
            {editLabel || t("table_edit")}
          </span>
        </button>
      )}

      {isShowDownload && (
        <>
          <div className="h-px bg-[#E5E7EB]" />
          <button
            onClick={onDownload}
            className="w-full h-11 flex items-center gap-3 px-5 py-4 hover:border-transparent!"
          >
            <img src={DownloadIcon} alt="Download icon" />
            <span className="text-xs font-semibold text-[#374151]">
              {t("table_download")}
            </span>
          </button>
        </>
      )}

      {isShowDelete && (
        <>
          <div className="h-px bg-[#E5E7EB]" />
          <button
            onClick={onDelete}
            className="w-full h-11 flex items-center gap-3 px-5 py-4 hover:border-transparent!"
          >
            <img src={DeleteIcon} alt="Delete icon" />
            <span className="text-xs font-semibold text-[#374151]">
              {t("table_delete")}
            </span>
          </button>
        </>
      )}
    </div>
  );
}