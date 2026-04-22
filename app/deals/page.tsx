import { Handshake } from "lucide-react";
import { CRMLayout } from "@/components/layout/CRMLayout";
import { PlaceholderPage } from "@/modules/PlaceholderPage";

export default function Page() {
  return (
    <CRMLayout>
      <PlaceholderPage title="Deals" icon={<Handshake size={28} />} />
    </CRMLayout>
  );
}
