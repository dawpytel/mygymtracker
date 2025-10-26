# Specyfikacja modułu rejestracji, logowania i odzyskiwania hasła

> Dokumentacja architektury istniejącego modułu autentykacji i autoryzacji w aplikacji MyGymTracker.

## 1. Architektura interfejsu użytkownika

### 1.1 Kluczowe komponenty

- `LoginPage` i `RegisterPage` (frontend/src/views): strony obsługujące odpowiednio logowanie i rejestrację.
- `AuthForm` (frontend/src/components/auth/AuthForm): generyczny formularz z polami email i password, przyciskiem submit.
- `OAuthButtons` (frontend/src/components/auth/OAuthButtons): przyciski logowania via Google i Apple.
- `ToastNotification` (frontend/src/components/ToastNotification): komponent wyświetlający komunikaty o błędach i sukcesie.
- `AuthContext` (frontend/src/contexts/AuthContext): kontekst zarządzający stanem autentykacji (tokeny, isAuthenticated).

### 1.2 Zależności i przepływ

1. Strony `LoginPage`/`RegisterPage` importują `AuthForm` i `OAuthButtons`.
2. `AuthForm` wywołuje przekazany handler `onSubmit`, który używa funkcji `login` lub `register` z `frontend/src/lib/auth`.
3. Po otrzymaniu odpowiedzi, `LoginPage` zapisuje tokeny via `AuthContext.setTokens`, ustawiając `isAuthenticated=true`.
4. `useEffect` w komponentach przekierowuje zalogowanego użytkownika na główną stronę (dashboard).

### 1.3 Walidacja i komunikaty błędów

- Walidacja front-end (w `AuthForm` i Zod): sprawdzenie niepustych wartości, poprawny format email, hasło ≥8 znaków.
- Obsługiwane kody odpowiedzi z API:
  - 400 Bad Request: szczegółowe komunikaty walidacji (`details.message`).
  - 401 Unauthorized: nieprawidłowe dane logowania.
  - 409 Conflict: email już istnieje.
- Prezentacja błędów:
  - Mapa `serverErrors` renderowana przy odpowiednich polach formularza.
  - `ToastNotification` dla komunikatów ogólnych (błąd sieci, nieznany błąd).

### 1.4 Kluczowe scenariusze

- Sukces rejestracji → toast sukcesu + redirect do `/login`.
- Sukces logowania → zapis tokenów + redirect do `/`.
- Rejestracja z istniejącym emailem → błąd przy polu email.
- Nieprawidłowe dane logowania → toast "Invalid email or password".
- Błąd sieci → toast "Network error".
- Logowanie OAuth (Google/Apple) → analogiczne scenariusze z uwierzytelnieniem zewnętrznym.
- Użytkownik już zalogowany → automatyczny redirect z `/login` i `/register`.

> **Uwaga:** Obecnie brak implementacji mechanizmu odzyskiwania hasła (Forgot Password).

## 2. Logika backendowa

### 2.1 Struktura endpointów

- `POST /auth/register` → `AuthController.register` → przyjmuje `RegisterDto` → zwraca `RegisterResponseDto`.
- `POST /auth/login` → `AuthController.login` → przyjmuje `LoginDto` → zwraca `LoginResponseDto`.
- `POST /auth/oauth/:provider` → `AuthController.oauthLogin` → param `provider` ("google" | "apple"), DTO `OAuthLoginDto` → zwraca `LoginResponseDto`.
- `POST /auth/logout` → `AuthController.logout` (chronione `JwtAuthGuard`) → zwraca `LogoutResponseDto`.

### 2.2 Modele danych i kontrakty

- Entity `User` (backend/src/users/entities/user.entity.ts):
  - `id: string`, `email: string`, `password_hash: string`, `account_created_at: Date`, `last_login_at: Date`.
- Entity `UserOAuthProviderEntity`: `userId: string`, `providerName: string`, `providerUserId: string`.
- Komendy w `auth/commands` (`CreateUserCommand`, `AuthenticateUserCommand`).
- DTO (`backend/src/types`):
  - Wejściowe: `RegisterDto`, `LoginDto`, `OAuthLoginDto`.
  - Wyjściowe: `RegisterResponseDto`, `LoginResponseDto` (accessToken, refreshToken), `LogoutResponseDto` (message).

### 2.3 Mechanizmy walidacji i logika biznesowa

- W kontrolerze:
  - Sprawdzenie formatu email via regex w `isValidEmail`.
  - Minimalna długość hasła (≥8) w `register`.
- W `AuthService`:
  - `register`:
    1. Sprawdzenie istnienia użytkownika (unikalność email).
    2. Hashowanie hasła bcrypt z 10 salt rounds.
    3. Zapis do bazy (TypeORM) i zwrot DTO.
    4. Obsługa konfliktów SQL (kod 23505) i wyjątków NestJS.
  - `login`:
    1. Wyszukanie użytkownika wg email.
    2. Porównanie haseł (`bcrypt.compare`).
    3. Aktualizacja `last_login_at`.
    4. Generowanie accessToken i refreshToken via `JwtService.sign` (`expiresIn: '30d'`).
  - `oauthLogin`:
    1. Weryfikacja tokenu Google/Apple (`google-auth-library`, `apple-signin-auth`).
    2. Upsert użytkownika i relacji OAuth w `UserOAuthProviderEntity`.
    3. Generowanie tokenów JWT.
  - `logout`:
    - Chroniony `JwtAuthGuard`, placeholder dla blacklisting tokenów (TODO).

### 2.4 Obsługa wyjątków

- Kontroler rzuca:
  - `BadRequestException` (400) – niepoprawny format email/hasła.
- Serwis rzuca:
  - `ConflictException` (409) – email już istnieje.
  - `UnauthorizedException` (401) – nieprawidłowe poświadczenia lub OAuth.
  - `InternalServerErrorException` (500) – nieoczekiwane błędy (logowane w `Logger`).

### 2.5 Dokumentacja i narzędzia wspierające

- Dekoratory Swagger (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`, `@ApiBearerAuth`) generują specyfikację OpenAPI.
- `JwtAuthGuard` zabezpiecza endpoint logout.

### 2.6 Mechanizm Row-Level Security (RLS)

- W bazie danych (PostgreSQL) RLS jest włączone na tabelach zależnych od `user_id` (np. `workout_plans`, `workout_sessions`, `exercise_sets`), co realizowane jest w migracjach SQL poprzez:

  - `ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY`.
  - `CREATE POLICY <nazwa_polityki> ON <tabela>` definiujące reguły dostępu:
    - Dla głównych tabel: `USING (user_id = current_setting('app.user_id')::uuid)` oraz `WITH CHECK (user_id = current_setting('app.user_id')::uuid)`.
    - Dla tabel powiązanych (np. `plan_exercises`, `session_exercises`, `exercise_sets`) polityki wykorzystują `EXISTS` z zapytaniem łączącym do tabel nadrzędnych, aby sprawdzić przynależność do aktualnego użytkownika.

- Na poziomie aplikacji NestJS parametr sesji PostgreSQL `app.user_id` jest ustawiany przed wykonaniem każdej operacji na bazie przez interceptor `RlsInterceptor` (`backend/src/common/interceptors/rls.interceptor.ts`):

  - Po przejściu przez `JwtAuthGuard` wyciągany jest `user.id` z żądania.
  - Interceptor wykonuje zapytanie:
    ```typescript
    await queryRunner.query(`SELECT set_config('app.user_id', $1, false)`, [
      userId,
    ]);
    ```
  - Dzięki temu każda kolejna operacja TypeORM uwzględnia aktualne `app.user_id` przy filtrowaniu danych.

- RLS gwarantuje, że nawet przy bezpośrednim odpytywaniu bazy dane innych użytkowników są całkowicie niedostępne, a polityki są egzekwowane na poziomie silnika bazy danych.

---

_Koniec specyfikacji._
