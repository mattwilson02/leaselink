import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming later</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Profile and settings management will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
