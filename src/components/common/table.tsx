import SortDown from "@/assets/sort-down-icon.svg";
import Sort from "@/assets/sort-icon.svg";
import SortUp from "@/assets/sort-up-icon.svg";
import { Table } from "antd";
import type { ColumnsType, ColumnType, TablePaginationConfig } from "antd/es/table";
import { useTranslation } from "react-i18next";

export interface SortableTableColumn<T> {
  title: string;
  dataIndex?: keyof T & string;
  key: string;
  enableSort?: boolean;
  width?: number | string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
}

interface SortableTableProps<T> {
  columns: SortableTableColumn<T>[];
  data: T[];
  rowKey?: string;
  pagination?: false | TablePaginationConfig;
  bordered?: boolean;
}

export function SortableTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey = "id",
  pagination,
  bordered = false,
}: SortableTableProps<T>) {
  const { t } = useTranslation();

  const antColumns: ColumnsType<T> = columns.map((col) => {
    const base: ColumnType<T> = {
      title: col.title,
      key: col.key,
    };

    if (col.width) {
      base.width = col.width;
    }

    if (col.dataIndex) {
      base.dataIndex = col.dataIndex;

      if (col.enableSort) {
        base.sorter = (a: T, b: T) => {
          const valA = a[col.dataIndex!];
          const valB = b[col.dataIndex!];

          return typeof valA === "number" && typeof valB === "number"
            ? valA - valB
            : String(valA ?? "").localeCompare(String(valB ?? ""));
        };

        base.sortDirections = ["ascend", "descend"];
        base.sortIcon = ({ sortOrder }) => {
          if (!sortOrder) {
            return <img src={Sort} alt="sort" className="mr-2" />;
          }

          return sortOrder === "ascend" ? (
            <img src={SortUp} alt="sort up" className="mr-2" />
          ) : (
            <img src={SortDown} alt="sort down" className="mr-2" />
          );
        };
      }
    }

    if (col.render) {
      base.render = col.render;
    }

    return base;
  });

  return (
    <div className="w-full overflow-x-auto">
      <Table
        columns={antColumns}
        dataSource={data}
        rowKey={rowKey}
        pagination={pagination}
        bordered={bordered}
        locale={{ emptyText: t("table_no_data") }}
        scroll={{ x: "max-content" }}
      />
    </div>
  );
}