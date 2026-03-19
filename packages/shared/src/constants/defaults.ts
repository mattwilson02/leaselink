/**
 * Payment grace period in days before marking OVERDUE.
 * Section 3.5: "Grace period: 5 days after due date before marking OVERDUE"
 */
export const PAYMENT_GRACE_PERIOD_DAYS = 5;

/**
 * Lease expiry notification intervals in days before end date.
 * Section 3.3: "Lease expiry notifications are sent 60 days, 30 days, and 7 days before end date"
 */
export const LEASE_EXPIRY_NOTIFICATION_DAYS = [60, 30, 7] as const;

/**
 * Default pagination values.
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Default maintenance request priority.
 * Section 3.4: "Priority levels: LOW, MEDIUM (default), HIGH, EMERGENCY"
 */
export const DEFAULT_MAINTENANCE_PRIORITY = "MEDIUM" as const;

/**
 * Maximum file upload sizes (in bytes).
 */
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PROPERTY_PHOTOS = 20;
export const MAX_MAINTENANCE_PHOTOS = 10;

/**
 * String length limits.
 */
export const MAX_MAINTENANCE_TITLE_LENGTH = 200;
export const MAX_MAINTENANCE_DESCRIPTION_LENGTH = 5000;
