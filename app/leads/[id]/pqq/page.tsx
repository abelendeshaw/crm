import { CRMLayout } from "@/components/layout/CRMLayout";
import { LeadPqqWizardPage } from "@/modules/LeadPqqWizardPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <CRMLayout>
      <LeadPqqWizardPage leadId={id} />
    </CRMLayout>
  );
}
