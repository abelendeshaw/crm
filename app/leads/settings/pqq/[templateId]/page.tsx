import { CRMLayout } from "@/components/layout/CRMLayout";
import { PqqFormBuilderPage } from "@/modules/PqqFormBuilderPage";

export default async function Page({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  return (
    <CRMLayout>
      <PqqFormBuilderPage templateId={templateId} />
    </CRMLayout>
  );
}
