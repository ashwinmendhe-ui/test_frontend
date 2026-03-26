import CompanyForm from "@/components/common/companyForm";
import { useCompanyStore } from "@/stores/companyStore";
import type { CompanyFormValue } from "@/stores/companyStore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function CompanyEditForm() {
  const { id } = useParams<{ id: string }>();
  const { detail, getDetail, updateCompany, loading } = useCompanyStore();
  const [initialValues, setInitialValues] = useState<CompanyFormValue>(detail);

  const handleUpdate = async (values: CompanyFormValue) => {
    if (!id) return;
    return await updateCompany(id, values);
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
    <CompanyForm
      mode="edit"
      initialValues={initialValues}
      onSubmit={handleUpdate}
      onCancel={() => history.back()}
      loading={loading}
    />
  );
}