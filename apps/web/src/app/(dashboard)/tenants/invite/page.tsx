"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InviteTenantForm } from "@/components/tenants/invite-tenant-form";

export default function InviteTenantPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tenants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invite Tenant</h1>
          <p className="text-muted-foreground">
            Send an invitation to a new tenant
          </p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Tenant Information</CardTitle>
          <CardDescription>
            Enter the tenant&apos;s details to send them an invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteTenantForm />
        </CardContent>
      </Card>
    </div>
  );
}
