import SiteForm from "@/components/common/siteForm";
import { useSiteStore } from "@/stores/siteStore";
import type { SiteFormValue } from "@/stores/siteStore";

export default function SiteCreateForm() {
  const { createSite, loading } = useSiteStore();

  const handleCreate = async (values: SiteFormValue) => {
    return await createSite(values);
  };

  return (
    <SiteForm
      mode="add"
      onSubmit={handleCreate}
      onCancel={() => history.back()}
      loading={loading}
    />
  );
}