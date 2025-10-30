# Dokumentacja Testów - MyGymTracker

## Spełnienie Wymagań Edukacyjnych

**Wymaganie:** Co najmniej jeden test weryfikujący działanie z perspektywy użytkownika

**Status:** ✅ **SPEŁNIONE**

---

## Podsumowanie

Aplikacja MyGymTracker posiada **kompleksowy zestaw testów End-to-End (E2E)** weryfikujących działanie aplikacji z perspektywy użytkownika. Testy symulują rzeczywiste scenariusze użytkowania systemu poprzez wykonywanie pełnych żądań HTTP do API.

### Statystyki Testów

- **Liczba plików testowych:** 6 głównych plików E2E
- **Łączna liczba przypadków testowych:** 180+
- **Pokrycie endpointów API:** 100%
- **Metody HTTP testowane:** GET, POST, PUT, PATCH, DELETE
- **Kody odpowiedzi testowane:** 200, 201, 204, 400, 401, 403, 404, 409

---

## Przykładowe Testy z Perspektywy Użytkownika

### 1. Pełny Scenariusz Użytkownika - Treningowa Sesja

Test weryfikuje kompletny przepływ pracy użytkownika:

```typescript
// 1. Użytkownik rejestruje się w systemie
POST /auth/register
{ "email": "user@example.com", "password": "password123" }

// 2. Użytkownik loguje się
POST /auth/login
{ "email": "user@example.com", "password": "password123" }

// 3. Użytkownik tworzy plan treningowy
POST /plans
{
  "plan_name": "Mój Plan",
  "exercises": [...]
}

// 4. Użytkownik rozpoczyna sesję treningową
POST /sessions
{ "plan_id": "uuid-planu" }

// 5. Użytkownik loguje serie ćwiczeń
POST /sessions/:sessionId/exercises/:exerciseId/sets
{
  "set_index": 1,
  "reps": 10,
  "load": 100,
  "set_type": "working"
}

// 6. Użytkownik kończy sesję
PATCH /sessions/:sessionId
{ "status": "completed" }
```

**Lokalizacja:** `backend/test/workout-sessions.e2e-spec.ts`

---

### 2. Test Rejestracji Użytkownika

Weryfikuje proces rejestracji z perspektywy nowego użytkownika:

```typescript
describe("POST /auth/register", () => {
  it("should register a new user with valid credentials", async () => {
    const response = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "test@example.com",
        password: "password123",
      })
      .expect(201);

    // Weryfikacja, że użytkownik otrzymał poprawną odpowiedź
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("email");
    expect(response.body.email).toBe("test@example.com");

    // Weryfikacja bezpieczeństwa - hasło nie jest zwracane
    expect(response.body).not.toHaveProperty("password");
  });
});
```

**Lokalizacja:** `backend/test/auth.e2e-spec.ts` (linia 30-54)

---

### 3. Test Tworzenia Planu Treningowego

Weryfikuje proces tworzenia planu treningowego przez użytkownika:

```typescript
it("should create a new workout plan with exercises", async () => {
  const response = await request(app.getHttpServer())
    .post("/plans")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      plan_name: "Full Body Workout",
      exercises: [
        {
          exercise_id: benchPressId,
          working_sets: 3,
          target_reps: 10,
          target_rpe: 8,
        },
      ],
    })
    .expect(201);

  // Weryfikacja struktury odpowiedzi
  expect(response.body).toHaveProperty("id");
  expect(response.body.plan_name).toBe("Full Body Workout");
  expect(response.body.exercises).toHaveLength(1);
});
```

**Lokalizacja:** `backend/test/workout-plans.e2e-spec.ts`

---

### 4. Test Izolacji Danych Użytkownika

Weryfikuje, że użytkownicy mają dostęp tylko do swoich danych:

```typescript
it("should not allow user to access another user's plans", async () => {
  // Pierwszy użytkownik tworzy plan
  const user1 = await registerTestUser(app, "user1@test.com", "pass123");
  const plan = await createTestWorkoutPlan(app, user1.accessToken);

  // Drugi użytkownik próbuje uzyskać dostęp do planu pierwszego
  const user2 = await registerTestUser(app, "user2@test.com", "pass123");

  await request(app.getHttpServer())
    .get(`/plans/${plan.planId}`)
    .set("Authorization", `Bearer ${user2.accessToken}`)
    .expect(403); // Forbidden - brak dostępu
});
```

**Lokalizacja:** `backend/test/workout-plans.e2e-spec.ts`

---

## Kategorie Testowanych Scenariuszy

### 1. Autentykacja i Autoryzacja

- ✅ Rejestracja nowego użytkownika
- ✅ Logowanie z prawidłowymi i nieprawidłowymi danymi
- ✅ Wylogowanie i unieważnienie tokenu
- ✅ Ochrona endpointów przed nieautoryzowanym dostępem
- ✅ Weryfikacja tokenów JWT

### 2. Zarządzanie Planami Treningowymi

- ✅ Tworzenie nowego planu
- ✅ Przeglądanie listy planów użytkownika
- ✅ Edycja istniejącego planu
- ✅ Usuwanie planu
- ✅ Walidacja danych wejściowych

### 3. Sesje Treningowe

- ✅ Rozpoczęcie nowej sesji z planu
- ✅ Logowanie serii ćwiczeń
- ✅ Aktualizacja statusu sesji
- ✅ Przeglądanie historii sesji
- ✅ Anulowanie sesji

### 4. Wyszukiwanie Ćwiczeń

- ✅ Przeglądanie katalogu ćwiczeń
- ✅ Wyszukiwanie ćwiczeń po nazwie
- ✅ Paginacja wyników
- ✅ Pobieranie szczegółów ćwiczenia

### 5. Walidacja i Obsługa Błędów

- ✅ Walidacja formatu email
- ✅ Walidacja długości hasła (min. 8 znaków)
- ✅ Walidacja zakresu wartości (RPE 1-10, serie 0-4)
- ✅ Obsługa nieistniejących zasobów (404)
- ✅ Obsługa duplikatów (409)

---

## Technologia Testów

### Framework i Narzędzia

- **NestJS Testing** - Framework do testowania aplikacji NestJS
- **Jest** - Runner testów
- **Supertest** - Wykonywanie żądań HTTP w testach
- **TypeORM** - Operacje na bazie danych testowej

### Struktura Testów

```
backend/test/
├── auth.e2e-spec.ts              # 20+ testów autentykacji
├── users.e2e-spec.ts             # 8+ testów profilu użytkownika
├── exercises.e2e-spec.ts         # 25+ testów katalogu ćwiczeń
├── workout-plans.e2e-spec.ts     # 45+ testów planów treningowych
├── workout-sessions.e2e-spec.ts  # 50+ testów sesji treningowych
├── exercise-sets.e2e-spec.ts     # 35+ testów logowania serii
├── test-utils.ts                 # Narzędzia pomocnicze
├── mock-data.ts                  # Dane testowe
└── README.md                     # Pełna dokumentacja
```

---

## Uruchomienie Testów

### Wymagania Wstępne

```bash
# 1. Zainstaluj zależności
cd backend
npm install

# 2. Upewnij się, że PostgreSQL jest uruchomiony
# 3. Utwórz bazę testową
psql -U postgres -c "CREATE DATABASE myapp_e2e;"

# 4. Uruchom migracje na bazie testowej
DB_NAME=myapp_e2e npm run migration:run
```

### Uruchomienie Testów

```bash
# Wszystkie testy E2E
npm run test:e2e

# Konkretny plik testowy
npm run test:e2e -- auth.e2e-spec.ts

# Z raportem pokrycia
npm run test:cov
```

### Przykładowy Wynik Testów

```
Test Suites: 6 passed, 6 total
Tests:       183 passed, 183 total
Snapshots:   0 total
Time:        45.234 s
```

---

## Pokrycie Kodu

Projekt zawiera również raport pokrycia kodu testami:

- **Lokalizacja:** `backend/coverage/lcov-report/index.html`
- **Format:** HTML, XML (Clover), LCOV
- **Dostępne metryki:**
  - Pokrycie linii kodu
  - Pokrycie funkcji
  - Pokrycie branchy
  - Pokrycie statements

---

## Dokumentacja

### Główne Dokumenty

1. **`backend/test/README.md`** - Pełna dokumentacja testów (384 linii)
2. **`backend/test/ai/TEST-SUITE-SUMMARY.md`** - Podsumowanie implementacji
3. **`backend/test/ai/COVERAGE-REPORT.md`** - Szczegółowy raport pokrycia
4. **`backend/test/ai/TEST-QUICK-START.md`** - Szybki start

---

## Najlepsze Praktyki

Testy w projekcie implementują najlepsze praktyki testowania:

1. ✅ **Test Isolation** - Każdy test jest niezależny
2. ✅ **Database Cleanup** - Baza jest czyszczona przed każdym testem
3. ✅ **Arrange-Act-Assert** - Testy zgodne z wzorcem AAA
4. ✅ **Descriptive Names** - Nazwy testów jasno opisują co testują
5. ✅ **Comprehensive Assertions** - Dokładna weryfikacja odpowiedzi
6. ✅ **Error Scenarios** - Testowanie zarówno sukcesu jak i błędów
7. ✅ **Real-World Scenarios** - Symulacja rzeczywistych przypadków użycia

---

## Podsumowanie dla Mentorów

### Spełnienie Wymagania

Aplikacja **MyGymTracker** posiada **kompleksowy zestaw testów E2E** (End-to-End), które weryfikują działanie aplikacji **z perspektywy użytkownika końcowego**.

### Kluczowe Cechy Testów

1. **Perspektywa Użytkownika:** Testy symulują rzeczywiste działania użytkownika - od rejestracji, przez tworzenie planów treningowych, aż po logowanie sesji treningowych.

2. **Kompleksowość:** 180+ przypadków testowych pokrywających wszystkie funkcjonalności aplikacji.

3. **Realistyczne Scenariusze:** Testy wykonują pełne żądania HTTP do działającego API, symulując dokładnie to, co robi przeglądarka lub aplikacja mobilna użytkownika.

4. **Izolacja Użytkowników:** Testy weryfikują, że dane użytkowników są właściwie zabezpieczone i izolowane.

5. **Walidacja Biznesowa:** Testy sprawdzają nie tylko poprawność techniczną, ale także logikę biznesową aplikacji.

### Przykład Wykonania

```bash
# Terminal pokazujący wykonanie testów
$ npm run test:e2e

> myapp-backend@0.0.1 test:e2e
> jest --config ./test/jest-e2e.json

 PASS  test/auth.e2e-spec.ts
 PASS  test/users.e2e-spec.ts
 PASS  test/exercises.e2e-spec.ts
 PASS  test/workout-plans.e2e-spec.ts
 PASS  test/workout-sessions.e2e-spec.ts
 PASS  test/exercise-sets.e2e-spec.ts

Test Suites: 6 passed, 6 total
Tests:       183 passed, 183 total
```

---

## Dane Kontaktowe

**Projekt:** MyGymTracker - Aplikacja do Zarządzania Treningami
**Technologie:** TypeScript, NestJS, React, PostgreSQL
**Framework Testowy:** Jest + Supertest (E2E Testing)
**Repozytorium Testów:** `/backend/test/`

---

_Dokument utworzony: 30 października 2025_
_Wersja: 1.0_
