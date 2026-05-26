import { CRMLayout } from "@/components/layout/CRMLayout";
import { OpportunityChecklistPage } from "@/modules/OpportunityChecklistPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <CRMLayout>
      <OpportunityChecklistPage leadId={id} />
    </CRMLayout>
  );
}
