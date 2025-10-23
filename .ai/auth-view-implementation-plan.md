# View Implementation Plan: Auth Views

## 1. Overview

Implement two related views—Register and Login—to enable new user registration (US-001) and existing user authentication (US-002, US-003, US-004). Each view comprises form input, client-side validation, OAuth integration, and API calls to `/auth/register`, `/auth/login`, and `/auth/oauth/:provider`. Successful flows redirect to the main dashboard; errors display inline or via toast.

## 2. View Routing

- Register View: path `/register`
- Login View: path `/login`

## 3. Component Structure

```
RegisterPage
└─ AuthForm
   ├─ FieldError
   ├─ PasswordStrengthMeter (Register only)
   └─ SubmitButton
└─ OAuthButtons

LoginPage
└─ AuthForm
   ├─ FieldError
   └─ SubmitButton
└─ OAuthButtons
└─ ToastNotification
```

## 4. Component Details

### RegisterPage

- Purpose: Host registration UI, manage page-level state and side effects.
- Child components: `AuthForm`, `OAuthButtons`.
- Handled events: form submit → register; OAuth click → redirect.
- Validation: email format, password length ≥8.

### LoginPage

- Purpose: Host login UI, manage page-level state and side effects.
- Child components: `AuthForm`, `OAuthButtons`, `ToastNotification`.
- Handled events: form submit → login; OAuth click → redirect.
- Validation: email format, password nonempty.

### AuthForm<T extends AuthFormValues>

- Purpose: Reusable form for email/password input.
- Main elements: `<input type="email" name="email"/>`, `<input type="password" name="password"/>`, `<button type="submit"/>`.
- Child: `PasswordStrengthMeter` (conditionally rendered for Register), `FieldError` under each field.
- Props:
  - `mode: 'register' | 'login'`
  - `onSubmit(values: AuthFormValues): void`
  - `serverErrors?: AuthErrorMap`
- Handled interactions: change, blur (validate), submit.
- Validation conditions:
  - `email`: nonempty, matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - `password`: register → length≥8; login → nonempty.

### FieldError

- Purpose: Display inline field‐specific error messages.
- Props: `message: string`
- Renders `<div role="alert">{message}</div>`.

### PasswordStrengthMeter

- Purpose: Visual indicator of password strength.
- Props: `password: string`
- Renders colored bar or text rating (weak/medium/strong).
- Logic: score length, variety of chars.

### OAuthButtons

- Purpose: Render buttons for Google and Apple sign-in.
- Elements: two `<button>`s with provider logos.
- Props: none.
- Handled events: click → `window.location.href = '/auth/oauth/google'` or `/apple'`.
- Accessibility: ARIA labels.

### ToastNotification

- Purpose: Display ephemeral messages (e.g., invalid credentials, network errors).
- Props: `message: string`, `type: 'error' | 'success'`
- Renders at top right; auto-dismiss after 3s.

## 5. Types

```ts
// Values passed by AuthForm
interface AuthFormValues {
  email: string;
  password: string;
}

type AuthErrorMap = Partial<Record<keyof AuthFormValues, string>>;

type OAuthProvider = "google" | "apple";

// API request/response
interface RegisterRequest {
  email: string;
  password: string;
}
interface RegisterResponse {
  id: string;
  email: string;
  created_at: string;
}
interface LoginRequest {
  email: string;
  password: string;
}
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}
interface OAuthRequest {
  token: string;
}
interface OAuthResponse extends LoginResponse {}

// ViewModel for pages
interface AuthPageState {
  loading: boolean;
  serverErrors?: AuthErrorMap;
  toastMessage?: string;
}
```

## 6. State Management

- Use React `useState` and `useEffect` in pages.
- Custom hook `useAuth()` to store tokens and redirect on success.
- Form state: React Hook Form or controlled components.
- Page state: `{ loading, serverErrors, toastMessage }`.

## 7. API Integration

- Use `fetch` or `axios` in a helper `api.post<T>(url, body)`.
- Register: `POST /auth/register` with `RegisterRequest`, expect `RegisterResponse`.
- Login: `POST /auth/login` with `LoginRequest`, expect `LoginResponse`.
- OAuth: `POST /auth/oauth/${provider}` with `{ token }`, expect `LoginResponse`.
- On success: call `useAuth().setTokens(accessToken, refreshToken)` and `navigate('/')`.
- On errors:
  - 400: parse validation errors, map to fields.
  - 401/409: set `serverErrors.email` or trigger toast.

## 8. User Interactions

1. User enters email/password → onBlur triggers validation.
2. Invalid input → inline `FieldError` appears.
3. Click Submit:
   - Valid → disable form, show spinner.
   - API call → success → redirect.
   - API error → re-enable, show inline or toast.
4. Click “Sign in with Google/Apple” → browser navigates to OAuth backend route.

## 9. Conditions and Validation

- Email regex: nonempty, valid format.
- Password: register length≥8; login nonempty.
- Server: if email exists (409) → `FieldError` under email.
- If invalid credentials (401) → general toast error.

## 10. Error Handling

- Client: prevent submission on client validation fail.
- API errors:
  - 400 → display per-field messages.
  - 401 → `ToastNotification` “Invalid credentials.”
  - 409 → inline “Email already registered.”
  - Network → toast “Network error, try again.”

## 11. Implementation Steps

1. Create `AuthForm` component and types in `src/components/auth/`.
2. Implement `FieldError` and integrate into form fields.
3. Build `PasswordStrengthMeter` and conditionally render in register mode.
4. Create `OAuthButtons` with provider redirects.
5. Implement page components `RegisterPage.tsx` and `LoginPage.tsx` under `src/views/`
6. Wire up form state and client-side validation.
7. Integrate API helper and define service functions `register()`, `login()`, `oauthLogin()`.
8. Use `useAuth()` hook to persist tokens and redirect.
9. Add `ToastNotification` and manage toast state in `LoginPage`.
10. Add routing entries in `App.tsx` or router config for `/register` and `/login`.
11. Write unit tests for validation and integration tests for API calls.
