import CompanyForm from "@/components/common/companyForm";
import { useCompanyStore } from "@/stores/companyStore";
import type { CompanyFormValue } from "@/stores/companyStore";

export default function CompanyCreateForm() {
  const { createCompany, loading } = useCompanyStore();

  const handleCreate = async (values: CompanyFormValue) => {
    return await createCompany(values);
  };

  return (
    <CompanyForm
      mode="add"
      onSubmit={handleCreate}
      onCancel={() => history.back()}
      loading={loading}
    />
  );
}