"use client";

import { type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  onClick?: () => void;
  subtitleClassName?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
  subtitleClassName,
}: StatCardProps) {
  return (
    <Card
      className={cn(onClick && "cursor-pointer transition-colors hover:bg-muted/50")}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && (
          <p className={cn("mt-1 text-xs text-muted-foreground", subtitleClassName)}>
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
