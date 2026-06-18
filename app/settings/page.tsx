import { CRMLayout } from "@/components/layout/CRMLayout";
import { SettingsLayoutPageSkeleton } from "@/components/loading/skeleton-screens";
import { SettingsPage } from "@/modules/SettingsPage";
import { Suspense } from "react";

export default function Page() {
  return (
    <CRMLayout>
      <Suspense fallback={<SettingsLayoutPageSkeleton />}>
        <SettingsPage />
      </Suspense>
    </CRMLayout>
  );
}
