import { CRMLayout } from "@/components/layout/CRMLayout";
import { CustomerManagementPage } from "@/modules/CustomerManagementPage";

export default function Page() {
  return (
    <CRMLayout>
      <CustomerManagementPage lockedTab="contacts" />
    </CRMLayout>
  );
}
