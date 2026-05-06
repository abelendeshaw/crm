import type { Metadata } from "next";

import { CRMLayout } from "@/components/layout/CRMLayout";
import { InvitationAcceptance } from "@/modules/InvitationAcceptance";

export const metadata: Metadata = {
  title: "You're invited to Selamnew CRM",
  description:
    "Review your invitation to join Selamnew CRM as Sales and accept or decline.",
  openGraph: {
    title: "You're invited to Selamnew CRM",
    description:
      "Review your invitation to join Selamnew CRM as Sales and accept or decline.",
  },
};

export default function InvitePage() {
  return (
    <CRMLayout>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <InvitationAcceptance />
      </div>
    </CRMLayout>
  );
}
