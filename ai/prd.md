# Dokument wymagań produktu (PRD) - MyWorkout

## 1. Przegląd produktu

MyWorkout to internetowa aplikacja do śledzenia treningów, zaprojektowana dla doświadczonych entuzjastów fitness, którzy samodzielnie programują swoje treningi i potrzebują prostego, ale skutecznego narzędzia do monitorowania swoich postępów. Aplikacja koncentruje się na dostarczaniu podstawowych funkcji bez zbędnych dodatków, które często spotyka się w aplikacjach skierowanych do początkujących. MVP (Minimum Viable Product) ma na celu zapewnienie kluczowych funkcjonalności, takich jak tworzenie planów treningowych, rejestrowanie wykonanych treningów, przeglądanie historii oraz inteligentne podpowiedzi dotyczące techniki ćwiczeń, wspierane przez AI.

Grupą docelową są osoby, takie jak trójboiści siłowi i kulturyści, którzy posiadają wiedzę na temat programowania treningowego i potrzebują narzędzia do śledzenia, a nie do prowadzenia.

## 2. Problem użytkownika

Większość dostępnych na rynku aplikacji do śledzenia treningów jest przeznaczona dla osób, które nie wiedzą, jak powinien wyglądać ich plan treningowy, oferując gotowe szablony i porady. Z kolei doświadczeni użytkownicy, którzy potrafią samodzielnie tworzyć plany treningowe, potrzebują jedynie prostego i efektywnego sposobu na śledzenie swoich sesji i postępów. Obecne rozwiązania są dla nich zbyt skomplikowane, przeładowane funkcjami i niepotrzebnie ograniczające. MyWorkout rozwiązuje ten problem, dostarczając minimalistyczne narzędzie skupione wyłącznie na śledzeniu danych treningowych.

## 3. Wymagania funkcjonalne

### 3.1. System kont użytkowników

- Uwierzytelnianie za pomocą adresu e-mail i hasła.
- Opcjonalne uwierzytelnianie przez dostawców OAuth (Google, Apple).
- Profil użytkownika przechowuje e-mail, datę utworzenia konta i datę ostatniego logowania.
- Adres e-mail jest używany do identyfikacji użytkownika, nie jest wymagana nazwa użytkownika.

### 3.2. Tryb Planu - Tworzenie planów treningowych

- Użytkownik może tworzyć, edytować i usuwać plany treningowe.
- Każdy użytkownik może mieć nieograniczoną liczbę planów.
- Każdy plan może zawierać nieograniczoną liczbę ćwiczeń.
- Plany działają jak szablony do wielokrotnego użytku.
- Każde ćwiczenie w planie musi mieć zdefiniowane:
  - Nazwę ćwiczenia (wybieraną z predefiniowanej listy).
  - Technikę intensywności (drop set, pauza, częściowe wydłużone, do upadku, superseria, N/A).
  - Liczbę serii rozgrzewkowych (wymagane, numeryczne).
  - Liczbę serii roboczych (wymagane, numeryczne, maks. 4).
  - Docelową liczbę powtórzeń na serię (wymagane, numeryczne).
  - RPE dla wczesnych serii (wymagane, skala 1-10).
  - RPE dla ostatniej serii (wymagane, skala 1-10).
  - Czas odpoczynku w sekundach (wymagane, numeryczne).
  - Opcjonalne notatki (maks. 500 znaków).

### 3.3. Tryb Treningu - Realizacja treningu

- Użytkownik wybiera plan treningowy z listy, aby rozpocząć sesję.
- Ćwiczenia są wyświetlane w kolejności z planu, ale można je wykonywać w dowolnej sekwencji.
- Dla każdego ćwiczenia interfejs wyświetla:
  - Nazwę ćwiczenia wraz z automatycznie rozwiniętym (ale zwijanym) opisem techniki od AI.
  - Docelowe wartości RPE i czas odpoczynku (tylko do odczytu).
  - Historię 3-5 ostatnich wyników dla danego ćwiczenia (widok zwijany).
  - Pola do wprowadzania faktycznej liczby powtórzeń i obciążenia (w kg, z dokładnością do jednego miejsca po przecinku).
- Zapis treningu odbywa się manualnie; brak funkcji auto-zapisu.
- Możliwy jest zapis częściowo ukończonego treningu.

### 3.4. Historia treningów

- Ukończone treningi są wyświetlane na chronologicznej liście (data i nazwa planu).
- Kliknięcie na wpis w historii wyświetla pełne szczegóły danego treningu.
- Użytkownik ma możliwość edycji lub usunięcia każdego zapisanego treningu.

### 3.5. Baza danych ćwiczeń i opisy AI

- Aplikacja zawiera predefiniowaną listę 100-150 popularnych ćwiczeń siłowych.
- Wyszukiwarka z autouzupełnianiem ułatwia znalezienie ćwiczenia.
- MVP nie wspiera dodawania własnych ćwiczeń.
- Opisy techniki generowane przez AI są wyświetlane automatycznie po wybraniu ćwiczenia.

### 3.6. Walidacja danych

- Pola numeryczne (powtórzenia, serie, obciążenie) muszą akceptować tylko odpowiednie wartości.
- Nazwa planu oraz dodanie co najmniej jednego ćwiczenia są wymagane do zapisania planu.
- Obowiązują limity znaków: 100 dla nazwy planu, 500 dla notatek.

## 4. Granice produktu

Następujące funkcje nie wchodzą w zakres MVP:

- Natywne aplikacje mobilne (iOS/Android).
- Funkcje kopiowania/duplikowania planów treningowych.
- Wizualizacje postępów i analityka.
- Obliczanie objętości treningowej.
- Funkcjonalność offline (PWA).
- Możliwość tworzenia własnych ćwiczeń przez użytkownika.
- System zbierania opinii od użytkowników.
- Automatyczne zapisywanie treningu.
- Konwersja jednostek (np. na funty).
- Planowanie treningów w ujęciu tygodniowym/miesięcznym.
- Funkcje społecznościowe.
- System płatności/subskrypcji.

## 5. Historyjki użytkowników

### Uwierzytelnianie

- ID: US-001
- Tytuł: Rejestracja użytkownika za pomocą e-maila i hasła
- Opis: Jako nowy użytkownik, chcę móc zarejestrować konto za pomocą mojego adresu e-mail i hasła, abym mógł uzyskać dostęp do aplikacji i zapisywać swoje dane.
- Kryteria akceptacji:

  1. Formularz rejestracji zawiera pola na adres e-mail i hasło.
  2. Istnieje walidacja formatu adresu e-mail.
  3. Hasło musi spełniać minimalne wymagania bezpieczeństwa (np. długość).
  4. System sprawdza, czy e-mail nie jest już zarejestrowany.
  5. Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany do głównego panelu aplikacji.

- ID: US-002
- Tytuł: Logowanie użytkownika za pomocą e-maila i hasła
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto za pomocą e-maila i hasła, abym mógł kontynuować śledzenie moich treningów.
- Kryteria akceptacji:

  1. Formularz logowania zawiera pola na adres e-mail i hasło.
  2. W przypadku podania błędnych danych uwierzytelniających, wyświetlany jest stosowny komunikat.
  3. Po pomyślnym zalogowaniu, użytkownik jest przekierowany do głównego panelu aplikacji.

- ID: US-003
- Tytuł: Logowanie za pomocą konta Google
- Opis: Jako użytkownik, chcę mieć możliwość zalogowania się za pomocą mojego konta Google, aby proces logowania był szybszy i wygodniejszy.
- Kryteria akceptacji:

  1. Na stronie logowania znajduje się przycisk "Zaloguj się z Google".
  2. Po kliknięciu, następuje przekierowanie do standardowego procesu uwierzytelniania Google.
  3. Po pomyślnym uwierzytelnieniu, użytkownik jest zalogowany w aplikacji MyWorkout.
  4. Jeśli jest to pierwsze logowanie danym kontem Google, w systemie tworzone jest nowe konto użytkownika.

- ID: US-004
- Tytuł: Logowanie za pomocą konta Apple
- Opis: Jako użytkownik, chcę mieć możliwość zalogowania się za pomocą mojego konta Apple, aby proces logowania był szybszy i wygodniejszy.
- Kryteria akceptacji:

  1. Na stronie logowania znajduje się przycisk "Zaloguj się z Apple".
  2. Po kliknięciu, następuje przekierowanie do standardowego procesu uwierzytelniania Apple.
  3. Po pomyślnym uwierzytelnieniu, użytkownik jest zalogowany w aplikacji MyWorkout.
  4. Jeśli jest to pierwsze logowanie danym kontem Apple, w systemie tworzone jest nowe konto użytkownika.

- ID: US-005
- Tytuł: Wylogowanie z aplikacji
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować z mojego konta, aby zabezpieczyć moje dane na urządzeniach współdzielonych.
- Kryteria akceptacji:
  1. W interfejsie użytkownika dostępny jest przycisk "Wyloguj".
  2. Po kliknięciu przycisku, sesja użytkownika jest kończona, a on sam zostaje przekierowany na stronę logowania.

### Zarządzanie Planami Treningowymi

- ID: US-006
- Tytuł: Przeglądanie listy planów treningowych
- Opis: Jako użytkownik, chcę widzieć listę wszystkich moich planów treningowych, abym mógł łatwo zarządzać nimi lub wybrać jeden do rozpoczęcia treningu.
- Kryteria akceptacji:

  1. Po przejściu do "Trybu Planu" wyświetlana jest lista wszystkich utworzonych przez użytkownika planów.
  2. Jeśli użytkownik nie ma żadnych planów, wyświetlany jest komunikat "Brak planów" oraz przycisk wzywający do działania (CTA) "Stwórz nowy plan".

- ID: US-007
- Tytuł: Tworzenie nowego planu treningowego
- Opis: Jako użytkownik, chcę móc stworzyć nowy plan treningowy, abym mógł zdefiniować strukturę moich przyszłych treningów.
- Kryteria akceptacji:

  1. W "Trybie Planu" znajduje się przycisk "Stwórz nowy plan".
  2. Po kliknięciu, użytkownik może wprowadzić nazwę planu.
  3. Nazwa planu jest wymagana i nie może przekraczać 100 znaków.
  4. Plan musi zawierać co najmniej jedno ćwiczenie, aby można go było zapisać.
  5. Po zapisaniu, nowy plan pojawia się na liście planów.

- ID: US-008
- Tytuł: Dodawanie ćwiczenia do planu treningowego
- Opis: Jako użytkownik, podczas tworzenia lub edycji planu, chcę móc dodawać ćwiczenia, aby zbudować kompletny plan treningowy.
- Kryteria akceptacji:

  1. W formularzu planu znajduje się opcja "Dodaj ćwiczenie".
  2. Użytkownik może wyszukać ćwiczenie z predefiniowanej listy (autouzupełnianie).
  3. Po wybraniu ćwiczenia, pojawiają się pola do zdefiniowania parametrów: technika intensywności, serie rozgrzewkowe/robocze, powtórzenia, RPE, czas odpoczynku, notatki.
  4. Wszystkie wymagane pola muszą zostać wypełnione.
  5. Użytkownik może dodać wiele ćwiczeń do jednego planu.

- ID: US-009
- Tytuł: Edycja ćwiczenia w planie treningowym
- Opis: Jako użytkownik, chcę mieć możliwość edycji parametrów ćwiczenia w istniejącym planie, aby dostosować go do moich aktualnych celów.
- Kryteria akceptacji:

  1. Przy każdym ćwiczeniu na liście w planie znajduje się opcja "Edytuj".
  2. Po jej wybraniu, użytkownik może modyfikować wszystkie zdefiniowane wcześniej parametry ćwiczenia.
  3. Zmiany są zapisywane po zatwierdzeniu edycji planu.

- ID: US-010
- Tytuł: Usuwanie ćwiczenia z planu treningowego
- Opis: Jako użytkownik, chcę mieć możliwość usunięcia ćwiczenia z planu, jeśli uznam, że nie jest już potrzebne.
- Kryteria akceptacji:

  1. Przy każdym ćwiczeniu na liście w planie znajduje się opcja "Usuń".
  2. Po kliknięciu, użytkownik jest proszony o potwierdzenie operacji w oknie modalnym.
  3. Po potwierdzeniu, ćwiczenie jest trwale usuwane z planu.

- ID: US-011
- Tytuł: Zmiana nazwy planu treningowego
- Opis: Jako użytkownik, chcę móc zmienić nazwę istniejącego planu treningowego, aby lepiej odzwierciedlała jego zawartość.
- Kryteria akceptacji:

  1. W widoku edycji planu, pole z nazwą jest edytowalne.
  2. Nazwa planu musi pozostać niepusta i nie przekraczać 100 znaków.
  3. Po zapisaniu planu, nowa nazwa jest widoczna na liście planów.

- ID: US-012
- Tytuł: Usuwanie planu treningowego
- Opis: Jako użytkownik, chcę móc usunąć cały plan treningowy, gdy nie jest mi już potrzebny.
- Kryteria akceptacji:
  1. Na liście planów lub w widoku edycji planu znajduje się opcja "Usuń plan".
  2. Użytkownik musi potwierdzić chęć usunięcia planu w oknie modalnym.
  3. Po potwierdzeniu, plan jest trwale usuwany i znika z listy.

### Realizacja Treningu

- ID: US-013
- Tytuł: Rozpoczynanie sesji treningowej
- Opis: Jako użytkownik, chcę rozpocząć sesję treningową na podstawie jednego z moich planów, aby móc rejestrować swoje wyniki.
- Kryteria akceptacji:

  1. W "Trybie Treningu" wyświetlana jest lista moich planów treningowych.
  2. Po wybraniu planu, aplikacja przechodzi do interfejsu rejestrowania treningu.
  3. Wyświetlana jest lista ćwiczeń z wybranego planu.

- ID: US-014
- Tytuł: Przeglądanie szczegółów ćwiczenia podczas treningu
- Opis: Jako użytkownik, podczas wykonywania ćwiczenia, chcę widzieć jego szczegóły, takie jak opis techniki i historia wyników, aby trenować efektywnie i bezpiecznie.
- Kryteria akceptacji:

  1. Dla każdego ćwiczenia na liście, automatycznie rozwija się opis techniki od AI (z możliwością zwinięcia).
  2. Wyświetlane są dane tylko do odczytu z planu: docelowe RPE i czas odpoczynku.
  3. Dostępna jest zwijana sekcja pokazująca wyniki (obciążenie, powtórzenia) z 3-5 ostatnich sesji dla tego ćwiczenia.

- ID: US-015
- Tytuł: Rejestrowanie danych dla serii ćwiczenia
- Opis: Jako użytkownik, chcę móc wprowadzić liczbę powtórzeń i użyte obciążenie dla każdej wykonanej serii (rozgrzewkowej i roboczej), aby precyzyjnie śledzić swój trening.
- Kryteria akceptacji:

  1. Interfejs zawiera osobne sekcje dla serii rozgrzewkowych i roboczych, zgodnie z planem.
  2. Dla każdej serii dostępne są pola do wpisania faktycznej liczby powtórzeń i obciążenia (w kg).
  3. Pole obciążenia akceptuje wartości dziesiętne z dokładnością do jednego miejsca po przecinku.
  4. Dla każdego ćwiczenia dostępne jest jedno pole na notatki.

- ID: US-016
- Tytuł: Zapisywanie ukończonej sesji treningowej
- Opis: Jako użytkownik, po zakończeniu treningu, chcę móc zapisać całą sesję, aby została ona dodana do mojej historii.
- Kryteria akceptacji:

  1. W interfejsie treningu znajduje się przycisk "Zapisz trening".
  2. Użytkownik jest proszony o potwierdzenie zapisu.
  3. Możliwe jest zapisanie treningu nawet, jeśli nie wszystkie ćwiczenia zostały wykonane.
  4. Po zapisaniu, użytkownik jest informowany o sukcesie, a sesja pojawia się w historii treningów.

- ID: US-017
- Tytuł: Anulowanie sesji treningowej bez zapisu
- Opis: Jako użytkownik, chcę mieć możliwość porzucenia trwającej sesji treningowej bez zapisywania danych, jeśli zdecyduję się jej nie kończyć.
- Kryteria akceptacji:
  1. Użytkownik może opuścić widok treningu w dowolnym momencie.
  2. Jeśli w sesji wprowadzono jakiekolwiek dane, przy próbie opuszczenia widoku pojawia się ostrzeżenie o utracie niezapisanych zmian.
  3. Jeśli użytkownik potwierdzi chęć opuszczenia, dane z bieżącej sesji nie są zapisywane.

### Historia Treningów

- ID: US-018
- Tytuł: Przeglądanie historii treningów
- Opis: Jako użytkownik, chcę mieć dostęp do chronologicznej listy moich wszystkich zapisanych treningów, abym mógł analizować swoją historię.
- Kryteria akceptacji:

  1. W dedykowanej sekcji "Historia" wyświetlana jest lista ukończonych treningów, posortowana od najnowszego.
  2. Każdy wpis na liście pokazuje co najmniej datę i nazwę planu treningowego.
  3. Jeśli historia jest pusta, wyświetlany jest odpowiedni komunikat i CTA.

- ID: US-019
- Tytuł: Wyświetlanie szczegółów historycznego treningu
- Opis: Jako użytkownik, chcę móc zobaczyć pełne szczegóły konkretnego treningu z przeszłości, aby dokładnie przeanalizować, co wtedy zrobiłem.
- Kryteria akceptacji:

  1. Kliknięcie na wpis w historii treningów przekierowuje do widoku szczegółowego.
  2. Widok szczegółowy pokazuje wszystkie ćwiczenia wykonane podczas tej sesji, wraz z zapisanymi danymi (serie, powtórzenia, obciążenie, notatki).

- ID: US-020
- Tytuł: Edycja zapisanego treningu w historii
- Opis: Jako użytkownik, chcę mieć możliwość edycji danych w zapisanym treningu, na wypadek gdybym popełnił błąd podczas wprowadzania danych.
- Kryteria akceptacji:

  1. W widoku szczegółów historycznego treningu znajduje się opcja "Edytuj".
  2. Umożliwia ona modyfikację wszystkich wprowadzonych danych (powtórzenia, obciążenie, notatki).
  3. Po zapisaniu zmian, są one trwale aktualizowane w historii.

- ID: US-021
- Tytuł: Usuwanie treningu z historii
- Opis: Jako użytkownik, chcę mieć możliwość usunięcia treningu z mojej historii, jeśli został on zapisany przez pomyłkę lub z innych powodów.
- Kryteria akceptacji:
  1. W widoku szczegółów lub na liście historii znajduje się opcja "Usuń".
  2. Użytkownik musi potwierdzić chęć usunięcia wpisu w oknie modalnym.
  3. Po potwierdzeniu, trening jest trwale usuwany z historii.

## 6. Metryki sukcesu

- Osiągnięcie 100 aktywnych użytkowników w ciągu pierwszych 3 miesięcy od uruchomienia.
- Wysoki wskaźnik pomyślnego tworzenia i realizacji planów treningowych przez użytkowników.
- Zapewnienie stabilności systemu, bez przypadków utraty danych podczas zapisywania treningów.
