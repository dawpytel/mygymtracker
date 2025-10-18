# Auth Module API Implementation Plan

## 1. Endpoint Overview

This plan covers the implementation of authentication and user-profile endpoints for the MyGymTracker backend:

- **POST /auth/register**: Register a new user with email and password.
- **POST /auth/login**: Authenticate a user with email/password, returning JWT tokens.
- **POST /auth/oauth/:provider**: Login or register via OAuth providers (`google`, `apple`).
- **POST /auth/logout**: Invalidate the current JWT session.
- **GET /users/me**: Retrieve the current authenticated user’s profile.

## 2. Request Details

### POST /auth/register

- HTTP Method: POST
- URL: `/auth/register`
- Required Body:
  ```json
  {
    "email": "string (valid email)",
    "password": "string (min 8 chars)"
  }
  ```

### POST /auth/login

- HTTP Method: POST
- URL: `/auth/login`
- Required Body:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

### POST /auth/oauth/:provider

- HTTP Method: POST
- URL: `/auth/oauth/:provider`
- Path Parameter:
  - `provider`: `google` or `apple`
- Required Body:
  ```json
  { "token": "OAuth provider token" }
  ```

### POST /auth/logout

- HTTP Method: POST
- URL: `/auth/logout`
- Headers:
  - `Authorization: Bearer <accessToken>`
- No body.

### GET /users/me

- HTTP Method: GET
- URL: `/users/me`
- Headers:
  - `Authorization: Bearer <accessToken>`
- No body.

## 3. Used Types

- **DTOs**
  - `RegisterDto`, `RegisterResponseDto`
  - `LoginDto`, `LoginResponseDto`
  - `OAuthLoginDto`
  - `LogoutResponseDto`
  - `UserProfileDto`
- **Command Models** (service inputs)
  - `CreateUserCommand { email, password }`
  - `AuthenticateUserCommand { email, password }`
  - `OAuthLoginCommand { provider, token }`
  - `LogoutCommand { userId, token }`
  - `GetUserProfileCommand { userId }`

## 4. Response Details

- **201 Created** for `/auth/register`
  ```json
  { "id": "UUID", "email": "string", "created_at": "timestamp" }
  ```
- **200 OK** for `/auth/login`, `/auth/oauth/:provider`
  ```json
  { "accessToken": "JWT", "refreshToken": "JWT" }
  ```
- **200 OK** for `/auth/logout`
  ```json
  { "message": "Logged out" }
  ```
- **200 OK** for `/users/me`
  ```json
  {
    "id": "UUID",
    "email": "string",
    "last_login_at": "timestamp",
    "created_at": "timestamp"
  }
  ```

## 5. Data Flow

1. **Controller** receives and validates DTO via NestJS pipes.
2. **Controller** maps DTO to Command Model.
3. **AuthService / UsersService** handles business logic:
   - `register`: hash password, store user via TypeORM, handle duplicate email.
   - `login`: verify credentials, update `last_login_at`, issue JWTs.
   - `oauthLogin`: verify OAuth token with provider SDK, find or create user, issue JWTs.
   - `logout`: blacklist or revoke refresh token in store.
   - `getProfile`: fetch user by ID using TypeORM.
4. **AuthService** uses `@nestjs/jwt` for token creation and validation.
5. **UserRepository** (TypeORM) interacts with `users` table.

## 6. Security Considerations

- **Input Validation**: Enforce `IsEmail`, `MinLength(8)` decorators; guard invalid providers.
- **Authentication**: Use `JwtAuthGuard` for protected routes, validate tokens.
- **Authorization**: Ensure user context matches resource (`/users/me`).
- **Password Storage**: Use a strong hash (bcrypt) with salt rounds from config.
- **Rate Limiting**: Protect login and register endpoints against brute force.
- **OAuth Token Validation**: Verify provider token via Google/Apple SDKs.
- **Transport**: Enforce HTTPS in deployment.
- **RLS**: Rely on PostgreSQL Row-Level Security for user isolation.

## 7. Error Handling

| Scenario                         | HTTP Status               | Action                                         |
| -------------------------------- | ------------------------- | ---------------------------------------------- |
| Validation failure (DTO)         | 400 Bad Request           | Return `ValidationException` with details      |
| Email already exists             | 409 Conflict              | Catch unique constraint error, return conflict |
| Invalid credentials              | 401 Unauthorized          | Return `UnauthorizedException`                 |
| Invalid OAuth provider or token  | 401 Unauthorized          | Return `UnauthorizedException`                 |
| Missing or invalid JWT           | 401 Unauthorized          | Handled by `JwtAuthGuard`                      |
| Unexpected server/database error | 500 Internal Server Error | Log error, return generic message              |

## 8. Performance Considerations

- **Indexing**: `users.email` is unique and indexed.
- **Batch Queries**: Minimal; single-row queries per request.
- **Caching**: Consider caching provider public keys for OAuth.
- **Connection Pooling**: Ensure TypeORM pool settings suitable for load.

## 9. Implementation Steps

1. Define and export DTOs in `backend/src/auth/dto/` and `backend/src/users/dto/`.
2. Create Command Model interfaces/classes in `backend/src/auth/commands/`.
3. Implement `AuthService.register`:
   - Hash password, save user, return `RegisterResponseDto`.
   - Handle unique constraint for email.
4. Implement `AuthService.login`:
   - Validate credentials, update `last_login_at`, sign JWTs, return `LoginResponseDto`.
5. Implement `AuthService.oauthLogin`:
   - Add provider SDK modules, verify token, create or fetch user, sign JWTs.
6. Implement `AuthService.logout`:
   - Revoke or blacklist token (in-memory or Redis store), return `LogoutResponseDto`.
7. Implement `UsersController.getMe` in `UsersController`:
   - Use `JwtAuthGuard`, call `UsersService.getProfile`, return `UserProfileDto`.
8. Update `AuthController` routes for register, login, oauth, logout, using validation pipes.
9. Configure `JwtModule` in `AuthModule` with secret and expiration from config.
10. Write unit tests for each service method and controller route.
11. Write e2e tests for happy paths and error scenarios.
12. Update Swagger decorators for all endpoints.
13. Review and finalize logging: add structured logs for errors using NestJS `Logger`.

---

_End of Auth Module API Implementation Plan._
