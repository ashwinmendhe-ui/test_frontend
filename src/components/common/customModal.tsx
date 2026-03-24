import { Button, Modal } from "antd";
import React from "react";

interface CustomModalProps {
  type?: string;
  title: string;
  content: React.ReactNode;
  open: boolean;
  useIcon?: boolean;
  icon?: string;
  okText?: string;
  cancelText?: string;
  onOk: () => void;
  onCancel: () => void;
  customClassName?: string;
}

const CustomModal: React.FC<CustomModalProps> = ({
  type = "delete",
  title,
  content,
  open,
  useIcon,
  icon,
  okText = "OK",
  cancelText = "Cancel",
  onOk,
  onCancel,
  customClassName,
}) => {
  return (
    <Modal
      className={`custom-modal min-w-[522px] ${customClassName || ""}`}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button
          className="border! border-[#DDE0E5]! w-40! h-16! rounded-[13px]! bg-[#F6F7F9]! text-2xl! text-[#333D4B]! font-bold!"
          key="cancel"
          onClick={onCancel}
        >
          {cancelText}
        </Button>,
        <Button
          className={`border! border-[#DDE0E5]! w-40! h-16! rounded-[13px]! ${
            type === "delete" ? "bg-[#FF3B30]" : "bg-primary"
          }! text-2xl! text-white! font-bold!`}
          key="ok"
          type="primary"
          onClick={onOk}
        >
          {okText}
        </Button>,
      ]}
    >
      {useIcon && icon && (
        <div className="flex justify-center">
          <img className="max-w-16" src={icon} alt="Icon" />
        </div>
      )}
      <div className="mt-9 text-2xl font-bold">{title}</div>
      <div className="mt-7">{content}</div>
    </Modal>
  );
};

export default CustomModal;