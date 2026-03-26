import RobotForm from "@/components/common/robotForm";
import { useRobotStore } from "@/stores/robotStore";
import type { DetailDevice } from "@/stores/robotStore";

export default function RobotCreateForm() {
  const { createRobot, loading } = useRobotStore();

  const handleCreate = async (values: DetailDevice) => {
    return await createRobot(values);
  };

  return (
    <RobotForm
      mode="add"
      onSubmit={handleCreate}
      onCancel={() => history.back()}
      loading={loading}
    />
  );
}