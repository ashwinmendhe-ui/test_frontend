import { useEffect } from "react";
/* eslint-disable @typescript-eslint/no-explicit-any */
import FileIcon from "@/assets/file-icon.svg";
import ImportIcon from "@/assets/import-icon.svg";
import ActionIcon from "@/assets/table-action-icon.svg";
import type { UploadFile, UploadProps } from "antd";
import { Dropdown, Upload } from "antd";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";
import ActionMenu from "./actionMenu";

const { Dragger } = Upload;

interface FileUploadProps {
  onFileChange?: (file: File | null, fileName?: string | null) => void;
  value?: string;
  downloadUrl?: string;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}

export interface FileUploadRef {
  uploadToS3: (uploadUrl: string) => Promise<void>;
  hasNewFile: () => boolean;
}

const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(
  (
    {
      onFileChange,
      value,
      downloadUrl,
      accept = ".csv,.xlsx,.xls,.zip,.pdf,.txt,*",
      maxSize = 10,
      disabled = false,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useImperativeHandle(ref, () => ({
      hasNewFile: () => {
        return selectedFile !== null;
      },
      uploadToS3: async (uploadUrl: string) => {
        if (!selectedFile) {
          throw new Error("No file selected");
        }

        setUploading(true);

        try {
          const response = await fetch(uploadUrl, {
            method: "PUT",
            body: selectedFile,
            headers: {
              "Content-Type": selectedFile.type,
            },
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
          }
        } catch (error) {
          console.error("Error uploading to S3:", error);
          throw error;
        } finally {
          setUploading(false);
        }
      },
    }));

    const handleDownload = (file: UploadFile) => {
      if (downloadUrl) {
        window.open(downloadUrl, "_blank");
        return;
      }

      if (file.originFileObj) {
        const url = URL.createObjectURL(file.originFileObj);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    };

    const handleDelete = () => {
      setFileList([]);
      setSelectedFile(null);
      if (onFileChange) {
        onFileChange(null, null);
      }
    };

    const uploadProps: UploadProps = {
      name: "file",
      multiple: false,
      accept,
      disabled,
      fileList,
      showUploadList: false,
      beforeUpload: async (file) => {
        const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
        if (!isLtMaxSize) {
          console.error(`File must be smaller than ${maxSize}MB!`);
          return false;
        }

        setSelectedFile(file as File);

        setFileList([
          {
            uid: file.uid,
            name: file.name,
            status: "done",
            originFileObj: file as any,
          },
        ]);

        if (onFileChange) {
          onFileChange(file as File, file.name);
        }

        return false;
      },
      onRemove: () => {
        setFileList([]);
        setSelectedFile(null);
        if (onFileChange) {
          onFileChange(null, null);
        }
      },
    };

    useEffect(() => {
      if (!value && !downloadUrl && fileList.length > 0) {
        setFileList([]);
        setSelectedFile(null);
      }
    }, [value, downloadUrl, fileList.length]);

    const hasFile = fileList.length > 0 || value || downloadUrl;

    if (hasFile) {
      const displayFile =
        fileList.length > 0
          ? fileList[0]
          : { uid: "existing", name: value || "File", status: "done" as const };

      return (
        <div className="flex items-center justify-between px-12 py-6 bg-[#F6F7F9] rounded-[7px] border border-[#DDE0E5] min-h-[143px]">
          <div className="w-full flex items-center justify-between px-6 py-6 rounded-[7px] border border-[#DDE0E5] bg-white">
            <div className="flex items-center">
              <img src={FileIcon} alt="File icon" />
              <span className="text-[18px]! font-semibold! text-[#333D4B] ml-4">
                {displayFile.name}
              </span>
            </div>
            <Dropdown
              className="relative"
              trigger={["hover"]}
              popupRender={() => (
                <ActionMenu
                  isShowEdit={false}
                  isShowDownload
                  isShowDelete
                  onDownload={() => handleDownload(displayFile)}
                  onDelete={handleDelete}
                />
              )}
            >
              <a onClick={(e) => e.preventDefault()}>
                <img src={ActionIcon} alt="ActionIcon" />
              </a>
            </Dropdown>
          </div>
        </div>
      );
    }

    return (
      <Dragger
        {...uploadProps}
        className="border-[#DDE0E5]! rounded-[7px]! bg-[#F6F7F9]! hover:border-primary!"
        disabled={disabled || uploading}
      >
        <div className="flex flex-row items-center justify-center py-5">
          <p>
            <img className="max-w-[69px]" src={ImportIcon} alt="ImportIcon" />
          </p>
          <div className="flex flex-col items-start justify-center ml-7">
            <p className="ant-upload-text text-[18px]! font-semibold! text-[#757575]! mb-0!">
              {uploading ? "Uploading to S3..." : t("file_upload_title")}
            </p>
            <p className="ant-upload-hint text-[14px]! text-[#9BA2A9]!">
              {t("file_upload_hint")}
            </p>
          </div>
        </div>
      </Dragger>
    );
  }
);

FileUpload.displayName = "FileUpload";

export default FileUpload;