"use client";

import { invitations } from "@/data/userManagementData";

export function InvitationsTab() {
  return (
    <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e5e7eb]">
        <h3 className="font-semibold text-[#1c1e21]">Invitations & Onboarding</h3>
        <p className="text-xs text-[#9ca3af] mt-1">
          Invitations capture product access, role assignment, and approval responsibility.
        </p>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Invitee</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Products</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Roles</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Approvals</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((invite) => (
              <tr key={invite.id} className="border-b border-[#f0f2f7] last:border-0">
                <td className="px-5 py-3">
                  <p className="font-medium text-[#1c1e21]">{invite.fullName}</p>
                  <p className="text-xs text-[#9ca3af]">{invite.email}</p>
                </td>
                <td className="px-4 py-3 text-[#4b5563]">{invite.assignedProducts.join(", ")}</td>
                <td className="px-4 py-3 text-[#4b5563]">
                  {invite.assignedRoles.map((role) => `${role.product}: ${role.role}`).join(", ")}
                </td>
                <td className="px-4 py-3 text-[#4b5563]">{invite.approvalResponsibilities.join(", ")}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      invite.status === "Accepted"
                        ? "bg-[#e6f7ee] text-[#1a8a4a] border border-[#a3d9b8]"
                        : invite.status === "Pending"
                          ? "bg-[#fff8e6] text-[#b07d00] border border-[#fcd34d]"
                          : "bg-[#f5f5f5] text-[#6b7280] border border-[#d1d5db]"
                    }`}
                  >
                    {invite.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
