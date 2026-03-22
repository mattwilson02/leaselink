import { describe, it, expect } from "vitest";
import {
  createPropertySchema,
  createLeaseSchema,
  createMaintenanceRequestSchema,
  propertyFilterSchema,
  createExpenseSchema,
  createVendorSchema,
  auditLogFilterSchema,
} from "../index";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

describe("Property schema", () => {
  const validProperty = {
    address: "123 Main St",
    city: "NYC",
    state: "NY",
    zipCode: "10001",
    propertyType: "APARTMENT",
    bedrooms: 2,
    bathrooms: 1.5,
    rentAmount: 2500,
  };

  it("accepts valid create input", () => {
    const result = createPropertySchema.safeParse(validProperty);
    expect(result.success).toBe(true);
  });

  it("rejects missing address", () => {
    const { address, ...rest } = validProperty;
    const result = createPropertySchema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message.toLowerCase()).toContain("required");
    }
  });

  it("rejects negative rent", () => {
    const result = createPropertySchema.safeParse({
      ...validProperty,
      rentAmount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero rent", () => {
    const result = createPropertySchema.safeParse({
      ...validProperty,
      rentAmount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid property type", () => {
    const result = createPropertySchema.safeParse({
      ...validProperty,
      propertyType: "MANSION",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid input with optional sqft", () => {
    const result = createPropertySchema.safeParse({
      ...validProperty,
      sqft: 1200,
    });
    expect(result.success).toBe(true);
  });
});

describe("Lease schema", () => {
  const validLease = {
    propertyId: validUuid,
    tenantId: validUuid,
    startDate: "2026-04-01T00:00:00.000Z",
    endDate: "2027-04-01T00:00:00.000Z",
    monthlyRent: 2000,
    securityDeposit: 4000,
  };

  it("accepts valid create input", () => {
    const result = createLeaseSchema.safeParse(validLease);
    expect(result.success).toBe(true);
  });

  it("rejects end date before start date", () => {
    const result = createLeaseSchema.safeParse({
      ...validLease,
      startDate: "2027-01-01T00:00:00.000Z",
      endDate: "2026-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "End date must be after start date"
      );
    }
  });

  it("rejects zero rent", () => {
    const result = createLeaseSchema.safeParse({
      ...validLease,
      monthlyRent: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing propertyId", () => {
    const { propertyId, ...rest } = validLease;
    const result = createLeaseSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID", () => {
    const result = createLeaseSchema.safeParse({
      ...validLease,
      propertyId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects lease shorter than 30 days", () => {
    const start = new Date("2026-04-01T00:00:00.000Z");
    const end = new Date(start);
    end.setDate(end.getDate() + 29);
    const result = createLeaseSchema.safeParse({
      ...validLease,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Lease duration must be at least 30 days"
      );
    }
  });

  it("accepts lease with exactly 30-day duration", () => {
    const start = new Date("2026-04-01T00:00:00.000Z");
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    const result = createLeaseSchema.safeParse({
      ...validLease,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("accepts lease with exactly 1825-day (5 year) duration", () => {
    const start = new Date("2026-04-01T00:00:00.000Z");
    const end = new Date(start);
    end.setDate(end.getDate() + 1825);
    const result = createLeaseSchema.safeParse({
      ...validLease,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects lease longer than 5 years (1826 days)", () => {
    const start = new Date("2026-04-01T00:00:00.000Z");
    const end = new Date(start);
    end.setDate(end.getDate() + 1826);
    const result = createLeaseSchema.safeParse({
      ...validLease,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Lease duration cannot exceed 5 years"
      );
    }
  });
});

describe("MaintenanceRequest schema", () => {
  const validRequest = {
    propertyId: validUuid,
    title: "Leaky faucet",
    description: "Kitchen sink drips",
    category: "PLUMBING",
  };

  it("accepts valid input and defaults priority to MEDIUM", () => {
    const result = createMaintenanceRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe("MEDIUM");
    }
  });

  it("rejects empty title", () => {
    const result = createMaintenanceRequestSchema.safeParse({
      ...validRequest,
      title: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title too long", () => {
    const result = createMaintenanceRequestSchema.safeParse({
      ...validRequest,
      title: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = createMaintenanceRequestSchema.safeParse({
      ...validRequest,
      category: "MAGIC",
    });
    expect(result.success).toBe(false);
  });
});

describe("Filter schemas", () => {
  it("accepts empty filter with defaults", () => {
    const result = propertyFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("coerces page string to number", () => {
    const result = propertyFilterSchema.safeParse({ page: "3" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
    }
  });

  it("rejects pageSize over max", () => {
    const result = propertyFilterSchema.safeParse({ pageSize: 201 });
    expect(result.success).toBe(false);
  });
});

describe("Expense schema", () => {
  const validExpense = {
    propertyId: validUuid,
    category: "MAINTENANCE",
    amount: 500,
    description: "Plumber visit",
    expenseDate: "2026-03-01T00:00:00.000Z",
  };

  it("accepts valid create input", () => {
    const result = createExpenseSchema.safeParse(validExpense);
    expect(result.success).toBe(true);
  });

  it("rejects negative amount", () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      category: "FAKE",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid input with maintenance request link", () => {
    const result = createExpenseSchema.safeParse({
      ...validExpense,
      maintenanceRequestId: validUuid,
    });
    expect(result.success).toBe(true);
  });
});

describe("Vendor schema", () => {
  it("accepts valid create input", () => {
    const result = createVendorSchema.safeParse({
      name: "Joe's Plumbing",
      specialty: "PLUMBING",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = createVendorSchema.safeParse({
      name: "",
      specialty: "PLUMBING",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid specialty", () => {
    const result = createVendorSchema.safeParse({
      name: "X",
      specialty: "MAGIC",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid input with all fields", () => {
    const result = createVendorSchema.safeParse({
      name: "X",
      specialty: "HVAC",
      phone: "555-1234",
      email: "x@y.com",
      notes: "Good vendor",
    });
    expect(result.success).toBe(true);
  });
});

describe("AuditLog filter schema", () => {
  it("accepts empty filter with defaults", () => {
    const result = auditLogFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
    }
  });

  it("accepts filter by resource type and resource ID", () => {
    const result = auditLogFilterSchema.safeParse({
      resourceType: "PROPERTY",
      resourceId: validUuid,
    });
    expect(result.success).toBe(true);
  });
});
