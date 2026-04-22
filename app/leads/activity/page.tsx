import { Activity } from "lucide-react";
import { CRMLayout } from "@/components/layout/CRMLayout";
import { PlaceholderPage } from "@/modules/PlaceholderPage";

export default function Page() {
  return (
    <CRMLayout>
      <PlaceholderPage title="Lead Activity" icon={<Activity size={28} />} />
    </CRMLayout>
  );
}
