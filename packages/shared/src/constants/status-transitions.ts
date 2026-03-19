import {
  PropertyStatus,
  LeaseStatus,
  MaintenanceStatus,
  PaymentStatus,
} from "../enums";

/**
 * Property status transitions (Section 3.2 of PRODUCT_SPEC.md):
 * - VACANT -> LISTED or OCCUPIED
 * - LISTED -> OCCUPIED or VACANT
 * - OCCUPIED -> MAINTENANCE or VACANT (only when no active lease)
 * - MAINTENANCE -> OCCUPIED or VACANT
 */
export const PROPERTY_STATUS_TRANSITIONS: Record<
  PropertyStatus,
  PropertyStatus[]
> = {
  [PropertyStatus.VACANT]: [PropertyStatus.LISTED, PropertyStatus.OCCUPIED],
  [PropertyStatus.LISTED]: [PropertyStatus.OCCUPIED, PropertyStatus.VACANT],
  [PropertyStatus.OCCUPIED]: [
    PropertyStatus.MAINTENANCE,
    PropertyStatus.VACANT,
  ],
  [PropertyStatus.MAINTENANCE]: [
    PropertyStatus.OCCUPIED,
    PropertyStatus.VACANT,
  ],
};

/**
 * Lease status transitions (Section 3.3 of PRODUCT_SPEC.md):
 * - PENDING -> ACTIVE
 * - ACTIVE -> EXPIRED or TERMINATED
 * - EXPIRED -> (no transitions, terminal state -- but can create renewal)
 * - TERMINATED -> (no transitions, terminal state)
 */
export const LEASE_STATUS_TRANSITIONS: Record<LeaseStatus, LeaseStatus[]> = {
  [LeaseStatus.PENDING]: [LeaseStatus.ACTIVE],
  [LeaseStatus.ACTIVE]: [LeaseStatus.EXPIRED, LeaseStatus.TERMINATED],
  [LeaseStatus.EXPIRED]: [],
  [LeaseStatus.TERMINATED]: [],
};

/**
 * Maintenance request status transitions (Section 3.4 of PRODUCT_SPEC.md):
 * - OPEN -> IN_PROGRESS
 * - IN_PROGRESS -> RESOLVED
 * - RESOLVED -> CLOSED
 *
 * Role constraints (enforced in API, not here):
 * - Only manager can move to IN_PROGRESS or RESOLVED
 * - Either party can move RESOLVED -> CLOSED
 */
export const MAINTENANCE_STATUS_TRANSITIONS: Record<
  MaintenanceStatus,
  MaintenanceStatus[]
> = {
  [MaintenanceStatus.OPEN]: [MaintenanceStatus.IN_PROGRESS],
  [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.RESOLVED],
  [MaintenanceStatus.RESOLVED]: [MaintenanceStatus.CLOSED],
  [MaintenanceStatus.CLOSED]: [],
};

/**
 * Payment status transitions (Section 3.5 of PRODUCT_SPEC.md):
 * - UPCOMING -> PENDING (on due date)
 * - PENDING -> PAID or OVERDUE
 * - OVERDUE -> PAID
 * - PAID -> (no transitions, terminal state)
 */
export const PAYMENT_STATUS_TRANSITIONS: Record<
  PaymentStatus,
  PaymentStatus[]
> = {
  [PaymentStatus.UPCOMING]: [PaymentStatus.PENDING],
  [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.OVERDUE],
  [PaymentStatus.OVERDUE]: [PaymentStatus.PAID],
  [PaymentStatus.PAID]: [],
};

/**
 * Generic helper: checks if a status transition is valid.
 * Use: `isValidTransition(PROPERTY_STATUS_TRANSITIONS, currentStatus, newStatus)`
 */
export function isValidTransition<T extends string>(
  transitionMap: Record<T, T[]>,
  from: T,
  to: T
): boolean {
  return transitionMap[from]?.includes(to) ?? false;
}
