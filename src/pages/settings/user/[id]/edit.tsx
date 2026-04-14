import UserForm, {
  type AssignedSiteRow,
  type UserFormValue,
} from "@/components/common/userForm";
import { useUserStore } from "@/stores/userStore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function UserEditForm() {
  const { id } = useParams<{ id: string }>();
  const { detail, getDetail, updateUser, loading } = useUserStore();

  const [initialValues, setInitialValues] = useState<UserFormValue | undefined>(
    undefined
  );

  const handleUpdate = async (values: UserFormValue) => {
    if (!id) return;
    return await updateUser(id, values);
  };

  useEffect(() => {
    if (id) {
      getDetail(id);
    }
  }, [id, getDetail]);

  useEffect(() => {
    if (detail?.user) {
      const user = detail.user as UserFormValue & {
        role?: number | string;
        missionIds?: string[];
        deviceIds?: string[];
        sites?: AssignedSiteRow[];
      };

      setInitialValues({
        ...user,
        role: user.role !== undefined ? Number(user.role) : undefined,
        missionIds: user.missionIds ?? [],
        deviceIds: user.deviceIds ?? [],
        sites: user.sites ?? [],
      });
    }
  }, [detail]);

  return (
    <UserForm
      mode="edit"
      initialValues={initialValues}
      onSubmit={handleUpdate}
      onCancel={() => history.back()}
      loading={loading}
    />
  );
}