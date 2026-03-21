"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions, useRevokeSession } from "@/hooks/use-sessions";
import { apiClient } from "@/lib/api-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Better Auth GET /api/auth/get-session returns { session, user }
// user.twoFactorEnabled: boolean
interface BetterAuthUser {
  id: string;
  name: string;
  email: string;
  twoFactorEnabled?: boolean;
}

interface BetterAuthSessionResponse {
  session: { id: string; userId: string };
  user: BetterAuthUser;
}

function useTwoFactorStatus() {
  return useQuery({
    queryKey: ["auth-session"],
    queryFn: () =>
      apiClient.get<BetterAuthSessionResponse>("/api/auth/get-session"),
  });
}

// Build a QR code image URL using the Google Charts API
function buildQrCodeUrl(totpUri: string): string {
  const encoded = encodeURIComponent(totpUri);
  return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encoded}&choe=UTF-8`;
}

function parseUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (ua.includes("Chrome") && ua.includes("Windows")) return "Chrome on Windows";
  if (ua.includes("Chrome") && ua.includes("Mac")) return "Chrome on macOS";
  if (ua.includes("Chrome") && ua.includes("Linux")) return "Chrome on Linux";
  if (ua.includes("Firefox") && ua.includes("Windows")) return "Firefox on Windows";
  if (ua.includes("Firefox") && ua.includes("Mac")) return "Firefox on macOS";
  if (ua.includes("Safari") && ua.includes("Mac")) return "Safari on macOS";
  if (ua.includes("Safari") && ua.includes("iPhone")) return "Safari on iPhone";
  if (ua.includes("Safari") && ua.includes("iPad")) return "Safari on iPad";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Mobile")) return "Mobile browser";
  return "Web browser";
}

// ─── Two-Factor Authentication Section ───────────────────────────────────────

type TwoFaSetupStep = "idle" | "pending-enable" | "show-qr" | "verify" | "pending-disable";

interface EnableResponse {
  totpURI: string;
  backupCodes: string[];
}

function TwoFactorSection() {
  const queryClient = useQueryClient();
  const { data: sessionData, isLoading, isError } = useTwoFactorStatus();
  const twoFactorEnabled = sessionData?.user?.twoFactorEnabled ?? false;

  const [step, setStep] = useState<TwoFaSetupStep>("idle");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [setupData, setSetupData] = useState<EnableResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function reset() {
    setStep("idle");
    setPassword("");
    setTotpCode("");
    setSetupData(null);
    setError(null);
    setIsPending(false);
  }

  async function handleEnable() {
    setError(null);
    setIsPending(true);
    try {
      const result = await apiClient.post<EnableResponse>(
        "/api/auth/two-factor/enable",
        { password }
      );
      setSetupData(result);
      setPassword("");
      setStep("show-qr");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable 2FA.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleVerifyTotp() {
    setError(null);
    setIsPending(true);
    try {
      await apiClient.post("/api/auth/two-factor/verify-totp", {
        code: totpCode,
      });
      queryClient.invalidateQueries({ queryKey: ["auth-session"] });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  async function handleDisable() {
    setError(null);
    setIsPending(true);
    try {
      await apiClient.post("/api/auth/two-factor/disable", { password });
      queryClient.invalidateQueries({ queryKey: ["auth-session"] });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA.");
    } finally {
      setIsPending(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Could not load 2FA status.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <CardTitle>Two-Factor Authentication</CardTitle>
          {twoFactorEnabled ? (
            <Badge variant="default">Enabled</Badge>
          ) : (
            <Badge variant="secondary">Disabled</Badge>
          )}
        </div>
        <CardDescription>
          Add an extra layer of security to your account using a TOTP
          authenticator app (e.g. Google Authenticator, Authy).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Disabled state — prompt for password to enable */}
        {!twoFactorEnabled && step === "idle" && (
          <Button onClick={() => setStep("pending-enable")} variant="default">
            Enable 2FA
          </Button>
        )}

        {!twoFactorEnabled && step === "pending-enable" && (
          <div className="space-y-4 max-w-sm">
            <p className="text-sm text-muted-foreground">
              Enter your current password to generate a 2FA setup code.
            </p>
            <div className="space-y-1">
              <Label htmlFor="2fa-enable-password">Current Password</Label>
              <Input
                id="2fa-enable-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                placeholder="Your current password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={handleEnable} disabled={isPending || !password}>
                {isPending ? "Loading..." : "Continue"}
              </Button>
              <Button variant="outline" onClick={reset} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* QR code and backup codes — shown after enable call succeeds */}
        {!twoFactorEnabled && step === "show-qr" && setupData && (
          <div className="space-y-6 max-w-sm">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Scan this QR code with your authenticator app
              </p>
              <div className="inline-block rounded-md border p-2 bg-white">
                {/* Using Google Charts API to render the QR code */}
                <img
                  src={buildQrCodeUrl(setupData.totpURI)}
                  alt="TOTP QR code"
                  width={200}
                  height={200}
                />
              </div>
              <p className="text-xs text-muted-foreground break-all">
                {setupData.totpURI}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Save your backup codes
              </p>
              <div className="rounded-md border bg-muted p-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Store these codes somewhere safe. Each code can only be used
                  once to recover access if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {setupData.backupCodes.map((code) => (
                    <code
                      key={code}
                      className="text-xs font-mono bg-background rounded px-1 py-0.5"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={() => setStep("verify")}>
              I have saved my codes — Continue
            </Button>
          </div>
        )}

        {/* TOTP verification step */}
        {!twoFactorEnabled && step === "verify" && (
          <div className="space-y-4 max-w-sm">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code from your authenticator app to complete
              setup.
            </p>
            <div className="space-y-1">
              <Label htmlFor="totp-verify-code">Authenticator Code</Label>
              <Input
                id="totp-verify-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                disabled={isPending}
                placeholder="000000"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                onClick={handleVerifyTotp}
                disabled={isPending || totpCode.length !== 6}
              >
                {isPending ? "Verifying..." : "Verify and Activate"}
              </Button>
              <Button variant="outline" onClick={reset} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Enabled state — prompt for password to disable */}
        {twoFactorEnabled && step === "idle" && (
          <Button
            variant="destructive"
            onClick={() => setStep("pending-disable")}
          >
            Disable 2FA
          </Button>
        )}

        {twoFactorEnabled && step === "pending-disable" && (
          <div className="space-y-4 max-w-sm">
            <p className="text-sm text-muted-foreground">
              Enter your current password to disable two-factor authentication.
            </p>
            <div className="space-y-1">
              <Label htmlFor="2fa-disable-password">Current Password</Label>
              <Input
                id="2fa-disable-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                placeholder="Your current password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={isPending || !password}
              >
                {isPending ? "Disabling..." : "Confirm Disable"}
              </Button>
              <Button variant="outline" onClick={reset} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Active Sessions Section ──────────────────────────────────────────────────

function SessionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActiveSessionsSection() {
  const { data, isLoading, isError } = useSessions();
  const revoke = useRevokeSession();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (isLoading) return <SessionsSkeleton />;

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Could not load active sessions.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const sessions = data?.sessions ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>
          Devices and browsers currently signed in to your account. You cannot
          revoke your current session.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.length === 0 && (
          <p className="text-sm text-muted-foreground">No active sessions found.</p>
        )}
        {sessions.map((session) => {
          const loginDate = new Date(session.createdAt).toLocaleDateString(
            undefined,
            { year: "numeric", month: "short", day: "numeric" }
          );
          const device = parseUserAgent(session.userAgent);
          const isRevoking = revoke.isPending && revoke.variables === session.id;

          return (
            <div
              key={session.id}
              className="flex items-start justify-between rounded-md border p-3 gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{device}</p>
                  {session.isCurrent && (
                    <Badge variant="outline" className="text-xs">
                      Current session
                    </Badge>
                  )}
                </div>
                {session.ipAddress && (
                  <p className="text-xs text-muted-foreground">
                    IP: {session.ipAddress}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Signed in {loginDate}
                </p>
                {revoke.isError && revoke.variables === session.id && (
                  <p className="text-xs text-destructive">
                    {revoke.error instanceof Error
                      ? revoke.error.message
                      : "Failed to revoke session."}
                  </p>
                )}
              </div>

              {!session.isCurrent && (
                <div className="shrink-0">
                  {confirmId === session.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isRevoking}
                        onClick={() => {
                          revoke.mutate(session.id, {
                            onSettled: () => setConfirmId(null),
                          });
                        }}
                      >
                        {isRevoking ? "Revoking..." : "Confirm"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isRevoking}
                        onClick={() => setConfirmId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmId(session.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsSecurityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Security</h1>
      <TwoFactorSection />
      <ActiveSessionsSection />
    </div>
  );
}
