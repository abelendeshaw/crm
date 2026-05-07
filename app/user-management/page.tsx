import { Suspense } from "react";

import { CRMLayout } from "@/components/layout/CRMLayout";
import { UserManagementPage } from "@/modules/UserManagementPage";

function UserManagementFallback() {
  return (
    <div className="flex flex-1 min-h-[200px] items-center justify-center bg-[#f5f6fa] text-sm text-[#6b7280]">
      Loading User Management…
    </div>
  );
}

export default function Page() {
  return (
    <CRMLayout>
      <Suspense fallback={<UserManagementFallback />}>
        <UserManagementPage />
      </Suspense>
    </CRMLayout>
  );
}
