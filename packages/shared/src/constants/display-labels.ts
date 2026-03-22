import {
  PropertyType,
  PropertyStatus,
  LeaseStatus,
  PaymentStatus,
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceCategory,
  DocumentFolder,
  DocumentRequestType,
  TenantStatus,
  OnboardingStatus,
  ManagerRole,
  NotificationType,
  ActionType,
  DocumentRequestStatus,
  ExpenseCategory,
  AuditAction,
  AuditResourceType,
} from "../enums";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  [PropertyType.APARTMENT]: "Apartment",
  [PropertyType.HOUSE]: "House",
  [PropertyType.CONDO]: "Condo",
  [PropertyType.TOWNHOUSE]: "Townhouse",
  [PropertyType.STUDIO]: "Studio",
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  [PropertyStatus.VACANT]: "Vacant",
  [PropertyStatus.LISTED]: "Listed",
  [PropertyStatus.OCCUPIED]: "Occupied",
  [PropertyStatus.MAINTENANCE]: "Under Maintenance",
};

export const LEASE_STATUS_LABELS: Record<LeaseStatus, string> = {
  [LeaseStatus.PENDING]: "Pending",
  [LeaseStatus.ACTIVE]: "Active",
  [LeaseStatus.EXPIRED]: "Expired",
  [LeaseStatus.TERMINATED]: "Terminated",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.UPCOMING]: "Upcoming",
  [PaymentStatus.PENDING]: "Pending",
  [PaymentStatus.PAID]: "Paid",
  [PaymentStatus.OVERDUE]: "Overdue",
};

export const MAINTENANCE_PRIORITY_LABELS: Record<
  MaintenancePriority,
  string
> = {
  [MaintenancePriority.LOW]: "Low",
  [MaintenancePriority.MEDIUM]: "Medium",
  [MaintenancePriority.HIGH]: "High",
  [MaintenancePriority.EMERGENCY]: "Emergency",
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.OPEN]: "Open",
  [MaintenanceStatus.IN_PROGRESS]: "In Progress",
  [MaintenanceStatus.RESOLVED]: "Resolved",
  [MaintenanceStatus.CLOSED]: "Closed",
};

export const MAINTENANCE_CATEGORY_LABELS: Record<
  MaintenanceCategory,
  string
> = {
  [MaintenanceCategory.PLUMBING]: "Plumbing",
  [MaintenanceCategory.ELECTRICAL]: "Electrical",
  [MaintenanceCategory.HVAC]: "HVAC",
  [MaintenanceCategory.APPLIANCE]: "Appliance",
  [MaintenanceCategory.STRUCTURAL]: "Structural",
  [MaintenanceCategory.PEST_CONTROL]: "Pest Control",
  [MaintenanceCategory.OTHER]: "Other",
};

export const DOCUMENT_FOLDER_LABELS: Record<DocumentFolder, string> = {
  [DocumentFolder.IDENTIFICATION]: "Identification",
  [DocumentFolder.LEASE_AGREEMENTS]: "Lease Agreements",
  [DocumentFolder.SIGNED_DOCUMENTS]: "Signed Documents",
  [DocumentFolder.INSPECTION_REPORTS]: "Inspection Reports",
  [DocumentFolder.INSURANCE]: "Insurance",
  [DocumentFolder.OTHER]: "Other",
};

export const DOCUMENT_REQUEST_TYPE_LABELS: Record<
  DocumentRequestType,
  string
> = {
  [DocumentRequestType.PROOF_OF_ADDRESS]: "Proof of Address",
  [DocumentRequestType.PROOF_OF_IDENTITY]: "Proof of Identity",
  [DocumentRequestType.SIGNED_LEASE]: "Signed Lease",
  [DocumentRequestType.MOVE_IN_CHECKLIST]: "Move-in Checklist",
};

export const DOCUMENT_REQUEST_STATUS_LABELS: Record<
  DocumentRequestStatus,
  string
> = {
  [DocumentRequestStatus.PENDING]: "Pending",
  [DocumentRequestStatus.UPLOADED]: "Uploaded",
  [DocumentRequestStatus.CANCELED]: "Canceled",
};

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  [TenantStatus.INVITED]: "Invited",
  [TenantStatus.ACTIVE]: "Active",
  [TenantStatus.INACTIVE]: "Inactive",
};

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  [OnboardingStatus.NEW]: "New",
  [OnboardingStatus.EMAIL_VERIFIED]: "Email Verified",
  [OnboardingStatus.PHONE_VERIFIED]: "Phone Verified",
  [OnboardingStatus.PASSWORD_SET]: "Password Set",
  [OnboardingStatus.ONBOARDED]: "Onboarded",
};

export const MANAGER_ROLE_LABELS: Record<ManagerRole, string> = {
  [ManagerRole.ADMIN]: "Admin",
  [ManagerRole.AGENT]: "Agent",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.INFO]: "Info",
  [NotificationType.ACTION]: "Action Required",
};

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  [ActionType.SIGN_DOCUMENT]: "Sign Document",
  [ActionType.SIGN_LEASE]: "Sign Lease",
  [ActionType.UPLOAD_DOCUMENT]: "Upload Document",
  [ActionType.BASIC_COMPLETE]: "Complete",
  [ActionType.MAINTENANCE_UPDATE]: "Maintenance Update",
  [ActionType.LEASE_EXPIRY]: "Lease Expiry",
  [ActionType.RENT_REMINDER]: "Rent Reminder",
  [ActionType.PAYMENT_RECEIVED]: "Payment Received",
  [ActionType.PAYMENT_OVERDUE]: "Payment Overdue",
  [ActionType.INSPECTION_SCHEDULED]: "Inspection Scheduled",
  [ActionType.LEASE_RENEWAL]: "Lease Renewal",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.MAINTENANCE]: "Maintenance",
  [ExpenseCategory.INSURANCE]: "Insurance",
  [ExpenseCategory.TAX]: "Tax",
  [ExpenseCategory.UTILITY]: "Utility",
  [ExpenseCategory.MANAGEMENT_FEE]: "Management Fee",
  [ExpenseCategory.REPAIR]: "Repair",
  [ExpenseCategory.IMPROVEMENT]: "Improvement",
  [ExpenseCategory.OTHER]: "Other",
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  [AuditAction.CREATE]: "Created",
  [AuditAction.UPDATE]: "Updated",
  [AuditAction.DELETE]: "Deleted",
  [AuditAction.STATUS_CHANGE]: "Status Changed",
  [AuditAction.LOGIN]: "Login",
  [AuditAction.UPLOAD]: "Uploaded",
  [AuditAction.DOWNLOAD]: "Downloaded",
  [AuditAction.SIGN]: "Signed",
};

export const AUDIT_RESOURCE_TYPE_LABELS: Record<AuditResourceType, string> = {
  [AuditResourceType.PROPERTY]: "Property",
  [AuditResourceType.LEASE]: "Lease",
  [AuditResourceType.TENANT]: "Tenant",
  [AuditResourceType.PAYMENT]: "Payment",
  [AuditResourceType.MAINTENANCE_REQUEST]: "Maintenance Request",
  [AuditResourceType.DOCUMENT]: "Document",
  [AuditResourceType.EXPENSE]: "Expense",
  [AuditResourceType.VENDOR]: "Vendor",
};
