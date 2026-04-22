import { LayoutDashboard, TrendingUp, Users, Handshake, Target } from "lucide-react";

const stats = [
  { label: "Total Leads", value: "1,284", change: "+12%", color: "text-[#4080f0]", bg: "bg-[#eef2fd]", icon: <Target size={18} /> },
  { label: "Active Deals", value: "342", change: "+8%", color: "text-[#1a8a4a]", bg: "bg-[#e6f7ee]", icon: <Handshake size={18} /> },
  { label: "Total Users", value: "10", change: "+2", color: "text-[#b07d00]", bg: "bg-[#fff8e6]", icon: <Users size={18} /> },
  { label: "Conversion Rate", value: "24.5%", change: "+3.1%", color: "text-[#9333ea]", bg: "bg-[#fdf4ff]", icon: <TrendingUp size={18} /> },
];

export function DashboardPage() {
  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="bg-white border-b border-[#e5e7eb] px-4 py-4 sm:px-6">
        <h1 className="font-semibold text-[#1c1e21]">Dashboard</h1>
        <p className="text-sm text-[#9ca3af] mt-0.5">Welcome back, Nahom</p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-[#e5e7eb] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`${s.bg} rounded-lg p-2 ${s.color}`}>{s.icon}</div>
                <span className="text-xs text-[#1a8a4a] bg-[#e6f7ee] px-2 py-0.5 rounded-full font-medium">{s.change}</span>
              </div>
              <p className={`font-bold text-2xl ${s.color}`}>{s.value}</p>
              <p className="text-sm text-[#9ca3af] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg border border-[#e5e7eb] p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#eef2fd] flex items-center justify-center mx-auto mb-4">
              <LayoutDashboard size={28} className="text-[#4080f0]" />
            </div>
            <h3 className="font-medium text-[#1c1e21] mb-1">Dashboard Charts</h3>
            <p className="text-sm text-[#9ca3af]">Sales pipeline, activity overview & more coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


