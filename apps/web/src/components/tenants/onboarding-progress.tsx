"use client";

import { OnboardingStatus, ONBOARDING_STATUS_LABELS } from "@leaselink/shared";
import { cn } from "@/lib/utils";

const STEPS: OnboardingStatus[] = [
  OnboardingStatus.NEW,
  OnboardingStatus.EMAIL_VERIFIED,
  OnboardingStatus.PHONE_VERIFIED,
  OnboardingStatus.PASSWORD_SET,
  OnboardingStatus.ONBOARDED,
];

interface OnboardingProgressProps {
  status: OnboardingStatus;
}

export function OnboardingProgress({ status }: OnboardingProgressProps) {
  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, index) => (
        <div
          key={step}
          className={cn(
            "h-2 w-2 rounded-full",
            index <= currentIndex
              ? "bg-green-500"
              : "bg-muted-foreground/30"
          )}
          title={ONBOARDING_STATUS_LABELS[step]}
        />
      ))}
      <span className="ml-2 text-xs text-muted-foreground">
        {ONBOARDING_STATUS_LABELS[status]}
      </span>
    </div>
  );
}
