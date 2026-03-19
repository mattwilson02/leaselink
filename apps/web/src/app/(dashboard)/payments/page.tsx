import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Sprint 4</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Payment tracking features will be available in Sprint 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
