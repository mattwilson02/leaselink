/**
 * Minimum lease duration in days.
 * Leases shorter than this are rejected at schema validation.
 */
export const MIN_LEASE_DURATION_DAYS = 30;

/**
 * Maximum lease duration in days (5 years).
 * Leases longer than this are rejected at schema validation.
 */
export const MAX_LEASE_DURATION_DAYS = 1825;
