"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  Wrench,
  CreditCard,
  AlertTriangle,
  Clock,
  FileUp,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useHasUnreadNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type Notification,
} from "@/hooks/use-notifications";

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ActionConfig {
  icon: LucideIcon;
  className: string;
}

const actionTypeConfig: Record<string, ActionConfig> = {
  MAINTENANCE_UPDATE: { icon: Wrench, className: "text-amber-600" },
  PAYMENT_RECEIVED: { icon: CreditCard, className: "text-green-600" },
  PAYMENT_OVERDUE: { icon: AlertTriangle, className: "text-destructive" },
  RENT_REMINDER: { icon: Clock, className: "text-blue-600" },
  UPLOAD_DOCUMENT: { icon: FileUp, className: "text-muted-foreground" },
  LEASE_EXPIRY: { icon: Calendar, className: "text-amber-600" },
  LEASE_RENEWAL: { icon: RefreshCw, className: "text-blue-600" },
};

function getActionConfig(notification: Notification): ActionConfig {
  if (notification.actionType && actionTypeConfig[notification.actionType]) {
    return actionTypeConfig[notification.actionType];
  }
  return { icon: Bell, className: "text-muted-foreground" };
}

function getLinkedPath(notification: Notification): string | null {
  if (notification.linkedMaintenanceRequestId) {
    return `/maintenance/${notification.linkedMaintenanceRequestId}`;
  }
  if (notification.linkedPaymentId) {
    return `/payments/${notification.linkedPaymentId}`;
  }
  if (notification.linkedDocumentId) {
    // Document notifications link to document requests, not documents
    if (notification.actionType === "UPLOAD_DOCUMENT" || notification.actionType === "SIGN_DOCUMENT") {
      return "/documents/requests";
    }
    return `/documents/${notification.linkedDocumentId}`;
  }
  return null;
}

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
}

function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const router = useRouter();
  const markRead = useMarkNotificationRead();

  const config = getActionConfig(notification);
  const Icon = config.icon;
  const linkedPath = getLinkedPath(notification);

  function handleClick() {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    onRead();
    if (linkedPath) {
      router.push(linkedPath);
    }
  }

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
        !notification.isRead && "bg-muted/30"
      )}
      onClick={handleClick}
    >
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted",
          config.className
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {!notification.isRead && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
          <p
            className={cn(
              "truncate text-sm",
              !notification.isRead && "font-semibold"
            )}
          >
            {notification.title}
          </p>
        </div>
        {notification.body && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {notification.body}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {relativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}

export function NotificationDropdown() {
  const hasUnread = useHasUnreadNotifications();
  const notifications = useNotifications({ limit: 10 });
  const markAll = useMarkAllNotificationsRead();

  const items = notifications.data?.notifications ?? [];

  return (
    <Popover>
      <PopoverTrigger
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Open notifications"
      >
        <Bell className="h-4 w-4" />
        {hasUnread.data && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-50"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending || items.every((n) => n.isRead)}
          >
            Mark all as read
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            <div className="divide-y">
              {items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
