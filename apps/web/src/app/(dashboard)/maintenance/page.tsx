import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Sprint 3</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Maintenance request management will be available in the next sprint.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
