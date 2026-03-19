// Property errors
export const PROPERTY_NOT_FOUND = "Property not found";
export const PROPERTY_HAS_ACTIVE_LEASE =
  "Property cannot be deleted while it has an active lease";
export const PROPERTY_INVALID_STATUS_TRANSITION =
  "Invalid property status transition";
export const PROPERTY_OCCUPIED_CANNOT_GO_VACANT_WITH_LEASE =
  "Property cannot be set to VACANT while it has an active lease";

// Lease errors
export const LEASE_NOT_FOUND = "Lease not found";
export const LEASE_INVALID_STATUS_TRANSITION =
  "Invalid lease status transition";
export const LEASE_PROPERTY_NOT_AVAILABLE =
  "Property is not in a valid status for a new lease (must be LISTED or OCCUPIED)";
export const LEASE_PROPERTY_HAS_ACTIVE_LEASE =
  "Property already has an active lease";
export const LEASE_TENANT_HAS_ACTIVE_LEASE =
  "Tenant already has an active lease";
export const LEASE_TERMINATED_CANNOT_REACTIVATE =
  "A terminated lease cannot be reactivated";
export const LEASE_END_BEFORE_START = "Lease end date must be after start date";
export const LEASE_RENEWAL_INVALID_SOURCE =
  "Renewal can only be created from an ACTIVE or EXPIRED lease";
export const LEASE_RENEWAL_START_DATE_INVALID =
  "Renewal start date must be on or after the original lease end date";
export const LEASE_RENEWAL_ALREADY_EXISTS =
  "A pending renewal already exists for this lease";

// Maintenance errors
export const MAINTENANCE_NOT_FOUND = "Maintenance request not found";
export const MAINTENANCE_INVALID_STATUS_TRANSITION =
  "Invalid maintenance request status transition";
export const MAINTENANCE_NO_ACTIVE_LEASE =
  "Tenant can only submit maintenance requests for properties with an active lease";
export const MAINTENANCE_ONLY_MANAGER_CAN_UPDATE_STATUS =
  "Only the property manager can update request status to IN_PROGRESS or RESOLVED";

// Payment errors
export const PAYMENT_NOT_FOUND = "Payment not found";
export const PAYMENT_INVALID_STATUS_TRANSITION =
  "Invalid payment status transition";
export const PAYMENT_NO_ACTIVE_LEASE =
  "Tenant can only pay rent for an active lease";
export const PAYMENT_ALREADY_PAID = "This payment has already been paid";

// Generic errors
export const UNAUTHORIZED = "Unauthorized";
export const FORBIDDEN = "You do not have permission to perform this action";
export const VALIDATION_FAILED = "Validation failed";
