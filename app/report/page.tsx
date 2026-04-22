import { BarChart2 } from "lucide-react";
import { CRMLayout } from "@/components/layout/CRMLayout";
import { PlaceholderPage } from "@/modules/PlaceholderPage";

export default function Page() {
  return (
    <CRMLayout>
      <PlaceholderPage title="Reports" icon={<BarChart2 size={28} />} />
    </CRMLayout>
  );
}
