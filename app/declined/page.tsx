import Link from "next/link";

import { CRMLayout } from "@/components/layout/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeclinedPage() {
  return (
    <CRMLayout>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation declined</CardTitle>
            <CardDescription>
              You can ask your teammate to send a new invite if you change your mind.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}
