import { Users } from "lucide-react";

export function LeadsPage() {
  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="bg-white border-b border-[#e5e7eb] px-4 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-[#1c1e21]">Leads</h1>
          <p className="text-sm text-[#9ca3af] mt-0.5">View Potential Customers</p>
        </div>
        <button className="flex items-center gap-2 bg-[#4080f0] hover:bg-[#3070e0] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
          + Create Lead
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#eef2fd] flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-[#4080f0]" />
          </div>
          <h3 className="font-medium text-[#1c1e21] mb-1">Leads Module</h3>
          <p className="text-sm text-[#9ca3af]">This is a demo placeholder for the Leads section.</p>
        </div>
      </div>
    </div>
  );
}


