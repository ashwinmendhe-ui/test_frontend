import MissionForm from "@/components/common/missionForm";
import { useMissionStore } from "@/stores/missionStore";
import type { MissionFormValue } from "@/stores/missionStore";

export default function MissionCreateForm() {
  const { createMission, loading } = useMissionStore();

  const handleCreate = async (values: MissionFormValue) => {
    return await createMission(values);
  };

  return (
    <MissionForm
      mode="add"
      onSubmit={handleCreate}
      onCancel={() => history.back()}
      loading={loading}
    />
  );
}