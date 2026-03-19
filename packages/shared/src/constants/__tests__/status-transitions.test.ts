import { describe, it, expect } from "vitest";
import {
  PROPERTY_STATUS_TRANSITIONS,
  LEASE_STATUS_TRANSITIONS,
  MAINTENANCE_STATUS_TRANSITIONS,
  PAYMENT_STATUS_TRANSITIONS,
  isValidTransition,
} from "../status-transitions";
import {
  PROPERTY_TYPE_LABELS,
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_PRIORITY_LABELS,
} from "../display-labels";
import {
  PropertyType,
  PropertyStatus,
  LeaseStatus,
  MaintenanceStatus,
  PaymentStatus,
  MaintenanceCategory,
  MaintenancePriority,
} from "../../enums";

describe("Status transitions", () => {
  describe("Property", () => {
    it("VACANT -> LISTED is valid", () => {
      expect(
        isValidTransition(PROPERTY_STATUS_TRANSITIONS, PropertyStatus.VACANT, PropertyStatus.LISTED)
      ).toBe(true);
    });

    it("VACANT -> OCCUPIED is valid", () => {
      expect(
        isValidTransition(PROPERTY_STATUS_TRANSITIONS, PropertyStatus.VACANT, PropertyStatus.OCCUPIED)
      ).toBe(true);
    });

    it("VACANT -> MAINTENANCE is invalid", () => {
      expect(
        isValidTransition(
          PROPERTY_STATUS_TRANSITIONS,
          PropertyStatus.VACANT,
          PropertyStatus.MAINTENANCE
        )
      ).toBe(false);
    });

    it("LISTED -> VACANT is valid", () => {
      expect(
        isValidTransition(PROPERTY_STATUS_TRANSITIONS, PropertyStatus.LISTED, PropertyStatus.VACANT)
      ).toBe(true);
    });
  });

  describe("Lease", () => {
    it("PENDING -> ACTIVE is valid", () => {
      expect(
        isValidTransition(LEASE_STATUS_TRANSITIONS, LeaseStatus.PENDING, LeaseStatus.ACTIVE)
      ).toBe(true);
    });

    it("PENDING -> EXPIRED is invalid", () => {
      expect(
        isValidTransition(LEASE_STATUS_TRANSITIONS, LeaseStatus.PENDING, LeaseStatus.EXPIRED)
      ).toBe(false);
    });

    it("TERMINATED -> ACTIVE is invalid", () => {
      expect(
        isValidTransition(LEASE_STATUS_TRANSITIONS, LeaseStatus.TERMINATED, LeaseStatus.ACTIVE)
      ).toBe(false);
    });

    it("EXPIRED has no transitions", () => {
      expect(LEASE_STATUS_TRANSITIONS[LeaseStatus.EXPIRED].length).toBe(0);
    });
  });

  describe("Maintenance", () => {
    it("OPEN -> IN_PROGRESS is valid", () => {
      expect(
        isValidTransition(
          MAINTENANCE_STATUS_TRANSITIONS,
          MaintenanceStatus.OPEN,
          MaintenanceStatus.IN_PROGRESS
        )
      ).toBe(true);
    });

    it("OPEN -> RESOLVED is invalid", () => {
      expect(
        isValidTransition(
          MAINTENANCE_STATUS_TRANSITIONS,
          MaintenanceStatus.OPEN,
          MaintenanceStatus.RESOLVED
        )
      ).toBe(false);
    });

    it("RESOLVED -> CLOSED is valid", () => {
      expect(
        isValidTransition(
          MAINTENANCE_STATUS_TRANSITIONS,
          MaintenanceStatus.RESOLVED,
          MaintenanceStatus.CLOSED
        )
      ).toBe(true);
    });
  });

  describe("Payment", () => {
    it("UPCOMING -> PENDING is valid", () => {
      expect(
        isValidTransition(PAYMENT_STATUS_TRANSITIONS, PaymentStatus.UPCOMING, PaymentStatus.PENDING)
      ).toBe(true);
    });

    it("OVERDUE -> PAID is valid", () => {
      expect(
        isValidTransition(PAYMENT_STATUS_TRANSITIONS, PaymentStatus.OVERDUE, PaymentStatus.PAID)
      ).toBe(true);
    });

    it("PAID has no transitions", () => {
      expect(PAYMENT_STATUS_TRANSITIONS[PaymentStatus.PAID].length).toBe(0);
    });
  });
});

describe("Display labels", () => {
  it("all PropertyType values have labels", () => {
    expect(
      Object.values(PropertyType).every((v) => PROPERTY_TYPE_LABELS[v])
    ).toBe(true);
  });

  it("all MaintenanceCategory values have labels", () => {
    expect(
      Object.values(MaintenanceCategory).every(
        (v) => MAINTENANCE_CATEGORY_LABELS[v]
      )
    ).toBe(true);
  });

  it("EMERGENCY priority label is correct", () => {
    expect(MAINTENANCE_PRIORITY_LABELS[MaintenancePriority.EMERGENCY]).toBe(
      "Emergency"
    );
  });
});
