import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Logowanie — Wirtualny Antykwariat" },
      { name: "description", content: "Zaloguj się lub utwórz konto, aby kupować starocie i śledzić zamówienia." },
      { property: "og:title", content: "Logowanie do Wirtualnego Antykwariatu" },
      { property: "og:description", content: "Konto klienta, koszyk i historia zamówień." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate({ to: "/konto" });
  }, [user, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          });
    setBusy(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    if (mode === "register" && !result.data.session) {
      toast.success("Sprawdź skrzynkę i potwierdź adres e-mail.");
      return;
    }
    navigate({ to: "/konto" });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Nie udało się zalogować przez Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/konto" });
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-4xl">{mode === "login" ? "Zaloguj się" : "Utwórz konto"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Konto pozwala kupować, śledzić zamówienia i wystawiać własne starocie.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" variant="brass" className="w-full" disabled={busy}>
          {mode === "login" ? "Zaloguj" : "Zarejestruj"}
        </Button>
      </form>

      <Button variant="outline" className="mt-3 w-full" onClick={google}>
        Kontynuuj z Google
      </Button>

      <button
        type="button"
        className="mt-6 text-sm text-primary hover:underline"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? "Nie masz konta? Zarejestruj się" : "Masz konto? Zaloguj się"}
      </button>
    </main>
  );
}
