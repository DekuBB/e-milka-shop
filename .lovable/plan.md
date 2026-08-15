# Status wcześniejszych poleceń + plan dokończenia

## Co sprawdziłem (stan faktyczny)

| Polecenie | Status |
| --- | --- |
| Rola `admin` dla `kacperseta@gmail.com` i `anonimpan62@gmail.com` | NIE wykonane — oba konta mają w bazie tylko rolę `customer` |
| Domena e-mail (własny nadawca powiadomień) | NIE skonfigurowana — brak domeny, wysyłka nadal w trybie „tylko log” |
| Integracje agentowe (MCP) | NIE wykonane — brak `src/lib/mcp/`, brak wtyczki MCP w `vite.config.ts` |
| Panel `/admin` (kod, UI, funkcje serwerowe) | Wykonane wcześniej i obecne w projekcie |
| Lupa / obrót 360°, koszyk, kasa, wyszukiwarka, wystawianie z AI | Wykonane wcześniej i obecne w projekcie |

Powód: poprzednia sesja została zatrzymana w trybie planowania, więc żadna zmiana danych ani kodu nie została zastosowana.

## Krok 1 — Nadanie ról administratora
Dodać rolę `admin` w `public.user_roles` dla obu adresów (bez usuwania roli `customer`, zabezpieczenie `ON CONFLICT DO NOTHING`). Po odświeżeniu strony w `/konto` pojawi się przycisk „Panel admina”, a `/admin` będzie działać.

## Krok 2 — Integracje agentowe (MCP)
Dodać serwer MCP aplikacji, aby dało się z niej korzystać z ChatGPT/Claude/Lovable:
- instalacja `@lovable.dev/mcp-js`, wtyczka MCP w `vite.config.ts`, definicja serwera w `src/lib/mcp/`
- narzędzia: przeglądanie pokoi i przedmiotów, wyszukiwanie w katalogu, podgląd własnych zamówień
- zabezpieczenie logowaniem OAuth, aby narzędzia działały „jako zalogowany użytkownik” i respektowały reguły dostępu do danych
- ikona (favicon) dla listy konektorów

## Krok 3 — Domena e-mail
Bez własnej domeny nie da się wysyłać powiadomień z własnym nadawcą (Lovable nie daje darmowej domeny nadawczej). Opcje: kupno domeny (~10–70 zł/rok) lub subdomena istniejącej domeny (np. `powiadomienia.twojadomena.pl`). Po podaniu domeny podłączę ją i włączę realną wysyłkę — kod szablonów jest już gotowy.

## Szczegóły techniczne
- Role: `INSERT INTO public.user_roles (user_id, role)` z podzapytaniem po e-mailu z `auth.users`.
- MCP: narzędzia w `src/lib/mcp/tools/*`, rejestracja w `src/lib/mcp/index.ts`, dostęp do bazy przez token użytkownika (RLS), trasy generuje wtyczka.
- E-mail: `src/lib/email.server.ts` już obsługuje klucz API i `EMAIL_FROM`, wystarczy konfiguracja domeny.

## Zakres do zatwierdzenia
Wykonać Krok 1 i Krok 2 teraz; Krok 3 dopiero po podaniu domeny.
