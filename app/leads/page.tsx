import { CRMLayout } from "@/components/layout/CRMLayout";
import { LeadsManagementPage } from "@/modules/LeadsManagementPage";

export default function Page() {
  return (
    <CRMLayout>
      <LeadsManagementPage />
    </CRMLayout>
  );
}
