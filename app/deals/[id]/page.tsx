import { CRMLayout } from "@/components/layout/CRMLayout";
import { DealDetailPage } from "@/modules/DealDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <CRMLayout>
      <DealDetailPage id={id} />
    </CRMLayout>
  );
}
