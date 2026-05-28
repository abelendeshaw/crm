import { redirect } from "next/navigation";
import { CRMLayout } from "@/components/layout/CRMLayout";
import { PQQ_UI_ENABLED } from "@/lib/featureFlags";
import { LeadPqqWizardPage } from "@/modules/LeadPqqWizardPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!PQQ_UI_ENABLED) {
    redirect(`/leads/${id}`);
  }
  return (
    <CRMLayout>
      <LeadPqqWizardPage leadId={id} />
    </CRMLayout>
  );
}
