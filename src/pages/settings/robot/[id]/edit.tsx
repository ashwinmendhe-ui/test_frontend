import RobotForm from "@/components/common/robotForm";
import { useRobotStore } from "@/stores/robotStore";
import type { DetailDevice } from "@/stores/robotStore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function RobotEditForm() {
  const { id } = useParams<{ id: string }>();
  const { detail, getDetail, updateRobot, loading } = useRobotStore();
  const [initialValues, setInitialValues] = useState<DetailDevice>(detail);

  const handleUpdate = async (values: DetailDevice) => {
    if (!id) return;
    return await updateRobot(id, values);
  };

  useEffect(() => {
    if (id) {
      getDetail(id);
    }
  }, [id, getDetail]);

  useEffect(() => {
    if (detail) {
      setInitialValues(detail);
    }
  }, [detail]);

  return (
    <RobotForm
      mode="edit"
      initialValues={initialValues}
      onSubmit={handleUpdate}
      onCancel={() => history.back()}
      loading={loading}
    />
  );
}