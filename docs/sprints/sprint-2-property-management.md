# Sprint 2: Property Management — API + Web Dashboard Foundation

## Overview

This sprint delivers the first feature vertical: **Property Management CRUD** across the API and web dashboard, plus the web dashboard foundation (layout, auth, routing). It also establishes the domain layer patterns for the new `property-management` domain that all future Sprint 3+ features (Leases, Maintenance, Payments) will follow.

**Goal:** A property manager can sign in to the web dashboard and create, view, edit, and delete properties — including photo uploads and status transitions. The API has full CRUD endpoints for Properties with business rule enforcement. The web dashboard has a working layout with sidebar navigation, auth flow, and polished property list/detail/create/edit pages.

**Why Properties first:** Properties are the root entity. Leases reference properties. Maintenance requests reference properties. Payments reference leases which reference properties. Building Properties first validates the full vertical stack (domain entity → use case → repository → mapper → controller → presenter → web UI) before the more complex entities are added.

---

## What Exists (from Sprint 1)

| Layer | What's Done |
|-------|-------------|
| **Shared package** | All enums, types, DTOs, Zod validation schemas, constants (status transitions, error messages, display labels) |
| **Prisma schema** | Property model with all fields, indexes, and Employee relation |
| **API architecture** | DDD + Clean Architecture: Entity → Use Case → Repository (abstract) → Prisma implementation → Controller → Presenter |
| **API auth** | Better Auth with `EnhancedAuthGuard` (global), `EmployeeOnlyGuard`, `@CurrentUser()` decorator |
| **Web app** | Bare Next.js 14 scaffold with `@leaselink/shared` dependency — no pages, no layout, no UI library |
| **Mobile app** | Complete auth + documents + notifications — no property features yet |

## What's New in This Sprint

| Layer | What's Built |
|-------|-------------|
| **API** | Property domain entity, 7 use cases, repository, mapper, 7 controllers, presenter, error classes, unit tests |
| **Web** | shadcn/ui + Tailwind setup, auth pages (sign-in, forgot-password), dashboard layout (sidebar + top nav), property list page, property detail page, create property form, edit property form, photo upload |
| **Mobile** | No mobile work this sprint (Properties are manager-only) |

---

## Task 1: Property Domain Layer (Backend Agent)

### Objective

Create the Property domain entity, value objects, repository interface, error classes, and all 7 use cases following the existing DDD patterns established by the Client/Document domains.

### Dependencies

- Sprint 1 complete (shared package enums, Prisma schema)

### Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/domain/property-management/enterprise/entities/property.ts` | Property domain entity |
| `apps/api/src/domain/property-management/enterprise/entities/value-objects/property-status.ts` | PropertyStatus value object |
| `apps/api/src/domain/property-management/enterprise/entities/value-objects/property-type.ts` | PropertyType value object |
| `apps/api/src/domain/property-management/application/repositories/properties-repository.ts` | Abstract repository interface |
| `apps/api/src/domain/property-management/application/use-cases/create-property.ts` | Create property use case |
| `apps/api/src/domain/property-management/application/use-cases/get-property-by-id.ts` | Get single property use case |
| `apps/api/src/domain/property-management/application/use-cases/get-properties-by-manager.ts` | List properties with filtering/pagination |
| `apps/api/src/domain/property-management/application/use-cases/update-property.ts` | Update property details use case |
| `apps/api/src/domain/property-management/application/use-cases/update-property-status.ts` | Status transition use case (separate due to business rules) |
| `apps/api/src/domain/property-management/application/use-cases/delete-property.ts` | Delete property use case |
| `apps/api/src/domain/property-management/application/use-cases/upload-property-photos.ts` | Photo upload use case |
| `apps/api/src/domain/property-management/application/use-cases/errors/property-not-found-error.ts` | Error class |
| `apps/api/src/domain/property-management/application/use-cases/errors/property-has-active-lease-error.ts` | Error class |
| `apps/api/src/domain/property-management/application/use-cases/errors/invalid-property-status-transition-error.ts` | Error class |

### Detailed Requirements

#### Property Entity

Follow the exact pattern of `Client` entity: extends `Entity<PropertyProps>`, has getters/setters with `touch()`, static `create()` factory. Properties do NOT extend `Person` — they have their own props interface.

**`apps/api/src/domain/property-management/enterprise/entities/property.ts`**
```typescript
import { Entity } from '@/core/entities/entity'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Optional } from '@/core/types/optional'
import { PropertyStatus, PropertyStatusType } from './value-objects/property-status'
import { PropertyType, PropertyTypeValue } from './value-objects/property-type'

export interface PropertyProps {
  managerId: UniqueEntityId
  address: string
  city: string
  state: string
  zipCode: string
  propertyType: PropertyType
  bedrooms: number
  bathrooms: number
  sqft: number | null
  rentAmount: number
  status: PropertyStatus
  description: string | null
  photos: string[]
  createdAt: Date
  updatedAt?: Date | null
}

export class Property extends Entity<PropertyProps> {
  get managerId() {
    return this.props.managerId
  }

  get address() {
    return this.props.address
  }
  set address(value: string) {
    this.props.address = value
    this.touch()
  }

  get city() {
    return this.props.city
  }
  set city(value: string) {
    this.props.city = value
    this.touch()
  }

  get state() {
    return this.props.state
  }
  set state(value: string) {
    this.props.state = value
    this.touch()
  }

  get zipCode() {
    return this.props.zipCode
  }
  set zipCode(value: string) {
    this.props.zipCode = value
    this.touch()
  }

  get propertyType(): PropertyTypeValue {
    return this.props.propertyType.value
  }
  set propertyType(value: PropertyTypeValue) {
    this.props.propertyType = PropertyType.create(value)
    this.touch()
  }

  get bedrooms() {
    return this.props.bedrooms
  }
  set bedrooms(value: number) {
    this.props.bedrooms = value
    this.touch()
  }

  get bathrooms() {
    return this.props.bathrooms
  }
  set bathrooms(value: number) {
    this.props.bathrooms = value
    this.touch()
  }

  get sqft() {
    return this.props.sqft
  }
  set sqft(value: number | null) {
    this.props.sqft = value
    this.touch()
  }

  get rentAmount() {
    return this.props.rentAmount
  }
  set rentAmount(value: number) {
    this.props.rentAmount = value
    this.touch()
  }

  get status(): PropertyStatusType {
    return this.props.status.value
  }
  set status(value: PropertyStatusType) {
    this.props.status = PropertyStatus.create(value)
    this.touch()
  }

  get description() {
    return this.props.description
  }
  set description(value: string | null) {
    this.props.description = value
    this.touch()
  }

  get photos() {
    return this.props.photos
  }
  set photos(value: string[]) {
    this.props.photos = value
    this.touch()
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  private touch() {
    this.props.updatedAt = new Date()
  }

  static create(
    props: Optional<PropertyProps, 'createdAt' | 'status' | 'photos' | 'description' | 'sqft'>,
    id?: UniqueEntityId,
  ) {
    const property = new Property(
      {
        ...props,
        status:
          props?.status instanceof PropertyStatus
            ? props.status
            : PropertyStatus.create(props?.status ?? 'VACANT'),
        photos: props?.photos ?? [],
        description: props?.description ?? null,
        sqft: props?.sqft ?? null,
        createdAt: props?.createdAt ?? new Date(),
      },
      id,
    )
    return property
  }
}
```

#### PropertyStatus Value Object

Follow the exact pattern of `ClientStatus`:

**`apps/api/src/domain/property-management/enterprise/entities/value-objects/property-status.ts`**
```typescript
import { ValueObject } from '@/core/entities/value-object'

export type PropertyStatusType = 'VACANT' | 'LISTED' | 'OCCUPIED' | 'MAINTENANCE'

interface PropertyStatusProps {
  value: PropertyStatusType
}

export class PropertyStatus extends ValueObject<PropertyStatusProps> {
  private static ALLOWED_STATUSES: PropertyStatusType[] = [
    'VACANT',
    'LISTED',
    'OCCUPIED',
    'MAINTENANCE',
  ]

  private constructor(props: PropertyStatusProps) {
    super(props)
  }

  static create(status: string): PropertyStatus {
    if (!PropertyStatus.ALLOWED_STATUSES.includes(status as PropertyStatusType)) {
      throw new Error(`Invalid property status: ${status}`)
    }
    return new PropertyStatus({ value: status as PropertyStatusType })
  }

  get value(): PropertyStatusType {
    return this.props.value
  }

  static values(): PropertyStatusType[] {
    return PropertyStatus.ALLOWED_STATUSES
  }
}
```

#### PropertyType Value Object

**`apps/api/src/domain/property-management/enterprise/entities/value-objects/property-type.ts`**
```typescript
import { ValueObject } from '@/core/entities/value-object'

export type PropertyTypeValue = 'APARTMENT' | 'HOUSE' | 'CONDO' | 'TOWNHOUSE' | 'STUDIO'

interface PropertyTypeProps {
  value: PropertyTypeValue
}

export class PropertyType extends ValueObject<PropertyTypeProps> {
  private static ALLOWED_TYPES: PropertyTypeValue[] = [
    'APARTMENT',
    'HOUSE',
    'CONDO',
    'TOWNHOUSE',
    'STUDIO',
  ]

  private constructor(props: PropertyTypeProps) {
    super(props)
  }

  static create(type: string): PropertyType {
    if (!PropertyType.ALLOWED_TYPES.includes(type as PropertyTypeValue)) {
      throw new Error(`Invalid property type: ${type}`)
    }
    return new PropertyType({ value: type as PropertyTypeValue })
  }

  get value(): PropertyTypeValue {
    return this.props.value
  }

  static values(): PropertyTypeValue[] {
    return PropertyType.ALLOWED_TYPES
  }
}
```

#### Repository Interface

**`apps/api/src/domain/property-management/application/repositories/properties-repository.ts`**
```typescript
import type { Property } from '@/domain/property-management/enterprise/entities/property'

export interface PropertiesFilterParams {
  managerId: string
  status?: string
  search?: string
  page: number
  pageSize: number
}

export interface PropertiesPaginatedResult {
  properties: Property[]
  totalCount: number
}

export abstract class PropertiesRepository {
  abstract create(property: Property): Promise<void>
  abstract findById(propertyId: string): Promise<Property | null>
  abstract findManyByManager(params: PropertiesFilterParams): Promise<PropertiesPaginatedResult>
  abstract update(property: Property): Promise<Property>
  abstract delete(propertyId: string): Promise<void>
  abstract hasActiveLease(propertyId: string): Promise<boolean>
}
```

#### Error Classes

Follow the pattern of `ClientAlreadyExistsError` — extend `Error`, implement `UseCaseError`.

**`apps/api/src/domain/property-management/application/use-cases/errors/property-not-found-error.ts`**
```typescript
import { UseCaseError } from '@/core/errors/use-case-error'

export class PropertyNotFoundError extends Error implements UseCaseError {
  constructor(propertyId: string) {
    super(`Property with ID "${propertyId}" not found.`)
  }
}
```

**`apps/api/src/domain/property-management/application/use-cases/errors/property-has-active-lease-error.ts`**
```typescript
import { UseCaseError } from '@/core/errors/use-case-error'

export class PropertyHasActiveLeaseError extends Error implements UseCaseError {
  constructor(propertyId: string) {
    super(`Property "${propertyId}" cannot be deleted or set to VACANT while it has an active lease.`)
  }
}
```

**`apps/api/src/domain/property-management/application/use-cases/errors/invalid-property-status-transition-error.ts`**
```typescript
import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidPropertyStatusTransitionError extends Error implements UseCaseError {
  constructor(from: string, to: string) {
    super(`Invalid property status transition from "${from}" to "${to}".`)
  }
}
```

#### Use Cases

All use cases follow the established pattern:
- `@Injectable()` decorator
- Constructor injection of repositories
- `execute()` method returns `Either<Error, SuccessPayload>`
- Request interface defines input
- Response type alias defines output

**Use Case 1: CreateProperty**

**`apps/api/src/domain/property-management/application/use-cases/create-property.ts`**
```typescript
import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Property } from '../../enterprise/entities/property'
import { PropertyType } from '../../enterprise/entities/value-objects/property-type'
import { PropertiesRepository } from '../repositories/properties-repository'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export interface CreatePropertyUseCaseRequest {
  managerId: string
  address: string
  city: string
  state: string
  zipCode: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  sqft?: number
  rentAmount: number
  description?: string
}

type CreatePropertyUseCaseResponse = Either<
  never,
  { property: Property }
>

@Injectable()
export class CreatePropertyUseCase {
  constructor(private propertiesRepository: PropertiesRepository) {}

  async execute(request: CreatePropertyUseCaseRequest): Promise<CreatePropertyUseCaseResponse> {
    const property = Property.create({
      managerId: new UniqueEntityId(request.managerId),
      address: request.address,
      city: request.city,
      state: request.state,
      zipCode: request.zipCode,
      propertyType: PropertyType.create(request.propertyType),
      bedrooms: request.bedrooms,
      bathrooms: request.bathrooms,
      sqft: request.sqft ?? null,
      rentAmount: request.rentAmount,
      description: request.description ?? null,
    })

    await this.propertiesRepository.create(property)

    return right({ property })
  }
}
```

**Use Case 2: GetPropertyById**

**`apps/api/src/domain/property-management/application/use-cases/get-property-by-id.ts`**
```typescript
import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Property } from '../../enterprise/entities/property'
import { PropertiesRepository } from '../repositories/properties-repository'
import { PropertyNotFoundError } from './errors/property-not-found-error'

export interface GetPropertyByIdUseCaseRequest {
  propertyId: string
  managerId: string
}

type GetPropertyByIdUseCaseResponse = Either<
  PropertyNotFoundError,
  { property: Property }
>

@Injectable()
export class GetPropertyByIdUseCase {
  constructor(private propertiesRepository: PropertiesRepository) {}

  async execute({ propertyId, managerId }: GetPropertyByIdUseCaseRequest): Promise<GetPropertyByIdUseCaseResponse> {
    const property = await this.propertiesRepository.findById(propertyId)

    if (!property || property.managerId.toString() !== managerId) {
      return left(new PropertyNotFoundError(propertyId))
    }

    return right({ property })
  }
}
```

**Use Case 3: GetPropertiesByManager**

**`apps/api/src/domain/property-management/application/use-cases/get-properties-by-manager.ts`**
```typescript
import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Property } from '../../enterprise/entities/property'
import { PropertiesRepository } from '../repositories/properties-repository'

export interface GetPropertiesByManagerUseCaseRequest {
  managerId: string
  status?: string
  search?: string
  page: number
  pageSize: number
}

type GetPropertiesByManagerUseCaseResponse = Either<
  never,
  {
    properties: Property[]
    totalCount: number
  }
>

@Injectable()
export class GetPropertiesByManagerUseCase {
  constructor(private propertiesRepository: PropertiesRepository) {}

  async execute(request: GetPropertiesByManagerUseCaseRequest): Promise<GetPropertiesByManagerUseCaseResponse> {
    const { properties, totalCount } = await this.propertiesRepository.findManyByManager({
      managerId: request.managerId,
      status: request.status,
      search: request.search,
      page: request.page,
      pageSize: request.pageSize,
    })

    return right({ properties, totalCount })
  }
}
```

**Use Case 4: UpdateProperty**

**`apps/api/src/domain/property-management/application/use-cases/update-property.ts`**
```typescript
import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Property } from '../../enterprise/entities/property'
import { PropertiesRepository } from '../repositories/properties-repository'
import { PropertyNotFoundError } from './errors/property-not-found-error'

export interface UpdatePropertyUseCaseRequest {
  propertyId: string
  managerId: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  sqft?: number | null
  rentAmount?: number
  description?: string | null
}

type UpdatePropertyUseCaseResponse = Either<
  PropertyNotFoundError,
  { property: Property }
>

@Injectable()
export class UpdatePropertyUseCase {
  constructor(private propertiesRepository: PropertiesRepository) {}

  async execute(request: UpdatePropertyUseCaseRequest): Promise<UpdatePropertyUseCaseResponse> {
    const property = await this.propertiesRepository.findById(request.propertyId)

    if (!property || property.managerId.toString() !== request.managerId) {
      return left(new PropertyNotFoundError(request.propertyId))
    }

    if (request.address !== undefined) property.address = request.address
    if (request.city !== undefined) property.city = request.city
    if (request.state !== undefined) property.state = request.state
    if (request.zipCode !== undefined) property.zipCode = request.zipCode
    if (request.propertyType !== undefined) property.propertyType = request.propertyType as any
    if (request.bedrooms !== undefined) property.bedrooms = request.bedrooms
    if (request.bathrooms !== undefined) property.bathrooms = request.bathrooms
    if (request.sqft !== undefined) property.sqft = request.sqft
    if (request.rentAmount !== undefined) property.rentAmount = request.rentAmount
    if (request.description !== undefined) property.description = request.description

    const updated = await this.propertiesRepository.update(property)

    return right({ property: updated })
  }
}
```

**Use Case 5: UpdatePropertyStatus**

This is separate from `UpdateProperty` because status transitions have complex business rules: valid transitions are enforced via `PROPERTY_STATUS_TRANSITIONS`, and the transition OCCUPIED → VACANT requires checking for active leases.

**`apps/api/src/domain/property-management/application/use-cases/update-property-status.ts`**
```typescript
import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Property } from '../../enterprise/entities/property'
import { PropertiesRepository } from '../repositories/properties-repository'
import { PropertyNotFoundError } from './errors/property-not-found-error'
import { InvalidPropertyStatusTransitionError } from './errors/invalid-property-status-transition-error'
import { PropertyHasActiveLeaseError } from './errors/property-has-active-lease-error'
import {
  PROPERTY_STATUS_TRANSITIONS,
  isValidTransition,
} from '@leaselink/shared'

export interface UpdatePropertyStatusUseCaseRequest {
  propertyId: string
  managerId: string
  status: string
}

type UpdatePropertyStatusUseCaseResponse = Either<
  PropertyNotFoundError | InvalidPropertyStatusTransitionError | PropertyHasActiveLeaseError,
  { property: Property }
>

@Injectable()
export class UpdatePropertyStatusUseCase {
  constructor(private propertiesRepository: PropertiesRepository) {}

  async execute(request: UpdatePropertyStatusUseCaseRequest): Promise<UpdatePropertyStatusUseCaseResponse> {
    const property = await this.propertiesRepository.findById(request.propertyId)

    if (!property || property.managerId.toString() !== request.managerId) {
      return left(new PropertyNotFoundError(request.propertyId))
    }

    const currentStatus = property.status
    const newStatus = request.status

    if (!isValidTransition(PROPERTY_STATUS_TRANSITIONS, currentStatus as any, newStatus as any)) {
      return left(new InvalidPropertyStatusTransitionError(currentStatus, newStatus))
    }

    // Business rule: OCCUPIED -> VACANT only when no active lease
    if (currentStatus === 'OCCUPIED' && newStatus === 'VACANT') {
      const hasActiveLease = await this.propertiesRepository.hasActiveLease(request.propertyId)
      if (hasActiveLease) {
        return left(new PropertyHasActiveLeaseError(request.propertyId))
      }
    }

    property.status = newStatus as any

    const updated = await this.propertiesRepository.update(property)

    return right({ property: updated })
  }
}
```

**Use Case 6: DeleteProperty**

**`apps/api/src/domain/property-management/application/use-cases/delete-property.ts`**
```typescript
import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { PropertiesRepository } from '../repositories/properties-repository'
import { PropertyNotFoundError } from './errors/property-not-found-error'
import { PropertyHasActiveLeaseError } from './errors/property-has-active-lease-error'

export interface DeletePropertyUseCaseRequest {
  propertyId: string
  managerId: string
}

type DeletePropertyUseCaseResponse = Either<
  PropertyNotFoundError | PropertyHasActiveLeaseError,
  null
>

@Injectable()
export class DeletePropertyUseCase {
  constructor(private propertiesRepository: PropertiesRepository) {}

  async execute({ propertyId, managerId }: DeletePropertyUseCaseRequest): Promise<DeletePropertyUseCaseResponse> {
    const property = await this.propertiesRepository.findById(propertyId)

    if (!property || property.managerId.toString() !== managerId) {
      return left(new PropertyNotFoundError(propertyId))
    }

    const hasActiveLease = await this.propertiesRepository.hasActiveLease(propertyId)
    if (hasActiveLease) {
      return left(new PropertyHasActiveLeaseError(propertyId))
    }

    await this.propertiesRepository.delete(propertyId)

    return right(null)
  }
}
```

**Use Case 7: UploadPropertyPhotos**

**`apps/api/src/domain/property-management/application/use-cases/upload-property-photos.ts`**
```typescript
import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { Property } from '../../enterprise/entities/property'
import { PropertiesRepository } from '../repositories/properties-repository'
import { PropertyNotFoundError } from './errors/property-not-found-error'
import { BlobStorageRepository } from '@/domain/document/application/repositories/blob-storage-repository'
import { MAX_PROPERTY_PHOTOS } from '@leaselink/shared'

export interface UploadPropertyPhotosUseCaseRequest {
  propertyId: string
  managerId: string
  files: Array<{
    buffer: Buffer
    originalName: string
    mimeType: string
  }>
}

type UploadPropertyPhotosUseCaseResponse = Either<
  PropertyNotFoundError | Error,
  { property: Property }
>

@Injectable()
export class UploadPropertyPhotosUseCase {
  constructor(
    private propertiesRepository: PropertiesRepository,
    private blobStorageRepository: BlobStorageRepository,
  ) {}

  async execute(request: UploadPropertyPhotosUseCaseRequest): Promise<UploadPropertyPhotosUseCaseResponse> {
    const property = await this.propertiesRepository.findById(request.propertyId)

    if (!property || property.managerId.toString() !== request.managerId) {
      return left(new PropertyNotFoundError(request.propertyId))
    }

    const currentCount = property.photos.length
    if (currentCount + request.files.length > MAX_PROPERTY_PHOTOS) {
      return left(new Error(`Cannot exceed ${MAX_PROPERTY_PHOTOS} photos per property. Current: ${currentCount}, attempting to add: ${request.files.length}.`))
    }

    const uploadedKeys: string[] = []

    for (const file of request.files) {
      const blobKey = `properties/${request.propertyId}/photos/${crypto.randomUUID()}-${file.originalName}`
      await this.blobStorageRepository.upload(blobKey, file.buffer, file.mimeType)
      uploadedKeys.push(blobKey)
    }

    property.photos = [...property.photos, ...uploadedKeys]
    const updated = await this.propertiesRepository.update(property)

    return right({ property: updated })
  }
}
```

Note: The `BlobStorageRepository` interface already exists at `apps/api/src/domain/document/application/repositories/blob-storage-repository.ts` — verify the exact interface and method signatures. The upload use case should use the same blob storage abstraction that documents use.

### Acceptance Criteria

- [ ] `Property` entity has all fields from the Prisma schema, with getters/setters and `touch()`
- [ ] `PropertyStatus` and `PropertyType` value objects follow `ClientStatus` pattern exactly
- [ ] `PropertiesRepository` abstract class defines: `create`, `findById`, `findManyByManager`, `update`, `delete`, `hasActiveLease`
- [ ] 7 use cases exist, each returning `Either<Error, Success>`
- [ ] `UpdatePropertyStatus` validates transitions using `PROPERTY_STATUS_TRANSITIONS` from `@leaselink/shared`
- [ ] `UpdatePropertyStatus` checks `hasActiveLease` when transitioning OCCUPIED → VACANT
- [ ] `DeleteProperty` checks `hasActiveLease` before deletion
- [ ] `GetPropertyById` and all mutation use cases verify `managerId` ownership
- [ ] `UploadPropertyPhotos` enforces `MAX_PROPERTY_PHOTOS` limit
- [ ] 3 error classes exist: `PropertyNotFoundError`, `PropertyHasActiveLeaseError`, `InvalidPropertyStatusTransitionError`
- [ ] All files pass `tsc --noEmit`

### Test Cases

Create test files alongside each use case (e.g., `create-property.spec.ts`).

#### Test Infrastructure Required

Create these test helpers:

**`test/factories/make-property.ts`**
```typescript
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Property, PropertyProps } from '@/domain/property-management/enterprise/entities/property'
import { PropertyType } from '@/domain/property-management/enterprise/entities/value-objects/property-type'
import { PropertyStatus } from '@/domain/property-management/enterprise/entities/value-objects/property-status'
import { faker } from '@faker-js/faker'

export const makeProperty = (
  override: Partial<PropertyProps> = {},
  id?: UniqueEntityId,
) => {
  return Property.create(
    {
      managerId: new UniqueEntityId(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
      propertyType: PropertyType.create('APARTMENT'),
      bedrooms: faker.number.int({ min: 1, max: 5 }),
      bathrooms: faker.number.float({ min: 1, max: 3, multipleOf: 0.5 }),
      sqft: faker.number.int({ min: 500, max: 3000 }),
      rentAmount: faker.number.float({ min: 800, max: 5000, multipleOf: 0.01 }),
      description: faker.lorem.paragraph(),
      ...override,
    },
    id,
  )
}
```

**`test/repositories/prisma/in-memory-properties-repository.ts`**
```typescript
import type {
  PropertiesRepository,
  PropertiesFilterParams,
  PropertiesPaginatedResult,
} from '@/domain/property-management/application/repositories/properties-repository'
import type { Property } from '@/domain/property-management/enterprise/entities/property'

export class InMemoryPropertiesRepository implements PropertiesRepository {
  public items: Property[] = []
  public activeLeasePropertyIds: Set<string> = new Set()

  async create(property: Property): Promise<void> {
    this.items.push(property)
  }

  async findById(propertyId: string): Promise<Property | null> {
    return this.items.find((p) => p.id.toString() === propertyId) ?? null
  }

  async findManyByManager(params: PropertiesFilterParams): Promise<PropertiesPaginatedResult> {
    let filtered = this.items.filter(
      (p) => p.managerId.toString() === params.managerId,
    )

    if (params.status) {
      filtered = filtered.filter((p) => p.status === params.status)
    }

    if (params.search) {
      const search = params.search.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.address.toLowerCase().includes(search) ||
          p.city.toLowerCase().includes(search),
      )
    }

    const totalCount = filtered.length
    const start = (params.page - 1) * params.pageSize
    const paginated = filtered.slice(start, start + params.pageSize)

    return { properties: paginated, totalCount }
  }

  async update(property: Property): Promise<Property> {
    const index = this.items.findIndex(
      (p) => p.id.toString() === property.id.toString(),
    )
    if (index !== -1) {
      this.items[index] = property
    }
    return property
  }

  async delete(propertyId: string): Promise<void> {
    this.items = this.items.filter((p) => p.id.toString() !== propertyId)
  }

  async hasActiveLease(propertyId: string): Promise<boolean> {
    return this.activeLeasePropertyIds.has(propertyId)
  }
}
```

#### CreateProperty Tests

| Test | Setup | Expected |
|------|-------|----------|
| should create a property | Call `execute()` with valid data | `isRight()`, property in repository |
| should default status to VACANT | Create without explicit status | `property.status === 'VACANT'` |
| should default photos to empty array | Create without photos | `property.photos.length === 0` |

#### GetPropertyById Tests

| Test | Setup | Expected |
|------|-------|----------|
| should get a property by id | Create property, fetch by id | `isRight()`, correct property returned |
| should return error if not found | Fetch non-existent id | `isLeft()`, `PropertyNotFoundError` |
| should return error if manager doesn't own it | Create with manager A, fetch as manager B | `isLeft()`, `PropertyNotFoundError` |

#### GetPropertiesByManager Tests

| Test | Setup | Expected |
|------|-------|----------|
| should list properties for manager | Create 3 properties for manager A, 2 for manager B | Manager A gets 3 |
| should filter by status | Create VACANT and OCCUPIED properties | Filter by VACANT returns only VACANT |
| should search by address | Create properties with known addresses | Search matches correct properties |
| should paginate correctly | Create 5 properties, page=1, pageSize=2 | Returns 2 properties, totalCount=5 |

#### UpdateProperty Tests

| Test | Setup | Expected |
|------|-------|----------|
| should update property fields | Create, then update address | `isRight()`, address updated |
| should only update provided fields | Update only `rentAmount` | Other fields unchanged |
| should return error if not found | Update non-existent id | `isLeft()`, `PropertyNotFoundError` |
| should return error if not owner | Create as manager A, update as manager B | `isLeft()`, `PropertyNotFoundError` |

#### UpdatePropertyStatus Tests

| Test | Setup | Expected |
|------|-------|----------|
| should transition VACANT → LISTED | Property with VACANT status | `isRight()`, status is LISTED |
| should transition VACANT → OCCUPIED | Property with VACANT status | `isRight()`, status is OCCUPIED |
| should reject VACANT → MAINTENANCE | Property with VACANT status | `isLeft()`, `InvalidPropertyStatusTransitionError` |
| should reject OCCUPIED → VACANT with active lease | Property OCCUPIED, `activeLeasePropertyIds.add(id)` | `isLeft()`, `PropertyHasActiveLeaseError` |
| should allow OCCUPIED → VACANT without lease | Property OCCUPIED, no active lease | `isRight()`, status is VACANT |
| should transition OCCUPIED → MAINTENANCE | Property OCCUPIED | `isRight()`, status is MAINTENANCE |
| should return error if not found | Non-existent property | `isLeft()`, `PropertyNotFoundError` |

#### DeleteProperty Tests

| Test | Setup | Expected |
|------|-------|----------|
| should delete property | Create, then delete | `isRight()`, removed from repository |
| should reject if has active lease | `activeLeasePropertyIds.add(id)` | `isLeft()`, `PropertyHasActiveLeaseError` |
| should return error if not found | Delete non-existent | `isLeft()`, `PropertyNotFoundError` |
| should return error if not owner | Create as A, delete as B | `isLeft()`, `PropertyNotFoundError` |

#### UploadPropertyPhotos Tests

| Test | Setup | Expected |
|------|-------|----------|
| should upload photos | Property exists, 2 files | `isRight()`, `property.photos.length === 2` |
| should append to existing photos | Property with 1 existing photo, upload 2 more | `property.photos.length === 3` |
| should reject if exceeds limit | Property with 19 photos, upload 2 | `isLeft()`, error about max photos |
| should return error if not found | Non-existent property | `isLeft()`, `PropertyNotFoundError` |

---

## Task 2: Property Infrastructure Layer (Backend Agent)

### Objective

Create the Prisma repository implementation, mapper, HTTP controllers, presenter, Swagger DTOs, and register everything in the NestJS modules.

### Dependencies

- Task 1 (domain layer must exist)

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/api/src/infra/database/prisma/mappers/prisma-property-mapper.ts` | Create | Map between Prisma Property and domain Property |
| `apps/api/src/infra/database/prisma/repositories/prisma-properties-repository.ts` | Create | Prisma implementation of PropertiesRepository |
| `apps/api/src/infra/http/controllers/create-property/create-property.controller.ts` | Create | POST /properties |
| `apps/api/src/infra/http/controllers/get-properties/get-properties.controller.ts` | Create | GET /properties |
| `apps/api/src/infra/http/controllers/get-property-by-id/get-property-by-id.controller.ts` | Create | GET /properties/:id |
| `apps/api/src/infra/http/controllers/update-property/update-property.controller.ts` | Create | PUT /properties/:id |
| `apps/api/src/infra/http/controllers/update-property-status/update-property-status.controller.ts` | Create | PATCH /properties/:id/status |
| `apps/api/src/infra/http/controllers/delete-property/delete-property.controller.ts` | Create | DELETE /properties/:id |
| `apps/api/src/infra/http/controllers/upload-property-photos/upload-property-photos.controller.ts` | Create | POST /properties/:id/photos |
| `apps/api/src/infra/http/presenters/http-property-presenter.ts` | Create | Property → JSON response |
| `apps/api/src/infra/http/DTOs/property/create-property-request-dto.ts` | Create | Swagger DTO |
| `apps/api/src/infra/http/DTOs/property/update-property-request-dto.ts` | Create | Swagger DTO |
| `apps/api/src/infra/http/DTOs/property/update-property-status-request-dto.ts` | Create | Swagger DTO |
| `apps/api/src/infra/http/DTOs/property/property-response-dto.ts` | Create | Swagger response DTO |
| `apps/api/src/infra/http/DTOs/property/property-list-response-dto.ts` | Create | Swagger paginated response DTO |
| `apps/api/src/infra/database/database.module.ts` | Modify | Register PropertiesRepository |
| `apps/api/src/infra/http/http.module.ts` | Modify | Register controllers and use cases |

### Detailed Requirements

#### Prisma Mapper

**`apps/api/src/infra/database/prisma/mappers/prisma-property-mapper.ts`**

Follow the `PrismaClientMapper` pattern exactly.

```typescript
import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { Property } from '@/domain/property-management/enterprise/entities/property'
import { PropertyStatus } from '@/domain/property-management/enterprise/entities/value-objects/property-status'
import { PropertyType } from '@/domain/property-management/enterprise/entities/value-objects/property-type'
import { Prisma, Property as PrismaProperty } from '@prisma/client'

export class PrismaPropertyMapper {
  static toDomain(raw: PrismaProperty): Property {
    return Property.create(
      {
        managerId: new UniqueEntityId(raw.managerId),
        address: raw.address,
        city: raw.city,
        state: raw.state,
        zipCode: raw.zipCode,
        propertyType: PropertyType.create(raw.propertyType),
        bedrooms: raw.bedrooms,
        bathrooms: raw.bathrooms,
        sqft: raw.sqft,
        rentAmount: raw.rentAmount,
        status: PropertyStatus.create(raw.status),
        description: raw.description,
        photos: raw.photos,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityId(raw.id),
    )
  }

  static toPrisma(property: Property): Prisma.PropertyUncheckedCreateInput {
    return {
      id: property.id.toString(),
      managerId: property.managerId.toString(),
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      rentAmount: property.rentAmount,
      status: property.status,
      description: property.description,
      photos: property.photos,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt ?? undefined,
    }
  }
}
```

#### Prisma Repository

**`apps/api/src/infra/database/prisma/repositories/prisma-properties-repository.ts`**

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { PrismaPropertyMapper } from '../mappers/prisma-property-mapper'
import type {
  PropertiesRepository,
  PropertiesFilterParams,
  PropertiesPaginatedResult,
} from '@/domain/property-management/application/repositories/properties-repository'
import type { Property } from '@/domain/property-management/enterprise/entities/property'
import { Prisma } from '@prisma/client'

@Injectable()
export class PrismaPropertiesRepository implements PropertiesRepository {
  constructor(private prisma: PrismaService) {}

  async create(property: Property): Promise<void> {
    const data = PrismaPropertyMapper.toPrisma(property)
    await this.prisma.property.create({ data })
  }

  async findById(propertyId: string): Promise<Property | null> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    })
    if (!property) return null
    return PrismaPropertyMapper.toDomain(property)
  }

  async findManyByManager(params: PropertiesFilterParams): Promise<PropertiesPaginatedResult> {
    const where: Prisma.PropertyWhereInput = {
      managerId: params.managerId,
    }

    if (params.status) {
      where.status = params.status as any
    }

    if (params.search) {
      where.OR = [
        { address: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    const [properties, totalCount] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.property.count({ where }),
    ])

    return {
      properties: properties.map(PrismaPropertyMapper.toDomain),
      totalCount,
    }
  }

  async update(property: Property): Promise<Property> {
    const data = PrismaPropertyMapper.toPrisma(property)
    const updated = await this.prisma.property.update({
      where: { id: property.id.toString() },
      data,
    })
    return PrismaPropertyMapper.toDomain(updated)
  }

  async delete(propertyId: string): Promise<void> {
    await this.prisma.property.delete({
      where: { id: propertyId },
    })
  }

  async hasActiveLease(propertyId: string): Promise<boolean> {
    const count = await this.prisma.lease.count({
      where: {
        propertyId,
        status: 'ACTIVE',
      },
    })
    return count > 0
  }
}
```

#### HTTP Presenter

**`apps/api/src/infra/http/presenters/http-property-presenter.ts`**

```typescript
import { Property } from '@/domain/property-management/enterprise/entities/property'

export interface PropertyHttpResponse {
  id: string
  managerId: string
  address: string
  city: string
  state: string
  zipCode: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  sqft: number | null
  rentAmount: number
  status: string
  description: string | null
  photos: string[]
  createdAt: string
  updatedAt: string | null
}

export class HttpPropertyPresenter {
  static toHTTP(property: Property): PropertyHttpResponse {
    return {
      id: property.id.toString(),
      managerId: property.managerId.toString(),
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      propertyType: property.propertyType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      rentAmount: property.rentAmount,
      status: property.status,
      description: property.description,
      photos: property.photos,
      createdAt: property.createdAt instanceof Date
        ? property.createdAt.toISOString()
        : property.createdAt,
      updatedAt: property.updatedAt
        ? property.updatedAt instanceof Date
          ? property.updatedAt.toISOString()
          : property.updatedAt
        : null,
    }
  }

  static toHTTPList(properties: Property[]): PropertyHttpResponse[] {
    return properties.map(HttpPropertyPresenter.toHTTP)
  }
}
```

#### Controllers

All controllers follow these patterns from the existing codebase:
- `@ApiTags('Properties')` for Swagger grouping
- `@Controller('/properties')` base path
- `@UseGuards(EmployeeOnlyGuard)` since only managers access properties
- `@ApiBearerAuth()` for Swagger auth indicator
- `@CurrentUser() user: HttpUserResponse` to get the authenticated user
- Zod validation via `new ZodValidationPipe(schema)` — import schemas from `@leaselink/shared` instead of defining inline
- `errorMap` dictionary pattern for mapping domain errors to HTTP exceptions
- Return Either pattern: `isLeft()` → throw exception, `isRight()` → return response

**Controller 1: POST /properties — CreatePropertyController**

```typescript
// File: apps/api/src/infra/http/controllers/create-property/create-property.controller.ts
import { CreatePropertyUseCase } from '@/domain/property-management/application/use-cases/create-property'
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { createPropertySchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPropertyPresenter } from '../../presenters/http-property-presenter'
import { CreatePropertyRequestDTO } from '../../DTOs/property/create-property-request-dto'
import { z } from 'zod'

type CreatePropertyBody = z.infer<typeof createPropertySchema>

const bodyValidationPipe = new ZodValidationPipe(createPropertySchema)

@ApiTags('Properties')
@Controller('/properties')
export class CreatePropertyController {
  constructor(private createProperty: CreatePropertyUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(EmployeeOnlyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new property' })
  @ApiBody({ type: CreatePropertyRequestDTO })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Property created' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  async handle(
    @CurrentUser() user: HttpUserResponse,
    @Body(bodyValidationPipe) body: CreatePropertyBody,
  ) {
    const response = await this.createProperty.execute({
      managerId: user.id,
      ...body,
    })

    if (response.isLeft()) {
      throw response.value
    }

    return {
      property: HttpPropertyPresenter.toHTTP(response.value.property),
    }
  }
}
```

**Controller 2: GET /properties — GetPropertiesController**

```typescript
// File: apps/api/src/infra/http/controllers/get-properties/get-properties.controller.ts
import { GetPropertiesByManagerUseCase } from '@/domain/property-management/application/use-cases/get-properties-by-manager'
import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { propertyFilterSchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPropertyPresenter } from '../../presenters/http-property-presenter'
import { z } from 'zod'

type PropertyFilterQuery = z.infer<typeof propertyFilterSchema>

const queryValidationPipe = new ZodValidationPipe(propertyFilterSchema)

@ApiTags('Properties')
@Controller('/properties')
export class GetPropertiesController {
  constructor(private getProperties: GetPropertiesByManagerUseCase) {}

  @Get()
  @UseGuards(EmployeeOnlyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List properties for the authenticated manager' })
  @ApiQuery({ name: 'status', required: false, enum: ['VACANT', 'LISTED', 'OCCUPIED', 'MAINTENANCE'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated list of properties' })
  async handle(
    @CurrentUser() user: HttpUserResponse,
    @Query(queryValidationPipe) query: PropertyFilterQuery,
  ) {
    const response = await this.getProperties.execute({
      managerId: user.id,
      status: query.status,
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    })

    if (response.isLeft()) {
      throw response.value
    }

    const { properties, totalCount } = response.value

    return {
      data: HttpPropertyPresenter.toHTTPList(properties),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / query.pageSize),
      },
    }
  }
}
```

**Controller 3: GET /properties/:id — GetPropertyByIdController**

```typescript
// File: apps/api/src/infra/http/controllers/get-property-by-id/get-property-by-id.controller.ts
import { GetPropertyByIdUseCase } from '@/domain/property-management/application/use-cases/get-property-by-id'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import { Controller, Get, HttpStatus, NotFoundException, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPropertyPresenter } from '../../presenters/http-property-presenter'

@ApiTags('Properties')
@Controller('/properties')
export class GetPropertyByIdController {
  constructor(private getPropertyById: GetPropertyByIdUseCase) {}

  private errorMap: Record<string, any> = {
    [PropertyNotFoundError.name]: NotFoundException,
  }

  @Get(':id')
  @UseGuards(EmployeeOnlyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get property details by ID' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Property details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Property not found' })
  async handle(
    @CurrentUser() user: HttpUserResponse,
    @Param('id') propertyId: string,
  ) {
    const response = await this.getPropertyById.execute({
      propertyId,
      managerId: user.id,
    })

    if (response.isLeft()) {
      const error = response.value
      const exception = this.errorMap[error.constructor.name] || NotFoundException
      throw new exception(error.message)
    }

    return {
      property: HttpPropertyPresenter.toHTTP(response.value.property),
    }
  }
}
```

**Controller 4: PUT /properties/:id — UpdatePropertyController**

```typescript
// File: apps/api/src/infra/http/controllers/update-property/update-property.controller.ts
import { UpdatePropertyUseCase } from '@/domain/property-management/application/use-cases/update-property'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import { Body, Controller, HttpStatus, NotFoundException, Param, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { updatePropertySchema } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPropertyPresenter } from '../../presenters/http-property-presenter'
import { z } from 'zod'

type UpdatePropertyBody = z.infer<typeof updatePropertySchema>

const bodyValidationPipe = new ZodValidationPipe(updatePropertySchema)

@ApiTags('Properties')
@Controller('/properties')
export class UpdatePropertyController {
  constructor(private updateProperty: UpdatePropertyUseCase) {}

  private errorMap: Record<string, any> = {
    [PropertyNotFoundError.name]: NotFoundException,
  }

  @Put(':id')
  @UseGuards(EmployeeOnlyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update property details' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Property updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Property not found' })
  async handle(
    @CurrentUser() user: HttpUserResponse,
    @Param('id') propertyId: string,
    @Body(bodyValidationPipe) body: UpdatePropertyBody,
  ) {
    const response = await this.updateProperty.execute({
      propertyId,
      managerId: user.id,
      ...body,
    })

    if (response.isLeft()) {
      const error = response.value
      const exception = this.errorMap[error.constructor.name] || NotFoundException
      throw new exception(error.message)
    }

    return {
      property: HttpPropertyPresenter.toHTTP(response.value.property),
    }
  }
}
```

**Controller 5: PATCH /properties/:id/status — UpdatePropertyStatusController**

```typescript
// File: apps/api/src/infra/http/controllers/update-property-status/update-property-status.controller.ts
import { UpdatePropertyStatusUseCase } from '@/domain/property-management/application/use-cases/update-property-status'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import { InvalidPropertyStatusTransitionError } from '@/domain/property-management/application/use-cases/errors/invalid-property-status-transition-error'
import { PropertyHasActiveLeaseError } from '@/domain/property-management/application/use-cases/errors/property-has-active-lease-error'
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ZodValidationPipe } from 'nestjs-zod'
import { z } from 'zod'
import { PropertyStatus } from '@leaselink/shared'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPropertyPresenter } from '../../presenters/http-property-presenter'

const updateStatusSchema = z.object({
  status: z.nativeEnum(PropertyStatus),
})

type UpdateStatusBody = z.infer<typeof updateStatusSchema>

const bodyValidationPipe = new ZodValidationPipe(updateStatusSchema)

@ApiTags('Properties')
@Controller('/properties')
export class UpdatePropertyStatusController {
  constructor(private updatePropertyStatus: UpdatePropertyStatusUseCase) {}

  private errorMap: Record<string, any> = {
    [PropertyNotFoundError.name]: NotFoundException,
    [InvalidPropertyStatusTransitionError.name]: BadRequestException,
    [PropertyHasActiveLeaseError.name]: ConflictException,
  }

  @Patch(':id/status')
  @UseGuards(EmployeeOnlyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update property status' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Status updated' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid status transition' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Property not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Property has active lease' })
  async handle(
    @CurrentUser() user: HttpUserResponse,
    @Param('id') propertyId: string,
    @Body(bodyValidationPipe) body: UpdateStatusBody,
  ) {
    const response = await this.updatePropertyStatus.execute({
      propertyId,
      managerId: user.id,
      status: body.status,
    })

    if (response.isLeft()) {
      const error = response.value
      const exception = this.errorMap[error.constructor.name] || BadRequestException
      throw new exception(error.message)
    }

    return {
      property: HttpPropertyPresenter.toHTTP(response.value.property),
    }
  }
}
```

**Controller 6: DELETE /properties/:id — DeletePropertyController**

```typescript
// File: apps/api/src/infra/http/controllers/delete-property/delete-property.controller.ts
import { DeletePropertyUseCase } from '@/domain/property-management/application/use-cases/delete-property'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import { PropertyHasActiveLeaseError } from '@/domain/property-management/application/use-cases/errors/property-has-active-lease-error'
import {
  ConflictException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'

@ApiTags('Properties')
@Controller('/properties')
export class DeletePropertyController {
  constructor(private deleteProperty: DeletePropertyUseCase) {}

  private errorMap: Record<string, any> = {
    [PropertyNotFoundError.name]: NotFoundException,
    [PropertyHasActiveLeaseError.name]: ConflictException,
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(EmployeeOnlyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a property' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Property deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Property not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Property has active lease' })
  async handle(
    @CurrentUser() user: HttpUserResponse,
    @Param('id') propertyId: string,
  ) {
    const response = await this.deleteProperty.execute({
      propertyId,
      managerId: user.id,
    })

    if (response.isLeft()) {
      const error = response.value
      const exception = this.errorMap[error.constructor.name] || NotFoundException
      throw new exception(error.message)
    }
  }
}
```

**Controller 7: POST /properties/:id/photos — UploadPropertyPhotosController**

```typescript
// File: apps/api/src/infra/http/controllers/upload-property-photos/upload-property-photos.controller.ts
import { UploadPropertyPhotosUseCase } from '@/domain/property-management/application/use-cases/upload-property-photos'
import { PropertyNotFoundError } from '@/domain/property-management/application/use-cases/errors/property-not-found-error'
import {
  BadRequestException,
  Controller,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { EmployeeOnlyGuard } from '../../guards/employee-only.guard'
import { CurrentUser } from '@/infra/auth/better-auth/current-user.decorator'
import { HttpUserResponse } from '../../presenters/http-user-presenter'
import { HttpPropertyPresenter } from '../../presenters/http-property-presenter'
import { MAX_PROPERTY_PHOTOS, MAX_PHOTO_SIZE_BYTES } from '@leaselink/shared'

@ApiTags('Properties')
@Controller('/properties')
export class UploadPropertyPhotosController {
  constructor(private uploadPropertyPhotos: UploadPropertyPhotosUseCase) {}

  private errorMap: Record<string, any> = {
    [PropertyNotFoundError.name]: NotFoundException,
  }

  @Post(':id/photos')
  @UseGuards(EmployeeOnlyGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('photos', MAX_PROPERTY_PHOTOS, {
    limits: { fileSize: MAX_PHOTO_SIZE_BYTES },
    fileFilter: (_req, file, callback) => {
      if (!file.mimetype.startsWith('image/')) {
        callback(new BadRequestException('Only image files are allowed'), false)
        return
      }
      callback(null, true)
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload property photos' })
  @ApiParam({ name: 'id', description: 'Property UUID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Photos uploaded' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Property not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid files or limit exceeded' })
  async handle(
    @CurrentUser() user: HttpUserResponse,
    @Param('id') propertyId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one photo is required')
    }

    const response = await this.uploadPropertyPhotos.execute({
      propertyId,
      managerId: user.id,
      files: files.map((f) => ({
        buffer: f.buffer,
        originalName: f.originalname,
        mimeType: f.mimetype,
      })),
    })

    if (response.isLeft()) {
      const error = response.value
      const exception = this.errorMap[error.constructor.name] || BadRequestException
      throw new exception(error.message)
    }

    return {
      property: HttpPropertyPresenter.toHTTP(response.value.property),
    }
  }
}
```

#### Swagger DTOs

Create Swagger DTO classes in `apps/api/src/infra/http/DTOs/property/`. These are simple classes with `@ApiProperty()` decorators that document the API in Swagger. Follow the existing patterns in `apps/api/src/infra/http/DTOs/client/` and `apps/api/src/infra/http/DTOs/document/`.

**`apps/api/src/infra/http/DTOs/property/create-property-request-dto.ts`**
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreatePropertyRequestDTO {
  @ApiProperty({ example: '123 Main St' })
  address: string

  @ApiProperty({ example: 'New York' })
  city: string

  @ApiProperty({ example: 'NY' })
  state: string

  @ApiProperty({ example: '10001' })
  zipCode: string

  @ApiProperty({ enum: ['APARTMENT', 'HOUSE', 'CONDO', 'TOWNHOUSE', 'STUDIO'], example: 'APARTMENT' })
  propertyType: string

  @ApiProperty({ example: 2 })
  bedrooms: number

  @ApiProperty({ example: 1.5 })
  bathrooms: number

  @ApiPropertyOptional({ example: 1200 })
  sqft?: number

  @ApiProperty({ example: 2500 })
  rentAmount: number

  @ApiPropertyOptional({ example: 'Spacious 2BR apartment with city views' })
  description?: string
}
```

Create analogous DTOs for `update-property-request-dto.ts`, `update-property-status-request-dto.ts`, `property-response-dto.ts`, and `property-list-response-dto.ts`.

#### Module Registration

**Update `apps/api/src/infra/database/database.module.ts`:**

Add to `providers` and `exports`:
```typescript
import { PropertiesRepository } from '@/domain/property-management/application/repositories/properties-repository'
import { PrismaPropertiesRepository } from './prisma/repositories/prisma-properties-repository'

// In providers:
{
  provide: PropertiesRepository,
  useClass: PrismaPropertiesRepository,
},

// In exports:
PropertiesRepository,
```

**Update `apps/api/src/infra/http/http.module.ts`:**

Add all 7 controllers to `controllers` array and all 7 use cases to `providers` array:
```typescript
// Controllers:
import { CreatePropertyController } from './controllers/create-property/create-property.controller'
import { GetPropertiesController } from './controllers/get-properties/get-properties.controller'
import { GetPropertyByIdController } from './controllers/get-property-by-id/get-property-by-id.controller'
import { UpdatePropertyController } from './controllers/update-property/update-property.controller'
import { UpdatePropertyStatusController } from './controllers/update-property-status/update-property-status.controller'
import { DeletePropertyController } from './controllers/delete-property/delete-property.controller'
import { UploadPropertyPhotosController } from './controllers/upload-property-photos/upload-property-photos.controller'

// Use Cases:
import { CreatePropertyUseCase } from '@/domain/property-management/application/use-cases/create-property'
import { GetPropertyByIdUseCase } from '@/domain/property-management/application/use-cases/get-property-by-id'
import { GetPropertiesByManagerUseCase } from '@/domain/property-management/application/use-cases/get-properties-by-manager'
import { UpdatePropertyUseCase } from '@/domain/property-management/application/use-cases/update-property'
import { UpdatePropertyStatusUseCase } from '@/domain/property-management/application/use-cases/update-property-status'
import { DeletePropertyUseCase } from '@/domain/property-management/application/use-cases/delete-property'
import { UploadPropertyPhotosUseCase } from '@/domain/property-management/application/use-cases/upload-property-photos'
```

### Acceptance Criteria

- [ ] `PrismaPropertyMapper.toDomain()` and `toPrisma()` correctly map all fields
- [ ] `PrismaPropertiesRepository` implements all 6 methods
- [ ] `findManyByManager` supports status filtering, text search (address/city), and pagination
- [ ] `hasActiveLease` queries the `leases` table for `status: 'ACTIVE'`
- [ ] All 7 controllers exist and are registered in `HttpModule`
- [ ] `PropertiesRepository` is registered in `DatabaseModule` with Prisma implementation
- [ ] All controllers use `@UseGuards(EmployeeOnlyGuard)` and `@ApiBearerAuth()`
- [ ] Validation uses shared Zod schemas from `@leaselink/shared` (not inline)
- [ ] Swagger DTOs exist for all request/response types
- [ ] API starts without errors: `cd apps/api && npm run start:dev`
- [ ] `tsc --noEmit` passes for the API app
- [ ] Swagger UI shows all 7 property endpoints under the "Properties" tag

### Test Cases

No new unit tests in Task 2 (the domain logic is tested in Task 1). The infrastructure integration is verified via:

1. **Compilation:** `cd apps/api && npx tsc --noEmit` exits 0
2. **Server startup:** `npm run start:dev` starts without module resolution or dependency injection errors
3. **Swagger:** Navigate to `/api/docs` and verify all 7 property endpoints appear
4. **Existing tests:** `cd apps/api && npm run test` — all existing tests still pass

---

## Task 3: Web Dashboard Foundation (Web Agent)

### Objective

Set up the web dashboard with Tailwind CSS, shadcn/ui, authentication pages (sign-in), and the authenticated layout (sidebar, top nav, notification bell placeholder). This is the scaffolding that all future web pages will be built on.

### Dependencies

- None (can be done in parallel with Tasks 1 & 2)

### Setup Commands

These commands must be run from `apps/web/`:

```bash
# 1. Install Tailwind CSS v4 + PostCSS (Next.js compatible)
npm install tailwindcss @tailwindcss/postcss postcss

# 2. Install shadcn/ui dependencies
npm install class-variance-authority clsx tailwind-merge lucide-react
npm install -D @types/node

# 3. Initialize shadcn/ui (this creates components.json and globals.css updates)
npx shadcn@latest init

# 4. Add shadcn components needed for Sprint 2
npx shadcn@latest add button input label card sidebar separator avatar badge
npx shadcn@latest add dropdown-menu sheet tooltip navigation-menu
npx shadcn@latest add form table dialog alert-dialog toast sonner
npx shadcn@latest add select textarea checkbox
npx shadcn@latest add skeleton tabs command popover

# 5. Install TanStack Query for server state
npm install @tanstack/react-query

# 6. Install React Hook Form + Zod resolver
npm install react-hook-form @hookform/resolvers zod

# 7. Install cookie handling for auth
npm install js-cookie
npm install -D @types/js-cookie
```

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/postcss.config.mjs` | Create | PostCSS config for Tailwind |
| `apps/web/app/globals.css` | Modify | Tailwind directives + shadcn theme |
| `apps/web/components.json` | Create (via shadcn init) | shadcn/ui config |
| `apps/web/lib/utils.ts` | Create (via shadcn init) | `cn()` utility function |
| `apps/web/lib/api-client.ts` | Create | API client (fetch wrapper with auth) |
| `apps/web/lib/auth.ts` | Create | Auth helpers (get/set token, redirect) |
| `apps/web/providers/query-provider.tsx` | Create | TanStack Query provider |
| `apps/web/app/layout.tsx` | Modify | Root layout with providers |
| `apps/web/app/(auth)/layout.tsx` | Create | Auth pages layout (centered card) |
| `apps/web/app/(auth)/sign-in/page.tsx` | Create | Sign in page |
| `apps/web/app/(auth)/forgot-password/page.tsx` | Create | Forgot password page |
| `apps/web/app/(dashboard)/layout.tsx` | Create | Sidebar + top nav layout |
| `apps/web/app/(dashboard)/page.tsx` | Create | Dashboard home (placeholder) |
| `apps/web/components/layout/sidebar.tsx` | Create | Sidebar navigation component |
| `apps/web/components/layout/top-nav.tsx` | Create | Top navigation bar |
| `apps/web/components/layout/sidebar-nav-item.tsx` | Create | Individual nav item |
| `apps/web/middleware.ts` | Create | Auth redirect middleware |

### Detailed Requirements

#### API Client

**`apps/web/lib/api-client.ts`**

A typed fetch wrapper that:
- Reads the auth token from cookies
- Adds `Authorization: Bearer <token>` header
- Has typed methods for GET, POST, PUT, PATCH, DELETE
- Handles 401 responses by redirecting to sign-in
- Base URL comes from `NEXT_PUBLIC_API_URL` env var

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

interface ApiClientOptions {
  headers?: Record<string, string>
  body?: unknown
}

async function request<T>(
  method: string,
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const cookies = await import('js-cookie')
  const token = cookies.default.get('auth_token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401) {
    cookies.default.remove('auth_token')
    window.location.href = '/sign-in'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return null as T
  }

  return response.json()
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
```

Note: This is a starting point. The photo upload endpoint will need a `postFormData` method that sets `Content-Type` to `multipart/form-data`. Add this in Task 4 when photo upload is implemented.

#### Auth Helpers

**`apps/web/lib/auth.ts`**

```typescript
import Cookies from 'js-cookie'

export function getAuthToken(): string | undefined {
  return Cookies.get('auth_token')
}

export function setAuthToken(token: string): void {
  Cookies.set('auth_token', token, {
    expires: 1, // 1 day
    sameSite: 'lax',
  })
}

export function removeAuthToken(): void {
  Cookies.remove('auth_token')
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}
```

#### TanStack Query Provider

**`apps/web/providers/query-provider.tsx`**
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

#### Root Layout

**`apps/web/app/layout.tsx`**
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/providers/query-provider'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LeaseLink — Property Management Dashboard',
  description: 'Manage your properties, tenants, leases, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  )
}
```

#### Auth Layout

**`apps/web/app/(auth)/layout.tsx`**

Centered layout for auth pages — card in the middle of the screen with LeaseLink branding.

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">LeaseLink</h1>
          <p className="text-sm text-muted-foreground">Property Management Dashboard</p>
        </div>
        {children}
      </div>
    </div>
  )
}
```

#### Sign-In Page

**`apps/web/app/(auth)/sign-in/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { setAuthToken } from '@/lib/auth'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SignInForm = z.infer<typeof signInSchema>

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  })

  async function onSubmit(data: SignInForm) {
    setIsLoading(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
      const response = await fetch(`${apiUrl}/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || 'Invalid credentials')
      }

      const result = await response.json()
      setAuthToken(result.token)
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:underline"
          >
            Forgot your password?
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
```

Note: The exact auth flow depends on the Better Auth API response shape. The sign-in endpoint may return a different structure (e.g., session token vs JWT). The implementer should inspect the existing `POST /auth/sign-in` response via Swagger and adjust accordingly. The key requirement is: get a token, store it in a cookie, redirect to dashboard.

#### Forgot Password Page

**`apps/web/app/(auth)/forgot-password/page.tsx`**

Simple form: email input → POST `/auth/forgot-password` → success message. Follow the same Card layout as sign-in. Show success state ("Check your email for a reset link") after submission.

#### Dashboard Layout

**`apps/web/app/(dashboard)/layout.tsx`**

This is the main authenticated layout. It renders:
1. A collapsible sidebar on the left
2. A top navigation bar with the user's name and a notification bell
3. The page content in the main area

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { TopNav } from '@/components/layout/top-nav'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/sign-in')
    }
  }, [router])

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <TopNav />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
```

#### Sidebar Component

**`apps/web/components/layout/sidebar.tsx`**

Uses shadcn/ui's `Sidebar` component. Navigation items:

| Label | Icon | Path | Active in Sprint 2 |
|-------|------|------|---------------------|
| Dashboard | `LayoutDashboard` | `/` | Placeholder page |
| Properties | `Building2` | `/properties` | Full CRUD (Task 4) |
| Tenants | `Users` | `/tenants` | Placeholder page |
| Leases | `FileText` | `/leases` | Placeholder page |
| Maintenance | `Wrench` | `/maintenance` | Placeholder page |
| Payments | `CreditCard` | `/payments` | Placeholder page |
| Documents | `FolderOpen` | `/documents` | Placeholder page |

Bottom section:
| Label | Icon | Path |
|-------|------|------|
| Settings | `Settings` | `/settings/profile` |

The sidebar should:
- Show "LeaseLink" branding at the top
- Highlight the currently active route
- Collapse to icon-only on medium screens via shadcn's `SidebarProvider`
- Use `lucide-react` icons

#### Top Nav Component

**`apps/web/components/layout/top-nav.tsx`**

Contains:
- Sidebar toggle button (hamburger) on the left
- Breadcrumb showing current section (optional, can be added later)
- Notification bell icon with unread badge on the right (visual only — real-time data is Sprint 3+)
- User avatar/name dropdown (with sign-out action) on the far right

#### Auth Middleware

**`apps/web/middleware.ts`**

Next.js middleware to protect dashboard routes:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const isAuthPage = request.nextUrl.pathname.startsWith('/sign-in') ||
    request.nextUrl.pathname.startsWith('/forgot-password')

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

#### Dashboard Home Placeholder

**`apps/web/app/(dashboard)/page.tsx`**

A placeholder page with cards showing "Coming soon" for each dashboard widget. This will be built out in Sprint 3+.

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, FileText, Wrench } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Total properties</p>
          </CardContent>
        </Card>
        {/* Similar cards for Tenants, Active Leases, Open Maintenance */}
      </div>
    </div>
  )
}
```

Also create placeholder pages for the non-implemented routes so the sidebar links don't 404:
- `apps/web/app/(dashboard)/tenants/page.tsx` — "Tenants — coming in Sprint 3"
- `apps/web/app/(dashboard)/leases/page.tsx` — "Leases — coming in Sprint 3"
- `apps/web/app/(dashboard)/maintenance/page.tsx` — "Maintenance — coming in Sprint 3"
- `apps/web/app/(dashboard)/payments/page.tsx` — "Payments — coming in Sprint 4"
- `apps/web/app/(dashboard)/documents/page.tsx` — "Documents — coming in Sprint 4"
- `apps/web/app/(dashboard)/settings/profile/page.tsx` — "Settings — coming later"

Each placeholder is a simple page with the section name and a "Coming soon" message.

### Acceptance Criteria

- [ ] `npx next build` succeeds with no errors
- [ ] `npx next dev` starts the development server
- [ ] Tailwind CSS and shadcn/ui are properly configured
- [ ] Navigating to `/` redirects to `/sign-in` when not authenticated
- [ ] Sign-in page renders with email/password form
- [ ] Forgot password page renders
- [ ] After sign-in, user is redirected to the dashboard
- [ ] Dashboard layout has working sidebar with all nav items
- [ ] Sidebar highlights the active route
- [ ] Top nav has notification bell (non-functional placeholder) and user menu with sign-out
- [ ] Clicking sign-out removes the auth cookie and redirects to sign-in
- [ ] All placeholder pages render without errors
- [ ] Auth middleware redirects unauthenticated users to sign-in
- [ ] Auth middleware redirects authenticated users away from sign-in page

### Test Cases

Manual verification (Playwright E2E tests are future sprint):

1. **Unauthenticated redirect:** Open `/` in browser → redirected to `/sign-in`
2. **Sign-in form validation:** Submit empty form → see validation errors
3. **Sign-in success:** Enter valid credentials → redirected to dashboard
4. **Dashboard layout:** Verify sidebar, top nav, and main content render
5. **Navigation:** Click each sidebar link → correct page loads, active state highlights
6. **Sign out:** Click sign-out in user menu → redirected to sign-in, token cookie removed
7. **Authenticated redirect:** While signed in, navigate to `/sign-in` → redirected to `/`

---

## Task 4: Property Pages — Web Dashboard (Web Agent)

### Objective

Build the full property management UI: list page with filtering/search, detail page, create form, and edit form. These pages call the API endpoints built in Tasks 1–2.

### Dependencies

- Task 2 (API endpoints must exist)
- Task 3 (dashboard layout must exist)

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/hooks/use-properties.ts` | TanStack Query hooks for property API calls |
| `apps/web/app/(dashboard)/properties/page.tsx` | Property list page |
| `apps/web/app/(dashboard)/properties/new/page.tsx` | Create property form |
| `apps/web/app/(dashboard)/properties/[id]/page.tsx` | Property detail page |
| `apps/web/app/(dashboard)/properties/[id]/edit/page.tsx` | Edit property form |
| `apps/web/components/properties/property-table.tsx` | Property data table component |
| `apps/web/components/properties/property-form.tsx` | Shared create/edit form component |
| `apps/web/components/properties/property-status-badge.tsx` | Status badge component |
| `apps/web/components/properties/property-photo-gallery.tsx` | Photo gallery with upload |
| `apps/web/components/properties/delete-property-dialog.tsx` | Confirmation dialog for delete |
| `apps/web/components/properties/change-status-dialog.tsx` | Status change dialog |

### Detailed Requirements

#### TanStack Query Hooks

**`apps/web/hooks/use-properties.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Property, PaginatedResponse } from '@leaselink/shared'

interface PropertyFilters {
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

export function useProperties(filters: PropertyFilters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize))

  const query = params.toString()

  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Property>>(
        `/properties${query ? `?${query}` : ''}`,
      ),
  })
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['properties', id],
    queryFn: () =>
      apiClient.get<{ property: Property }>(`/properties/${id}`),
    enabled: !!id,
  })
}

export function useCreateProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => apiClient.post('/properties', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => apiClient.put(`/properties/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useUpdatePropertyStatus(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: string) =>
      apiClient.patch(`/properties/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}

export function useDeleteProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
    },
  })
}
```

#### Property List Page

**`apps/web/app/(dashboard)/properties/page.tsx`**

Features:
- Page header with "Properties" title and "Add Property" button
- Filter bar: status dropdown (All, Vacant, Listed, Occupied, Maintenance) + search input
- Data table with columns: Address, City, Type, Bedrooms/Bathrooms, Rent, Status, Actions
- Status column shows `PropertyStatusBadge` component
- Actions column has dropdown: View, Edit, Change Status, Delete
- Pagination controls at the bottom
- Empty state when no properties exist ("No properties yet. Create your first property.")
- Loading skeleton state while data fetches

Use the shadcn `Table` component (or TanStack Table if already installed). For Sprint 2, a simple shadcn Table is sufficient — TanStack Table with sorting/column visibility can be added in later sprints.

#### Create Property Page

**`apps/web/app/(dashboard)/properties/new/page.tsx`**

Renders the `PropertyForm` component in create mode. On success, redirects to the new property's detail page with a success toast.

#### Property Detail Page

**`apps/web/app/(dashboard)/properties/[id]/page.tsx`**

Features:
- Header: property address as title, status badge, "Edit" and "Delete" buttons
- Info section: grid layout showing all property fields (type, beds, baths, sqft, rent, status, description)
- Photo gallery section: grid of property photos with "Upload Photos" button
- Status change button: opens dialog with available transitions (from `PROPERTY_STATUS_TRANSITIONS`)
- Placeholder sections for "Current Tenant" and "Lease History" (coming in Sprint 3)
- Placeholder section for "Maintenance Requests" (coming in Sprint 3)
- Back button to return to the property list

#### Edit Property Page

**`apps/web/app/(dashboard)/properties/[id]/edit/page.tsx`**

Renders the `PropertyForm` component in edit mode, pre-filled with the property's current data. On success, redirects to the detail page with a success toast.

#### Property Form Component

**`apps/web/components/properties/property-form.tsx`**

Shared form component used by both create and edit pages.

Props:
- `mode: 'create' | 'edit'`
- `defaultValues?: Partial<CreatePropertyInput>` (for edit mode)
- `onSubmit: (data: CreatePropertyInput | UpdatePropertyInput) => void`
- `isLoading: boolean`

Fields:
- Address (text input, required)
- City (text input, required)
- State (text input, required)
- Zip Code (text input, required)
- Property Type (select dropdown, required) — options from `PROPERTY_TYPE_LABELS`
- Bedrooms (number input, required)
- Bathrooms (number input, required — supports 0.5 increments)
- Square Footage (number input, optional)
- Monthly Rent (number input with $ prefix, required)
- Description (textarea, optional)

Uses `react-hook-form` with `zodResolver` and the shared `createPropertySchema` / `updatePropertySchema` from `@leaselink/shared`.

#### Property Status Badge

**`apps/web/components/properties/property-status-badge.tsx`**

Renders a shadcn `Badge` with color-coding:

| Status | Color |
|--------|-------|
| VACANT | `default` (gray) |
| LISTED | `secondary` (blue) |
| OCCUPIED | `success` (green) — custom variant or use `outline` with green text |
| MAINTENANCE | `destructive` (red/orange) |

Uses `PROPERTY_STATUS_LABELS` from `@leaselink/shared` for display text.

#### Delete Property Dialog

**`apps/web/components/properties/delete-property-dialog.tsx`**

An `AlertDialog` from shadcn that:
- Shows property address in the confirmation message
- Has Cancel and Delete buttons
- Delete button is destructive (red)
- Shows loading state during deletion
- Handles the "has active lease" error gracefully (shows error message from API)
- On success, redirects to the property list with a success toast

#### Change Status Dialog

**`apps/web/components/properties/change-status-dialog.tsx`**

A `Dialog` that:
- Shows the current status
- Shows a dropdown/radio group with only the valid target statuses (from `PROPERTY_STATUS_TRANSITIONS`)
- Disables invalid transitions
- Shows loading state during update
- Handles errors (invalid transition, active lease) with error messages

#### Photo Gallery Component

**`apps/web/components/properties/property-photo-gallery.tsx`**

- Displays photos in a responsive grid (3 columns on desktop, 2 on tablet)
- Each photo is clickable to view full-size (open in new tab or lightbox — simple is fine for Sprint 2)
- "Upload Photos" button that opens a file picker (accept `image/*`)
- Upload progress indicator (or loading state on the button)
- Uses the `POST /properties/:id/photos` endpoint via `FormData`

For the photo upload, the `apiClient` needs a `postFormData` method:
```typescript
// Add to apps/web/lib/api-client.ts
async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const cookies = await import('js-cookie')
  const token = cookies.default.get('auth_token')

  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  // Do NOT set Content-Type — the browser will set it with the boundary

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (response.status === 401) {
    cookies.default.remove('auth_token')
    window.location.href = '/sign-in'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }))
    throw new Error(error.message)
  }

  return response.json()
}

// Export:
export const apiClient = {
  // ... existing methods
  postFormData: <T>(path: string, formData: FormData) => requestFormData<T>(path, formData),
}
```

### Acceptance Criteria

- [ ] Property list page shows all properties for the authenticated manager
- [ ] Status filter dropdown works (filters the table)
- [ ] Search input filters by address/city (debounced, 300ms)
- [ ] Pagination works (next/previous, page numbers)
- [ ] "Add Property" button navigates to `/properties/new`
- [ ] Create form validates with shared Zod schema, shows field errors
- [ ] Create form submits to API and redirects to new property detail on success
- [ ] Property detail page shows all fields
- [ ] Edit form pre-fills with current data, submits partial update
- [ ] Status change dialog shows only valid transitions
- [ ] Delete confirmation dialog works and handles errors
- [ ] Photo gallery renders existing photos
- [ ] Photo upload works (multi-file, images only)
- [ ] Empty state shown when no properties exist
- [ ] Loading skeletons shown while data fetches
- [ ] Toast notifications on success/error
- [ ] All pages are responsive (minimum 768px width)

### Test Cases

Manual verification:

1. **Property list:** Navigate to `/properties` → see table (or empty state)
2. **Create property:** Click "Add Property" → fill form → submit → see new property in list
3. **Validation:** Submit form with missing required fields → see error messages
4. **View property:** Click a property row → see detail page with all fields
5. **Edit property:** Click "Edit" → change rent amount → submit → verify change
6. **Change status:** Click "Change Status" → select LISTED → confirm → status badge updates
7. **Invalid transition:** Property is VACANT → try to change to MAINTENANCE → see error (should not appear in valid options)
8. **Delete property:** Click "Delete" → confirm → property removed from list
9. **Delete with lease:** Try to delete property with active lease → see error
10. **Photo upload:** Upload 2 photos → see them in the gallery
11. **Search:** Type in search → table filters by address/city
12. **Pagination:** With 25+ properties, navigate between pages

---

## Implementation Order

```
Task 1 ──────────> Task 2
(Domain Layer)     (Infrastructure Layer)
[Backend Agent]    [Backend Agent]
                       │
                       ▼
                   Task 4
                   (Property Pages)
                   [Web Agent]
                       ▲
                       │
Task 3 ────────────────┘
(Web Foundation)
[Web Agent]
```

**Parallel work:**
- **Task 1** and **Task 3** can run in parallel (no dependencies between them)
- **Task 2** depends on Task 1 (needs domain entities)
- **Task 4** depends on Task 2 (needs API endpoints) and Task 3 (needs dashboard layout)

**Recommended execution:**
1. Start **Task 1** (Backend) and **Task 3** (Web) in parallel
2. When Task 1 completes, start **Task 2** (Backend)
3. When Task 2 and Task 3 both complete, start **Task 4** (Web)

---

## Definition of Done

Sprint 2 is complete when:

1. `cd apps/api && npx tsc --noEmit` passes
2. `cd apps/api && npm run test` passes (all existing + new property use case tests)
3. `cd apps/api && npm run start:dev` starts without errors
4. Swagger UI at `/api/docs` shows all 7 property endpoints
5. `cd apps/web && npx next build` passes with no errors
6. `cd apps/web && npm run dev` starts without errors
7. Sign-in flow works end-to-end (sign in → see dashboard → sign out)
8. Property CRUD works end-to-end via the web dashboard:
   - Create a property
   - View it in the list
   - View the detail page
   - Edit its fields
   - Change its status
   - Upload photos
   - Delete it
9. All shared imports from `@leaselink/shared` work in both `apps/api` and `apps/web`
10. No regressions in existing mobile app functionality
