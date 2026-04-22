"use client";

import { Building2, Layers, MapPin, PackageCheck, User } from "lucide-react";
import {
  organizationProfile,
  productSubscriptions,
  users,
} from "@/data/userManagementData";

export function OrganizationTab() {
  const owner = users.find((user) => user.id === organizationProfile.ownerUserId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Organization" value={organizationProfile.name} icon={<Building2 size={16} />} />
        <StatCard label="Branches" value={String(organizationProfile.branchesCount)} icon={<MapPin size={16} />} />
        <StatCard label="Departments" value={String(organizationProfile.departmentsCount)} icon={<Layers size={16} />} />
        <StatCard
          label="Subscribed Products"
          value={String(productSubscriptions.filter((p) => p.status === "Subscribed").length)}
          icon={<PackageCheck size={16} />}
        />
      </div>

      <div className="bg-white rounded-lg border border-[#e5e7eb] p-5">
        <h3 className="font-semibold text-[#1c1e21] mb-3">Organization Owner</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#eef2fd] flex items-center justify-center">
            <User size={18} className="text-[#4080f0]" />
          </div>
          <div>
            <p className="font-medium text-[#1c1e21]">{owner?.name ?? "Unknown Owner"}</p>
            <p className="text-xs text-[#9ca3af]">
              First registered user and default organization owner
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e5e7eb] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e7eb]">
          <h3 className="font-semibold text-[#1c1e21]">Product Subscriptions</h3>
          <p className="text-xs text-[#9ca3af] mt-1">
            Organization-level subscriptions reused across products.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Product</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#6b7280] uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody>
            {productSubscriptions.map((subscription) => (
              <tr key={subscription.product} className="border-b border-[#f0f2f7] last:border-0">
                <td className="px-5 py-3 font-medium text-[#1c1e21]">{subscription.product}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      subscription.status === "Subscribed"
                        ? "bg-[#e6f7ee] text-[#1a8a4a] border border-[#a3d9b8]"
                        : "bg-[#f5f5f5] text-[#6b7280] border border-[#d1d5db]"
                    }`}
                  >
                    {subscription.status}
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

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-[#e5e7eb] px-4 py-3 flex items-center gap-3">
      <div className="bg-[#eef2fd] rounded-md p-2 text-[#4080f0]">{icon}</div>
      <div>
        <p className="text-xs text-[#6b7280]">{label}</p>
        <p className="font-semibold text-[#1c1e21]">{value}</p>
      </div>
    </div>
  );
}
