"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Mail,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { invitation } from "@/lib/mock-invitation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function isExpired(date: Date) {
  return date.getTime() < Date.now();
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Approximates `formatDistanceToNowStrict` for a future expiry (en-US, short units). */
function formatDistanceStrictToNowFuture(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const minutes = Math.floor(ms / (60 * 1000));
  if (minutes < 1) return "less than a minute";
  if (minutes < 60)
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48)
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function InvitationAcceptance() {
  const router = useRouter();
  const expires = new Date(invitation.expiresAt);
  const expired = isExpired(expires);

  return (
    <div
      className="relative min-h-full overflow-hidden bg-background"
      role="region"
      aria-label="Invitation acceptance"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--color-primary) 18%, transparent) 0%, transparent 70%), radial-gradient(40% 40% at 100% 100%, color-mix(in oklab, var(--color-chart-2) 18%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col px-6 pb-8 pt-3 sm:pb-10 sm:pt-4 lg:pb-12 lg:pt-5">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center text-center sm:mt-1 lg:mt-2">
          <Badge
            variant="secondary"
            className="mb-5 gap-1.5 px-3 py-1 text-xs font-medium"
          >
            <Mail className="h-3.5 w-3.5" />
            You&apos;ve been invited
          </Badge>

          <div className="mb-6 flex items-center justify-center">
            <Avatar className="h-16 w-16 border-4 border-background shadow-md">
              <AvatarImage
                src={invitation.inviter.avatarUrl}
                alt={invitation.inviter.name}
              />
              <AvatarFallback>
                {getInitials(invitation.inviter.name)}
              </AvatarFallback>
            </Avatar>
            <div
              className="z-10 -mx-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background shadow-sm"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <Avatar className="h-16 w-16 rounded-2xl border-4 border-background shadow-md">
              <AvatarImage
                src={invitation.organization.logoUrl}
                alt={invitation.organization.name}
                className="rounded-xl"
              />
              <AvatarFallback className="rounded-xl">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </div>

          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Join{" "}
            <span style={{ color: "var(--color-primary)" }}>
              {invitation.organization.name}
            </span>{" "}
            as {invitation.position}
          </h1>
          <CardDescription className="mt-3 max-w-xl text-pretty text-base">
            <span className="font-medium text-foreground">
              {invitation.inviter.name}
            </span>{" "}
            ({invitation.inviter.email}) has invited you to collaborate on{" "}
            {invitation.organization.name}.
          </CardDescription>
        </section>

        <section className="mx-auto mt-7 w-full max-w-xl sm:mt-8">
          <Card className="gap-0 py-0 shadow-sm ring-border">
            <CardContent className="divide-y divide-border px-0 py-0">
              <InvitationDetailRow label="Position" value={invitation.position} />
              <InvitationDetailRow label="Access role" value={invitation.role} />
              <InvitationDetailRow
                label="Invited email"
                value={invitation.inviteeEmail}
                mono
              />
              <InvitationDetailRow
                label="Expires"
                value={
                  expired
                    ? "Expired"
                    : `in ${formatDistanceStrictToNowFuture(expires)} · ${formatShortDate(expires)}`
                }
                valueClassName={expired ? "text-destructive" : undefined}
              />
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:justify-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="lg"
                variant="outline"
                className="min-h-11 gap-2 px-6 text-base sm:min-w-[12rem] [&_svg]:size-[1.125rem]"
                disabled={expired}
              >
                <XCircle />
                Decline
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Decline this invitation?</AlertDialogTitle>
                <AlertDialogDescription>
                  You won&apos;t be able to join {invitation.organization.name}{" "}
                  unless {invitation.inviter.name} sends a new invitation.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep invitation</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.push("/declined")}>
                  Yes, decline
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            size="lg"
            className="min-h-11 gap-2 bg-[#4080f0] px-6 text-base text-white hover:bg-[#3070e0] focus-visible:border-[#4080f0] focus-visible:ring-[#4080f0]/50 sm:min-w-[12rem] [&_svg]:size-[1.125rem]"
            disabled={expired}
            onClick={() => router.push("/login")}
          >
            <CheckCircle2 />
            Accept
          </Button>
        </section>

        <Separator className="mx-auto mt-8 max-w-3xl sm:mt-10" />

        <CardDescription className="mx-auto mt-4 max-w-3xl text-center text-xs sm:mt-5">
          If you don&apos;t recognize this invitation, you can safely ignore it.{" "}
          <Button variant="link" className="h-auto p-0 text-xs" asChild>
            <Link href="/invite/about">Learn more</Link>
          </Button>
        </CardDescription>
      </div>
    </div>
  );
}

function InvitationDetailRow({
  label,
  value,
  mono,
  valueClassName,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5">
      <CardDescription className="text-sm">{label}</CardDescription>
      <span
        className={cn(
          "text-sm font-medium text-foreground",
          mono && "font-mono",
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  );
}
