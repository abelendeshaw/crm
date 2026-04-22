"use client";

import { approvalRequests, approvalWorkflows } from "@/data/userManagementData";

export function ApprovalsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e7eb]">
          <h3 className="font-semibold text-[#1c1e21]">Approval Workflows</h3>
          <p className="text-xs text-[#9ca3af] mt-1">
            Reusable approval configurations at organization and product level.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Workflow</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Mode</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Assignee Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Reusable</th>
            </tr>
          </thead>
          <tbody>
            {approvalWorkflows.map((workflow) => (
              <tr key={workflow.id} className="border-b border-[#f0f2f7] last:border-0">
                <td className="px-5 py-3">
                  <p className="font-medium text-[#1c1e21]">{workflow.name}</p>
                  <p className="text-xs text-[#9ca3af]">
                    {workflow.scope}
                    {workflow.product ? ` · ${workflow.product}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3 text-[#4b5563]">{workflow.mode}</td>
                <td className="px-4 py-3 text-[#4b5563]">{workflow.assigneeType}</td>
                <td className="px-4 py-3 text-[#4b5563]">
                  {workflow.isReusableAcrossProducts ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e7eb]">
          <h3 className="font-semibold text-[#1c1e21]">Approval Requests</h3>
          <p className="text-xs text-[#9ca3af] mt-1">
            Unified approval statuses used across products.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Requester</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Approver</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {approvalRequests.map((request) => (
              <tr key={request.id} className="border-b border-[#f0f2f7] last:border-0">
                <td className="px-5 py-3 text-[#1c1e21]">{request.subject}</td>
                <td className="px-4 py-3 text-[#4b5563]">{request.requester}</td>
                <td className="px-4 py-3 text-[#4b5563]">{request.currentApprover}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      request.status === "Approved"
                        ? "bg-[#e6f7ee] text-[#1a8a4a] border border-[#a3d9b8]"
                        : request.status === "Pending"
                          ? "bg-[#fff8e6] text-[#b07d00] border border-[#fcd34d]"
                          : "bg-[#fef2f2] text-[#dc2626] border border-[#fca5a5]"
                    }`}
                  >
                    {request.status}
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
