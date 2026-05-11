import { CRMLayout } from "@/components/layout/CRMLayout";
import { LeadDetailPage } from "@/modules/LeadDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <CRMLayout>
      <LeadDetailPage id={id} />
    </CRMLayout>
  );
}
