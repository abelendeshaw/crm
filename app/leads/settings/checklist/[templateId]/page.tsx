import { CRMLayout } from "@/components/layout/CRMLayout";
import { OpportunityChecklistTemplateEditorPage } from "@/modules/OpportunityChecklistTemplateEditorPage";

export default async function Page({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  return (
    <CRMLayout>
      <OpportunityChecklistTemplateEditorPage templateId={templateId} />
    </CRMLayout>
  );
}
