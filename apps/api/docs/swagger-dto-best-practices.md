# Swagger DTO Best Practices for Kubb Type Generation

This document outlines common issues with NestJS Swagger DTOs that cause Kubb to generate `any` or generic `object` types instead of specific TypeScript types, and how to avoid them.

## Common Issues and Solutions

### 1. Missing Explicit Type in @ApiProperty

**Problem:** Properties without explicit `type` in `@ApiProperty` may generate incorrect types.

**Bad:**
```typescript
@ApiProperty({
  description: 'Collection ID',
  example: 12345,
})
collectionId: number
```

**Good:**
```typescript
@ApiProperty({
  description: 'Collection ID',
  example: 12345,
  type: Number,
})
collectionId: number
```

**Rule:** Always include `type: Number`, `type: String`, `type: Boolean`, or `type: [SomeDTO]` in every `@ApiProperty`.

---

### 2. API Responses Without Type Schemas

**Problem:** `@ApiResponse` decorators for error codes (400, 401, 404, 422) without a `type` property cause Kubb to default to `any`.

**Bad:**
```typescript
@ApiResponse({
  status: HttpStatus.UNPROCESSABLE_ENTITY,
  description: 'Client is not linked to the collection',
})
```

**Good:**
```typescript
@ApiResponse({
  status: HttpStatus.UNPROCESSABLE_ENTITY,
  description: 'Client is not linked to the collection',
  type: GetCollectionUnprocessableEntityDTO,
})
```

**Rule:** Every `@ApiResponse` must have either a `type` property pointing to a DTO or a `schema` property.

---

### 3. 204 No Content Responses

**Problem:** 204 responses without explicit schema cause Kubb to generate `any`.

**Bad:**
```typescript
@ApiResponse({
  status: HttpStatus.NO_CONTENT,
  description: 'No data found',
})
```

**Good:**
```typescript
@ApiResponse({
  status: HttpStatus.NO_CONTENT,
  description: 'No data found',
  schema: { type: 'null' },
})
```

**Rule:** Always use `schema: { type: 'null' }` for 204 No Content responses.

---

### 4. Response Wrapper Mismatch

**Problem:** Controller returns `res.json({ key: data })` but DTO doesn't have a matching wrapper structure.

**Bad (Controller):**
```typescript
return res.status(HttpStatus.OK).json({
  holdings: HttpHoldingsPresenter.toHTTP(holdings),
})
```

**Bad (DTO):**
```typescript
export class GetHoldingsResponseDto {
  // Missing the "holdings" wrapper property
  @ApiProperty({ type: [HoldingDto] })
  data: HoldingDto[]
}
```

**Good (DTO):**
```typescript
export class GetHoldingsResponseDto {
  @ApiProperty({
    description: 'List of holdings',
    type: [HoldingDto]
  })
  holdings: HoldingDto[]
}
```

**Rule:** DTO structure must exactly match the controller's `res.json()` response structure.

---

### 5. Missing @ApiExtraModels

**Problem:** Nested DTOs not registered with `@ApiExtraModels` may not appear correctly in the OpenAPI schema.

**Bad:**
```typescript
@ApiTags('Holdings')
@Controller('/holdings')
export class GetHoldingsController {
  // HoldingDto not registered
}
```

**Good:**
```typescript
@ApiTags('Holdings')
@ApiExtraModels(GetHoldingsResponseDto, HoldingDto)
@Controller('/holdings')
export class GetHoldingsController {
  // All nested DTOs registered
}
```

**Rule:** Register all nested DTOs using `@ApiExtraModels` on the controller class.

---

### 6. Date Fields Without Proper Format

**Problem:** Date properties without proper format annotation.

**Bad:**
```typescript
@ApiProperty({
  description: 'Created date',
  example: '2024-01-15T00:00:00.000Z',
})
createdAt: Date
```

**Good:**
```typescript
@ApiProperty({
  description: 'Created date',
  example: '2024-01-15T00:00:00.000Z',
  type: String,
  format: 'date-time',
})
createdAt: Date
```

**Rule:** Always use `type: String, format: 'date-time'` for Date properties.

---

### 7. Array Properties Without Type Annotation

**Problem:** Array properties using TypeScript types instead of Swagger-compatible syntax.

**Bad:**
```typescript
@ApiProperty({
  description: 'List of items',
})
items: ItemDto[]
```

**Good:**
```typescript
@ApiProperty({
  description: 'List of items',
  type: [ItemDto],
})
items: ItemDto[]
```

**Rule:** Use `type: [ElementDTO]` syntax for array properties.

---

### 8. Prefer @ApiOkResponse for 200 Responses

**Problem:** Using `@ApiResponse` for OK responses is less explicit.

**Acceptable:**
```typescript
@ApiResponse({
  status: HttpStatus.OK,
  description: 'Success',
  type: ResponseDTO,
})
```

**Better:**
```typescript
@ApiOkResponse({
  description: 'Success',
  type: ResponseDTO,
})
```

**Rule:** Use `@ApiOkResponse` for 200 OK responses for cleaner code.

---

## Checklist for New Endpoints

When creating a new controller endpoint:

- [ ] Create DTOs for all response types (success and error)
- [ ] Add explicit `type` to all `@ApiProperty` decorators
- [ ] Add `@ApiExtraModels` for all nested DTOs
- [ ] Add `type` or `schema` to all `@ApiResponse` decorators
- [ ] Use `schema: { type: 'null' }` for 204 responses
- [ ] Use `type: String, format: 'date-time'` for Date fields
- [ ] Use `type: [DTO]` for array fields
- [ ] Ensure DTO structure matches controller response structure

## Error DTO Template

```typescript
import { HttpStatus } from '@nestjs/common'
import { ApiProperty } from '@nestjs/swagger'

export class SomeErrorDTO {
  @ApiProperty({
    example: 'Error message here',
    description: 'Error message describing what went wrong',
    type: String,
  })
  message: string

  @ApiProperty({
    example: 'Unprocessable Entity',
    description: 'Error type',
    type: String,
  })
  error: string

  @ApiProperty({
    example: HttpStatus.UNPROCESSABLE_ENTITY,
    description: 'HTTP status code',
    type: Number,
  })
  statusCode: number
}
```

## Files Modified in This Cleanup

### Controllers Updated:
- `get-collection-asset-allocation.controller.ts`
- `get-collection-performance-chart.controller.ts`
- `get-collection-performance-details.controller.ts`
- `get-holdings.controller.ts`
- `get-holdings-grouped-by-asset-class.controller.ts`
- `get-portfolios.controller.ts`
- `get-transactions.controller.ts`
- `update-notification.controller.ts`

### DTOs Updated with Explicit Types:
- `holding-dto.ts`
- `portfolio-dto.ts`
- `transaction-dto.ts`

### Error DTOs Created:
- `get-collection-asset-allocation-bad-request-dto.ts`
- `get-collection-asset-allocation-unauthorized-dto.ts`
- `get-collection-asset-allocation-unprocessable-entity-dto.ts`
- `get-collection-performance-chart-bad-request-dto.ts`
- `get-collection-performance-chart-unauthorized-dto.ts`
- `get-collection-performance-chart-unprocessable-entity-dto.ts`
- `get-collection-performance-details-unprocessable-entity-dto.ts`
- `get-holdings-unprocessable-entity-dto.ts`
- `get-portfolio-unprocessable-entity-dto.ts`
- `get-transactions-unprocessable-entity-dto.ts`
- `update-notification-not-found-dto.ts`
- `update-notification-unprocessable-entity-dto.ts`
