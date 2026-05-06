import { CRMLayout } from "@/components/layout/CRMLayout";
import { SalesTargetDetailPage } from "@/modules/SalesTargetDetailPage";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <CRMLayout>
      <SalesTargetDetailPage id={id} />
    </CRMLayout>
  );
}
