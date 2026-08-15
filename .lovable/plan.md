# Plan: dostęp administratora i domena e-mail

## Cel
Udzielić użytkownikowi dostępu do panelu administratora (`/admin`) oraz wyjaśnić możliwości konfiguracji domeny e-mail.

## Krok 1 — Nadanie ról administratora
Dodać rolę `admin` w tabeli `public.user_roles` dla dwóch wskazanych adresów e-mail:
- `kacperseta@gmail.com`
- `anonimpan62@gmail.com`

Wykonanie:
1. Sprawdzić, czy konta istnieją w `auth.users` i pobrać ich `id`.
2. Wstawić rekordy do `public.user_roles` z rolą `admin` (zabezpieczone przed duplikatami przez `ON CONFLICT`).
3. Po zalogowaniu się na jedno z tych kont przycisk „Panel admina” pojawi się automatycznie w `/konto`, a bezpośredni link `/admin` będzie dostępny.

## Krok 2 — Wyjaśnienie kwestii domeny e-mail
Lovable nie udostępnia darmowej domeny nadawczej. Aby wysyłać powiadomienia e-mail z własnym brandingiem (np. `Twoja Nazwa <powiadomienia@twojadomena.pl>`), konieczna jest własna domena lub subdomena istniejącej domeny użytkownika.

Opcje:
- **Własna domena** — np. zakupiona u dowolnego rejestratora (koszt ok. 10–70 zł/rok w zależności od rozszerzenia).
- **Subdomena istniejącej domeny** — jeśli użytkownik już posiada domenę, można użyć subdomeny typu `notify.twojadomena.pl`.

Bez skonfigurowanej domeny:
- Powiadomienia o zamówieniach nie zostaną wysłane (kod wysyłki pozostanie w trybie „log only”).
- Logowanie e-mailowe działa przez domyślne szablony Lovable, ale bez własnego nadawcy.

## Decyzje wymagane od użytkownika
1. Czy mam teraz nadać role administratora dla podanych dwóch adresów e-mail?
2. Czy użytkownik posiada własną domenę, którą chce skonfigurować do e-maili, czy rezygnuje z powiadomień e-mail na razie?
