<conversation_summary>
<decisions>

1. Użycie UUID z natywną funkcją `uuid_generate_v4()` dla kluczy głównych.
2. Utworzenie tabeli `user_oauth_providers` (user_id, provider_name, provider_user_id).
3. Implementacja tabeli `plan_exercises` z polem `display_order` i kluczami obcymi do `workout_plans` i `exercises`.
4. Modelowanie każdego zestawu jako wiersza w tabeli `exercise_sets` (session_exercise_id, set_type, set_index, reps, load).
5. Definicja PostgreSQL ENUM `intensity_technique`.
6. Pominięcie przechowywania AI-generowanych opisów w bazie (generacja w czasie rzeczywistym).
7. Dodanie indeksów B-tree na `(user_id, completed_at DESC)` i na `plan_id` w `workout_sessions`.
8. Włączenie RLS na tabelach zależnych od `user_id` z politykami opartymi na `current_setting('app.user_id')`.
9. Rezygnacja z partycjonowania na etapie MVP.
10. Dodanie ograniczeń CHECK: `reps ≥ 1`, `working_sets ∈ [0,4]`, `RPE ∈ [1,10]`, `load ≥ 0` z precyzją 0.1.
11. Użycie `VARCHAR(500)` z NOT NULL DEFAULT '' dla pól `notes`.
12. Stworzenie indeksu GIN trigram (`gin_trgm_ops`) na `exercises.name` dla autouzupełniania.
13. Dodanie ENUM `session_status` (`in_progress`,`completed`,`cancelled`) oraz pól `started_at` i nullable `completed_at`.
14. Dodanie pól `created_at TIMESTAMPTZ DEFAULT now()` i `updated_at TIMESTAMPTZ` ze triggerem aktualizującym.
15. Ustawienie `ON DELETE CASCADE` z `workout_plans`→`plan_exercises` i `workout_sessions`→`exercise_sets`, a `RESTRICT` na `users`.
16. Model jednosesyjny (single-tenant per user) bez dodatkowej kolumny `tenant_id`.
17. Brak konfiguracji backupów na poziomie schematu w MVP.
18. Zachowanie relacyjnego modelu; rezygnacja z JSONB dla danych głównych.
19. Unikalne ograniczenie `UNIQUE(user_id, plan_name)` na `workout_plans`.
20. Brak dedykowanego magazynowania ostatnich 3–5 wyników; odpytywanie w czasie rzeczywistym.
    </decisions>

<matched_recommendations>

1. UUID z `uuid_generate_v4()`.
2. Tabela `user_oauth_providers`.
3. Tabela `plan_exercises` z `display_order`.
4. Tabela `exercise_sets` z detalicznymi wierszami.
5. ENUM `intensity_technique`.
6. Opisy AI w runtime, nie w bazie.
7. Indeksy B-tree na kluczach `(user_id, completed_at)` i `plan_id`.
8. RLS z politykami per‐user.
9. Brak partycjonowania w MVP.
10. CHECK constraints dla wartości liczbowych.
11. `VARCHAR(500)` z limitem.
12. Indeks GIN trgm na `exercises.name`.
13. ENUM `session_status` i znaczniki czasu.
14. Metadane `created_at`/`updated_at`.
15. `ON DELETE CASCADE` i `RESTRICT`.
16. Model single‐tenant.
17. Brak backupów w schemacie.
18. Relacyjny model, bez JSONB.
19. `UNIQUE(user_id, plan_name)`.
20. Dynamiczne pobieranie historii wyników.
    </matched_recommendations>

<database_planning_summary>
Główne wymagania obejmują bezpieczne i wydajne przechowywanie danych użytkowników, planów treningowych, sesji oraz wyników ćwiczeń. Kluczowe encje to:

- `users` + `user_oauth_providers` (autoryzacja),
- `exercises` (statyczna lista),
- `workout_plans` i powiązana `plan_exercises` (szablony ćwiczeń z kolejnością i parametrami),
- `workout_sessions`, `session_exercises` i `exercise_sets` (logi sesji i zestawów).

Relacje:

- Jeden użytkownik ma wiele planów i sesji,
- Plany i ćwiczenia w relacji wiele-do-wielu z orderingiem,
- Sesje powiązane z ćwiczeniami planu i szczegółowymi zestawami.

Bezpieczeństwo:

- Klucze UUID dla unikalności,
- RLS na bazie `user_id` z polityką `current_setting('app.user_id')::uuid`,
- Ograniczenia referencyjne (`ON DELETE CASCADE/RESTRICT`).

Wydajność i skalowalność:

- Indeksy B-tree na kolumnach używanych do filtrowania (user_id, completed_at, plan_id),
- GIN trigram na `exercises.name` dla autouzupełniania,
- Monitorowanie wzrostu danych przed wprowadzeniem partycjonowania.

Dodatkowe elementy:

- ENUMy dla kontroli dopuszczalnych wartości,
- CHECK constraints dla spójności danych,
- Pola auditowe (`created_at`, `updated_at`).
  </database_planning_summary>

<unresolved_issues>
Brak istotnych nierozwiązanych kwestii na etapie MVP.  
</unresolved_issues>
</conversation_summary>
