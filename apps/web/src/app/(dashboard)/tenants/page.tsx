import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Sprint 3</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tenant management features will be available in the next sprint.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
