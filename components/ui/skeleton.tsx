import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#e5e7eb]", className)}
      {...props}
    />
  );
}

export { Skeleton };
