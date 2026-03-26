import SiteForm from "@/components/common/siteForm";
import { useSiteStore } from "@/stores/siteStore";
import type { SiteFormValue } from "@/stores/siteStore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function SiteEditForm() {
  const { id } = useParams<{ id: string }>();
  const { detail, getDetail, updateSite, loading } = useSiteStore();
  const [initialValues, setInitialValues] = useState<SiteFormValue>(detail);

  const handleUpdate = async (values: SiteFormValue) => {
    if (!id) return;
    return await updateSite(id, values);
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
    <SiteForm
      mode="edit"
      initialValues={initialValues}
      onSubmit={handleUpdate}
      onCancel={() => history.back()}
      loading={loading}
    />
  );
}