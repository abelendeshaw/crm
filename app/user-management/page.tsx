import { CRMLayout } from "@/components/layout/CRMLayout";
import { UserManagementPage } from "@/modules/UserManagementPage";

export default function Page() {
  return (
    <CRMLayout>
      <UserManagementPage />
    </CRMLayout>
  );
}
