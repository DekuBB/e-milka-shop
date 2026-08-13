import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { ItemDialog } from "@/components/ItemDialog";
import { listItems } from "@/lib/catalog.functions";
import { formatPrice, roomName, statusLabel, type Item } from "@/data/rooms";

export const Route = createFileRoute("/szukaj")({
  head: () => ({
    meta: [
      { title: "Szukaj staroci — Wirtualny Antykwariat" },
      {
        name: "description",
        content:
          "Przeszukaj cały antykwariat: zegary, lampy, porcelanę i meble. Filtruj po pokoju i kategorii, sortuj po cenie i stanie.",
      },
      { property: "og:title", content: "Szukaj staroci w Wirtualnym Antykwariacie" },
      { property: "og:description", content: "Wyszukiwanie, filtry i sortowanie po cenie oraz stanie." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [room, setRoom] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [active, setActive] = useState<Item | null>(null);

  const { data: items = [], isFetching } = useQuery({
    queryKey: ["search", q, sort, room, onlyAvailable],
    queryFn: () => listItems({ data: { q, sort, room: room || undefined, onlyAvailable } }),
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-4xl">🔍 Szukaj w antykwariacie</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Np. „zegar”, „mosiądz”, „porcelana”. Filtruj i sortuj wyniki.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="pokaż wszystkie zegary…" />
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          aria-label="Pomieszczenie"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Wszystkie pomieszczenia</option>
          <option value="salon">Salon</option>
          <option value="gabinet">Gabinet</option>
          <option value="kuchnia">Kuchnia</option>
          <option value="korytarz">Korytarz</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sortowanie"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="newest">Najnowsze</option>
          <option value="price-asc">Cena rosnąco</option>
          <option value="price-desc">Cena malejąco</option>
          <option value="condition">Stan</option>
        </select>
        <label className="flex items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          tylko dostępne
        </label>
      </div>

      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {isFetching ? "Szukam…" : `${items.length} wyników`}
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setActive(item)}
              className="h-full w-full rounded-md border border-border/60 bg-card/70 p-4 text-left transition-colors hover:border-primary/60"
            >
              <span className="font-display text-lg">
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </span>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {roomName(item.room_slug)} · {item.category} · {statusLabel[item.status]}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.year_label} · {item.condition}
              </p>
              <p className="mt-1 font-display text-lg text-brass">{formatPrice(item.price)}</p>
            </button>
          </li>
        ))}
      </ul>

      {items.length === 0 && !isFetching && (
        <p className="mt-10 text-sm text-muted-foreground">
          Nic nie znaleziono. <Link to="/" className="text-primary hover:underline">Wróć do domu</Link>.
        </p>
      )}

      <ItemDialog item={active} onClose={() => setActive(null)} />
    </main>
  );
}
