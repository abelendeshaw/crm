import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { invitation } from "@/lib/mock-invitation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function inviterMailtoHref() {
  const subject = `Question about my invitation to ${invitation.organization.name}`;
  const body = `Hi ${invitation.inviter.name},

I have a question about the invitation to join ${invitation.organization.name}.

`;
  return `mailto:${invitation.inviter.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function InvitationAboutContent() {
  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto max-w-2xl px-6 py-8 pb-10 sm:py-10">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2 gap-2" asChild>
          <Link href="/user-management?tab=invitations">
            <ArrowLeft className="size-4" />
            Back to invitation
          </Link>
        </Button>

        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          About this invitation
        </h1>
        <CardDescription className="mt-2 max-w-prose text-base">
          Here is what it means when someone invites you to collaborate on{" "}
          {invitation.organization.name}, and how you can get help from the
          person who sent it.
        </CardDescription>

        <Separator className="my-8" />

        <Card>
          <CardHeader>
            <CardTitle>What an invitation is</CardTitle>
            <CardDescription>
              An invitation lets you join an existing workspace with a specific
              role—without creating a separate account request from scratch.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Your invite is tied to the email address shown on the invitation
              page. Accepting confirms that you intend to join as the listed
              position and access role ({invitation.position}, {invitation.role}
              ).
            </p>
            <p>
              Invitations expire for security: if time runs out, the person who
              invited you can send a fresh invite.
            </p>
            <p>
              If you were not expecting this email, you can ignore the
              invitation. No changes are made to your account unless you choose
              to accept.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Questions?</CardTitle>
            <CardDescription>
              Reach out directly to whoever invited you—they can clarify access,
              onboarding, or anything specific to your team.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {invitation.inviter.name}
              </p>
              <p className="text-muted-foreground">{invitation.inviter.email}</p>
            </div>
            <Button
              size="lg"
              className="gap-2 bg-[#4080f0] text-white hover:bg-[#3070e0] focus-visible:border-[#4080f0] focus-visible:ring-[#4080f0]/50 sm:shrink-0"
              asChild
            >
              <a href={inviterMailtoHref()}>
                <Mail className="size-4" />
                Email inviter
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
