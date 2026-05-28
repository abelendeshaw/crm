import { redirect } from "next/navigation";
import { CRMLayout } from "@/components/layout/CRMLayout";
import { PQQ_UI_ENABLED } from "@/lib/featureFlags";
import { PqqFormBuilderPage } from "@/modules/PqqFormBuilderPage";

export default function Page() {
  if (!PQQ_UI_ENABLED) {
    redirect("/leads/settings");
  }
  return (
    <CRMLayout>
      <PqqFormBuilderPage />
    </CRMLayout>
  );
}
