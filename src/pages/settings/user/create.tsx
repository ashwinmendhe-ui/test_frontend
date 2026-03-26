import UserForm, { type UserFormValue } from "@/components/common/userForm";
import { useUserStore } from "@/stores/userStore";

export default function UserCreateForm() {
  const { createUser, loading } = useUserStore();

  const handleCreate = async (values: UserFormValue) => {
    return await createUser(values);
  };

  return (
    <UserForm
      mode="add"
      onSubmit={handleCreate}
      onCancel={() => history.back()}
      loading={loading}
    />
  );
}