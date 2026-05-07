import type { Metadata } from "next";

import { CRMLayout } from "@/components/layout/CRMLayout";
import { InvitationAboutContent } from "@/modules/InvitationAboutContent";

export const metadata: Metadata = {
  title: "About your invitation · Selamnew CRM",
  description:
    "Learn what CRM invitations mean and how to contact your inviter with questions.",
};

export default function InvitationAboutPage() {
  return (
    <CRMLayout>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <InvitationAboutContent />
      </div>
    </CRMLayout>
  );
}
