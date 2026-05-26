import { CRMLayout } from "@/components/layout/CRMLayout";
import { OpportunityChecklistTemplateEditorPage } from "@/modules/OpportunityChecklistTemplateEditorPage";

export default function Page() {
  return (
    <CRMLayout>
      <OpportunityChecklistTemplateEditorPage templateId="new" />
    </CRMLayout>
  );
}
