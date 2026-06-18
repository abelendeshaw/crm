import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton({
  withAction = false,
}: {
  withAction?: boolean;
}) {
  return (
    <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-6 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        {withAction ? <Skeleton className="h-9 w-24 shrink-0" /> : null}
      </div>
    </div>
  );
}

export function PipelinePageSkeleton({ withKpi = false }: { withKpi?: boolean }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeaderSkeleton withAction />
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        <div className="flex-shrink-0 space-y-4 border-b bg-white px-6 py-4">
          {withKpi ? <Skeleton className="h-20 w-full rounded-lg" /> : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-full max-w-[320px]" />
              <Skeleton className="h-9 w-[130px]" />
              <Skeleton className="h-9 w-[130px]" />
              <Skeleton className="h-9 w-[130px]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-[120px]" />
              <Skeleton className="h-9 w-[100px]" />
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-4 pt-4 pb-4">
          <div className="flex h-full min-w-max gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex h-full w-[280px] shrink-0 flex-col rounded-lg border border-[#e5e7eb] bg-[#f9fafb]">
                <div className="border-b border-[#e5e7eb] px-3 py-2.5 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex-1 space-y-2 p-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-[120px] w-full rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="min-h-full bg-[#f5f6fa] p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-[320px] rounded-xl lg:col-span-2" />
          <Skeleton className="h-[320px] rounded-xl" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[280px] rounded-xl" />
          <Skeleton className="h-[280px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fb]">
      <div className="border-b border-[#e5e7eb] bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-28" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        <div className="w-full max-w-[320px] space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          <Skeleton className="h-[420px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function TabbedSettingsPageSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-3 flex-shrink-0">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-28 shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28" />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden p-4 sm:p-5">
        <div className="grid h-full gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Skeleton className="h-full min-h-[360px] rounded-lg" />
          <Skeleton className="h-full min-h-[360px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SettingsLayoutPageSkeleton() {
  return (
    <div className="min-h-full bg-muted/30 p-6">
      <div className="mx-auto flex max-w-6xl gap-6">
        <div className="w-72 shrink-0 rounded-xl border bg-white p-6 space-y-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
        <div className="flex-1 rounded-xl border bg-white p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function TablePageSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeaderSkeleton withAction />
      <div className="flex-1 overflow-hidden p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#e5e7eb] px-4 py-3">
            <div className="flex gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-[#f3f4f6] px-4 py-3 last:border-b-0">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TabbedModulePageSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-[#e5e7eb] bg-white px-6 py-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="mt-4 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-36" />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#f5f6fa] p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function WizardPageSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#f8f9fb]">
      <div className="border-b border-[#e5e7eb] bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-56" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1 p-6 space-y-4">
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
        <div className="flex justify-between">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}

export function SimplePageSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeaderSkeleton />
      <div className="flex-1 p-6">
        <Skeleton className="h-full min-h-[320px] w-full rounded-xl" />
      </div>
    </div>
  );
}

export function LoginPageSkeleton() {
  return (
    <div className="flex min-h-full items-center justify-center bg-[#f5f6fa] p-6">
      <div className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-8 space-y-4">
        <Skeleton className="mx-auto h-12 w-12 rounded-xl" />
        <Skeleton className="mx-auto h-6 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
