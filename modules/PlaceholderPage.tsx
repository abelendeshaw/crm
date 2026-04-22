import { ReactNode } from "react";

export function PlaceholderPage({
  title,
  icon,
}: {
  title: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="bg-white border-b border-[#e5e7eb] px-4 py-4 sm:px-6">
        <h1 className="font-semibold text-[#1c1e21]">{title}</h1>
        <p className="text-sm text-[#9ca3af] mt-0.5">{title} overview</p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#eef2fd] flex items-center justify-center mx-auto mb-4 text-[#4080f0]">
            {icon}
          </div>
          <h3 className="font-medium text-[#1c1e21] mb-1">{title}</h3>
          <p className="text-sm text-[#9ca3af]">{title} module - coming soon.</p>
        </div>
      </div>
    </div>
  );
}
