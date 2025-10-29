# Konfiguracja bazy danych testowej dla testów E2E

## ⚠️ WAŻNE OSTRZEŻENIE

Testy E2E **USUWAJĄ WSZYSTKIE DANE** z bazy danych podczas uruchamiania!

**NIGDY nie uruchamiaj testów E2E na bazie produkcyjnej lub developerskiej!**

## 🛡️ Wbudowane zabezpieczenia

Dodaliśmy mechanizmy bezpieczeństwa w `global-setup.ts`:

1. **Wymagany plik `.env.test`** - testy ładują konfigurację tylko z tego pliku
2. **Blacklista nazw baz** - testy odmówią uruchomienia na bazach:
   - `myapp_dev`
   - `myapp_prod`
   - `myapp_production`
3. **Ostrzeżenie** - jeśli nazwa bazy nie zawiera słowa "test"

## 📋 Instrukcja krok po kroku

### Krok 1: Utwórz bazę testową w PostgreSQL

```bash
# Połącz się z PostgreSQL
psql -U postgres

# Utwórz bazę testową
CREATE DATABASE myapp_e2e;

# Wyjdź z psql
\q
```

### Krok 2: Utwórz plik `.env.test`

Utwórz plik `backend/.env.test` z następującą zawartością:

```bash
# Test Environment Configuration
# WARNING: All data in this database will be DELETED during tests!

# Database Configuration - MUSI BYĆ INNA NIŻ W .env!
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=myapp_e2e

# JWT Configuration (można użyć innych kluczy niż w production)
JWT_SECRET=test-jwt-secret-key-not-for-production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=test-refresh-token-secret-key-not-for-production
REFRESH_TOKEN_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=test
PORT=3000
```

**⚠️ UWAGA**: Plik `.env.test` jest ignorowany przez git (dodany do `.gitignore`)

### Krok 3: Uruchom migracje na bazie testowej

```bash
# Z katalogu backend/
DB_NAME=myapp_e2e npm run migration:run
```

### Krok 4: Uruchom testy

```bash
# Wszystkie testy E2E
npm run test:e2e

# Konkretny plik testowy
npm run test:e2e -- auth.e2e-spec.ts
```

## 🔍 Co się dzieje podczas testów?

### 1. Global Setup (`global-setup.ts`)

- Ładuje zmienne z `.env.test`
- Sprawdza czy nazwa bazy jest bezpieczna
- Usuwa wszystkie dane z tabel (DELETE FROM)
- Wstawia podstawowe ćwiczenia (Bench Press, Squat, Deadlift)

### 2. Przed każdym testem (`beforeEach`)

- Czyści bazę danych ponownie
- Zapewnia izolację testów

### 3. Global Teardown (`global-teardown.ts`)

- Czyści bazę po wszystkich testach
- Ładuje zmienne z `.env.test`

## 🎯 Weryfikacja konfiguracji

### Sprawdź czy baza testowa istnieje:

```bash
psql -U postgres -l | grep myapp_e2e
```

### Sprawdź zawartość `.env.test`:

```bash
cat backend/.env.test | grep DB_NAME
# Should show: DB_NAME=myapp_e2e
```

### Test connection:

```bash
psql -U postgres -d myapp_e2e -c "SELECT current_database();"
```

## 🐛 Rozwiązywanie problemów

### Problem: "DB_NAME is not set in environment variables"

**Przyczyna**: Brak pliku `.env.test`

**Rozwiązanie**: Utwórz plik `.env.test` zgodnie z Krokiem 2

---

### Problem: "Refusing to run E2E tests on database: myapp_dev"

**Przyczyna**: W `.env.test` jest ustawiona nazwa bazy developerskiej

**Rozwiązanie**:

```bash
# W pliku .env.test zmień:
DB_NAME=myapp_e2e  # nie 'myapp_dev'!
```

---

### Problem: "relation does not exist"

**Przyczyna**: Nie uruchomiono migracji na bazie testowej

**Rozwiązanie**:

```bash
DB_NAME=myapp_e2e npm run migration:run
```

---

### Problem: Testy są bardzo wolne

**Przyczyna**: Testy E2E używają prawdziwej bazy danych

**To jest normalne**. Testy E2E są wolniejsze niż unit testy, bo:

- Łączą się z PostgreSQL
- Wykonują prawdziwe zapytania SQL
- Czyszczą bazę przed każdym testem

**Jeśli chcesz szybszych testów**: Użyj unit testów z mockami dla testowania logiki biznesowej

---

### Problem: "password authentication failed"

**Przyczyna**: Nieprawidłowe credentials w `.env.test`

**Rozwiązanie**: Sprawdź username i password w `.env.test`

## 📊 Porównanie z innymi podejściami

### Java/Spring Boot

```java
@SpringBootTest
@Transactional  // Automatyczny rollback
@AutoConfigureTestDatabase
```

### NestJS/TypeScript (to rozwiązanie)

```typescript
// Ręczne czyszczenie przez DELETE FROM
beforeEach(async () => {
  await cleanupDatabase(app);
});
```

### Alternatywy

- **Docker containers** - Nowy kontener przed każdym testem (wolniejsze, ale najbezpieczniejsze)
- **Transakcje z rollback** - Jak w Spring Boot (bardziej skomplikowane do zaimplementowania)
- **In-memory database** - SQLite (szybkie, ale testuje inną bazę niż produkcyjna)

## ✅ Checklist przed uruchomieniem testów

- [ ] Utworzona baza `myapp_e2e`
- [ ] Utworzony plik `.env.test`
- [ ] W `.env.test` ustawione `DB_NAME=myapp_e2e`
- [ ] Uruchomione migracje: `DB_NAME=myapp_e2e npm run migration:run`
- [ ] Zainstalowane zależności: `npm install`
- [ ] PostgreSQL jest uruchomiony

## 🔗 Dodatkowe zasoby

- [README.md](./README.md) - Pełna dokumentacja testów E2E
- [test-utils.ts](./test-utils.ts) - Funkcje pomocnicze dla testów
- [global-setup.ts](./global-setup.ts) - Konfiguracja przed testami
- [global-teardown.ts](./global-teardown.ts) - Czyszczenie po testach

## 🤝 Dla zespołu

Każdy developer powinien:

1. Mieć własną lokalną bazę testową
2. Nie commitować pliku `.env.test` do repozytorium
3. Uruchamiać testy przed każdym pull requestem
4. Zgłaszać problemy z testami natychmiast

## 🚀 CI/CD

Dla pipeline'ów CI/CD (GitHub Actions, GitLab CI, itp.):

```yaml
# Przykład dla GitHub Actions
- name: Setup test database
  run: |
    psql -U postgres -c "CREATE DATABASE myapp_e2e"

- name: Create .env.test
  run: |
    echo "DB_NAME=myapp_e2e" > backend/.env.test
    echo "DB_HOST=localhost" >> backend/.env.test
    # ... pozostałe zmienne

- name: Run migrations
  run: DB_NAME=myapp_e2e npm run migration:run

- name: Run E2E tests
  run: npm run test:e2e
```
