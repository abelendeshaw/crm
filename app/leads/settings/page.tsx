import { Handshake } from "lucide-react";
import { CRMLayout } from "@/components/layout/CRMLayout";
import { PlaceholderPage } from "@/modules/PlaceholderPage";

export default function Page() {
  return (
    <CRMLayout>
      <PlaceholderPage title="Lead Settings" icon={<Handshake size={28} />} />
    </CRMLayout>
  );
}
