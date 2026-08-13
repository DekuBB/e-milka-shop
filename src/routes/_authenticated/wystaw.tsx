import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { analyzePhoto, createListing, type Suggestion } from "@/lib/listing.functions";
import { rooms } from "@/data/rooms";

export const Route = createFileRoute("/_authenticated/wystaw")({
  head: () => ({
    meta: [
      { title: "Wystaw starocie — Wirtualny Antykwariat" },
      {
        name: "description",
        content: "Wgraj zdjęcie starego przedmiotu, a AI zaproponuje nazwę, opis, kategorię i pokój.",
      },
      { property: "og:title", content: "Wystaw przedmiot z pomocą AI" },
      { property: "og:description", content: "Zdjęcie → opis → wirtualny pokój w antykwariacie." },
    ],
  }),
  component: ListingPage,
});

function ListingPage() {
  const analyze = useServerFn(analyzePhoto);
  const create = useServerFn(createListing);
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [form, setForm] = useState<Suggestion | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const runAi = async () => {
    if (!image) return;
    setBusy(true);
    try {
      setForm(await analyze({ data: { image, hint } }));
      toast.success("AI przygotowało opis — sprawdź i popraw.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!image || !form) return;
    setBusy(true);
    try {
      const created = await create({ data: { ...form, image } });
      toast.success("Przedmiot trafił do pokoju!");
      navigate({ to: "/pokoj/$slug", params: { slug: created.roomSlug } });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const set = (key: keyof Suggestion, value: string) =>
    setForm((prev) => (prev ? { ...prev, [key]: key === "price" ? (value ? Number(value) : null) : value } : prev));

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-4xl">📸 Wystaw starocie</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Wgraj zdjęcie — AI zaproponuje nazwę, kategorię, opis i pokój, w którym stanie przedmiot.
      </p>

      <div className="mt-8 space-y-4">
        <Input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) pick(file);
          }}
        />
        {image && <img src={image} alt="Podgląd zdjęcia" className="max-h-64 rounded-md border border-border/60" />}
        <Textarea
          value={hint}
          onChange={(event) => setHint(event.target.value)}
          placeholder="Wskazówki dla AI (opcjonalnie): co to jest, skąd pochodzi, wymiary…"
        />
        <Button variant="brass" onClick={runAi} disabled={!image || busy}>
          🧠 Opisz przedmiot z AI
        </Button>
      </div>

      {form && (
        <form onSubmit={save} className="mt-10 space-y-4 border-t border-border/60 pt-8">
          <Field label="Nazwa" value={form.name} onChange={(v) => set("name", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kategoria" value={form.category} onChange={(v) => set("category", v)} />
            <Field label="Ikona" value={form.icon} onChange={(v) => set("icon", v)} />
            <Field label="Stan" value={form.condition} onChange={(v) => set("condition", v)} />
            <Field label="Rok" value={form.year_label} onChange={(v) => set("year_label", v)} />
            <Field label="Wymiary" value={form.dimensions} onChange={(v) => set("dimensions", v)} />
            <Field
              label="Cena (zł)"
              value={form.price === null ? "" : String(form.price)}
              onChange={(v) => set("price", v)}
            />
          </div>
          <div>
            <Label htmlFor="room">Proponowany pokój</Label>
            <select
              id="room"
              value={form.room_slug}
              onChange={(event) => set("room_slug", event.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {rooms.map((room) => (
                <option key={room.slug} value={room.slug}>
                  {room.icon} {room.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="description">Opis</Label>
            <Textarea
              id="description"
              rows={5}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>
          <Button type="submit" variant="brass" className="w-full" disabled={busy}>
            Wystaw w antykwariacie
          </Button>
        </form>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
