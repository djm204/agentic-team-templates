# API Documentation

Guidelines for documenting APIs, including REST endpoints, GraphQL schemas, and library interfaces.

## Design-First Approach

**Write the API specification before implementation.** This:
- Catches design issues early
- Enables parallel frontend/backend development
- Creates documentation as a natural byproduct
- Prevents implementation details from leaking into contracts

## OpenAPI/Swagger Specification

### Basic Structure

```yaml
openapi: 3.1.0
info:
  title: Payment API
  version: 1.0.0
  description: |
    API for processing payments and managing transactions.
    
    ## Authentication
    All endpoints require Bearer token authentication.
    
    ## Rate Limits
    - Standard: 100 requests/minute
    - Burst: 200 requests/minute

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://api.staging.example.com/v1
    description: Staging

paths:
  /payments:
    post:
      summary: Create a payment
      description: |
        Initiates a new payment transaction.
        
        The payment will be processed asynchronously. Use the
        returned `payment_id` to check status via GET /payments/{id}.
      operationId: createPayment
      tags:
        - Payments
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreatePaymentRequest'
            examples:
              credit_card:
                summary: Credit card payment
                value:
                  amount: 1000
                  currency: USD
                  method: credit_card
                  card_token: tok_visa_4242
      responses:
        '201':
          description: Payment created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Payment'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

### Schema Documentation

```yaml
components:
  schemas:
    Payment:
      type: object
      description: Represents a payment transaction
      required:
        - id
        - amount
        - currency
        - status
      properties:
        id:
          type: string
          format: uuid
          description: Unique payment identifier
          example: "pay_1234567890"
        amount:
          type: integer
          description: Amount in smallest currency unit (cents for USD)
          minimum: 1
          example: 1000
        currency:
          type: string
          description: ISO 4217 currency code
          enum: [USD, EUR, GBP]
          example: USD
        status:
          type: string
          description: Current payment status
          enum: [pending, processing, completed, failed]
          example: completed
        created_at:
          type: string
          format: date-time
          description: When the payment was created
          example: "2024-01-15T10:30:00Z"
```

## Endpoint Documentation Requirements

### Every Endpoint Must Have

1. **Summary** - One-line description
2. **Description** - Detailed behavior explanation
3. **Parameters** - All path, query, header parameters
4. **Request body** - Schema with examples
5. **Responses** - All possible response codes
6. **Authentication** - Required auth method
7. **Examples** - Real-world usage examples

### Response Documentation

Document all response codes:

```yaml
responses:
  '200':
    description: Success
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'
  '400':
    description: |
      Bad Request. Possible reasons:
      - Missing required field
      - Invalid field format
      - Business rule violation
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Error'
        examples:
          missing_field:
            summary: Missing required field
            value:
              error: validation_error
              message: "Field 'email' is required"
              field: email
          invalid_format:
            summary: Invalid format
            value:
              error: validation_error
              message: "Invalid email format"
              field: email
  '401':
    description: Authentication required or token invalid
  '403':
    description: Authenticated but not authorized for this resource
  '404':
    description: Resource not found
  '429':
    description: Rate limit exceeded
  '500':
    description: Internal server error
```

## GraphQL Documentation

### Schema Documentation

```graphql
"""
A user account in the system.

Users can have multiple roles and belong to organizations.
"""
type User {
  """Unique identifier"""
  id: ID!
  
  """User's email address (unique, used for login)"""
  email: String!
  
  """Display name shown in the UI"""
  displayName: String
  
  """
  User's current status.
  
  ACTIVE users can log in and perform actions.
  SUSPENDED users cannot log in until reactivated.
  """
  status: UserStatus!
  
  """Organizations this user belongs to"""
  organizations: [Organization!]!
  
  """When the account was created"""
  createdAt: DateTime!
}

"""
Possible states for a user account
"""
enum UserStatus {
  """User can log in and use the system"""
  ACTIVE
  
  """User is blocked from logging in"""
  SUSPENDED
  
  """User has been soft-deleted"""
  DELETED
}
```

### Query/Mutation Documentation

```graphql
type Query {
  """
  Retrieve a user by ID.
  
  Returns null if user doesn't exist or caller lacks permission.
  """
  user(id: ID!): User
  
  """
  Search users with optional filters.
  
  Results are paginated. Use `after` cursor for subsequent pages.
  Maximum 100 results per page.
  """
  users(
    """Filter by organization membership"""
    organizationId: ID
    
    """Filter by status"""
    status: UserStatus
    
    """Number of results (max 100)"""
    first: Int = 20
    
    """Cursor for pagination"""
    after: String
  ): UserConnection!
}

type Mutation {
  """
  Create a new user account.
  
  Sends a verification email to the provided address.
  User cannot log in until email is verified.
  
  Requires ADMIN role.
  """
  createUser(input: CreateUserInput!): CreateUserPayload!
}
```

## Library/SDK Documentation

### Function Documentation

```typescript
/**
 * Payment processing client.
 * 
 * @example Basic usage
 * ```ts
 * const client = new PaymentClient({ apiKey: 'sk_test_...' });
 * const payment = await client.createPayment({
 *   amount: 1000,
 *   currency: 'usd',
 * });
 * ```
 * 
 * @example With error handling
 * ```ts
 * try {
 *   const payment = await client.createPayment(params);
 * } catch (error) {
 *   if (error instanceof CardDeclinedError) {
 *     // Handle declined card
 *   }
 * }
 * ```
 */
class PaymentClient {
  /**
   * Creates a new payment client instance.
   * 
   * @param options - Configuration options
   * @param options.apiKey - Your API key (starts with sk_)
   * @param options.timeout - Request timeout in ms (default: 30000)
   * @param options.maxRetries - Max retry attempts (default: 3)
   */
  constructor(options: PaymentClientOptions);

  /**
   * Creates a new payment.
   * 
   * @param params - Payment parameters
   * @returns The created payment object
   * @throws {CardDeclinedError} Card was declined by issuer
   * @throws {InvalidParameterError} Invalid parameter provided
   * @throws {RateLimitError} Rate limit exceeded
   * 
   * @see {@link https://docs.example.com/payments | Payment Guide}
   */
  async createPayment(params: CreatePaymentParams): Promise<Payment>;
}
```

## Documentation Anti-Patterns

### Missing Error Documentation

```yaml
# Bad: Only documents success
responses:
  '200':
    description: Success

# Good: Documents all outcomes
responses:
  '200':
    description: Success
  '400':
    description: Invalid request parameters
  '401':
    description: Missing or invalid authentication
  '404':
    description: Resource not found
  '500':
    description: Internal server error
```

### Vague Descriptions

```yaml
# Bad: Doesn't help the developer
description: Gets the thing

# Good: Specific and actionable
description: |
  Retrieves a user by their unique ID.
  
  Returns the full user profile including email, display name,
  and organization memberships. Requires read:users scope.
```

### No Examples

```yaml
# Bad: No examples
schema:
  type: object
  properties:
    status:
      type: string

# Good: Clear examples
schema:
  type: object
  properties:
    status:
      type: string
      enum: [pending, active, cancelled]
      example: active
  example:
    status: active
    created_at: "2024-01-15T10:30:00Z"
```

## Keeping API Docs in Sync

### Single Source of Truth

- Generate docs from code annotations when possible
- Use OpenAPI spec as source, generate code from it
- Never maintain parallel documentation

### CI Integration

```yaml
# .github/workflows/api-docs.yml
- name: Validate OpenAPI spec
  run: npx @redocly/cli lint openapi.yaml

- name: Check for breaking changes
  run: npx @redocly/cli diff openapi.yaml main:openapi.yaml
```

### Versioning

- Document version in API path (`/v1/`, `/v2/`)
- Maintain docs for all supported versions
- Clearly mark deprecated endpoints
- Include migration guides for breaking changes
