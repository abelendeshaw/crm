import { CRMLayout } from "@/components/layout/CRMLayout";
import { SettingsPage } from "@/modules/SettingsPage";
import { Suspense } from "react";

export default function Page() {
  return (
    <CRMLayout>
      <Suspense fallback={null}>
        <SettingsPage />
      </Suspense>
    </CRMLayout>
  );
}
