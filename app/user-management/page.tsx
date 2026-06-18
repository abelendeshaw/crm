import { Suspense } from "react";

import { CRMLayout } from "@/components/layout/CRMLayout";
import { TabbedModulePageSkeleton } from "@/components/loading/skeleton-screens";
import { UserManagementPage } from "@/modules/UserManagementPage";

export default function Page() {
  return (
    <CRMLayout>
      <Suspense fallback={<TabbedModulePageSkeleton />}>
        <UserManagementPage />
      </Suspense>
    </CRMLayout>
  );
}
