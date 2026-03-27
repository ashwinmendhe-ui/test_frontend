import MissionForm from "@/components/common/missionForm";
import { useMissionStore } from "@/stores/missionStore";
import type { MissionFormValue } from "@/stores/missionStore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function MissionEditForm() {
  const { id } = useParams<{ id: string }>();
  const { detail, getDetail, updateMission, loading } = useMissionStore();
  const [initialValues, setInitialValues] = useState<MissionFormValue>(detail);

  const handleUpdate = async (values: MissionFormValue) => {
    if (!id) return;
    return await updateMission(id, values);
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
    <MissionForm
      mode="edit"
      initialValues={initialValues}
      onSubmit={handleUpdate}
      onCancel={() => history.back()}
      loading={loading}
    />
  );
}