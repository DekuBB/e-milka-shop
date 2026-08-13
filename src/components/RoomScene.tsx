import { useState } from "react";
import { ItemDialog } from "@/components/ItemDialog";
import { formatPrice, type Item, type Room } from "@/data/rooms";

export function RoomScene({ room, items }: { room: Room; items: Item[] }) {
  const [active, setActive] = useState<Item | null>(null);

  return (
    <>
      <div className="relative overflow-hidden rounded-lg border border-border/70 frame-shadow">
        <img
          src={room.image}
          alt={`Wnętrze: ${room.name}`}
          width={1536}
          height={1024}
          className="block w-full select-none"
        />
        <div className="pointer-events-none absolute inset-0 vignette" />

        {items.map((item: Item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item)}
            aria-label={`${item.name} — ${formatPrice(item.price)}`}
            className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            <span className="relative flex h-9 w-9 items-center justify-center sm:h-10 sm:w-10">
              <span className="absolute inset-0 rounded-full bg-primary/40 hotspot-pulse" />
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full border border-primary/80 bg-background/70 text-[0.6rem] backdrop-blur transition-transform group-hover:scale-125 group-focus-visible:scale-125 sm:h-6 sm:w-6 sm:text-xs">
                {item.status === "sold" ? "✕" : item.icon}
              </span>
            </span>
            <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded border border-border/70 bg-popover/95 px-2 py-1 text-[0.7rem] text-popover-foreground shadow-lg group-hover:block group-focus-visible:block">
              {item.name} · {item.status === "sold" ? "sprzedane" : formatPrice(item.price)}
            </span>
          </button>
        ))}
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item: Item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setActive(item)}
              className="w-full rounded-md border border-border/60 bg-card/70 p-4 text-left transition-colors hover:border-primary/60 hover:bg-card"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-lg leading-tight">
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </span>
                {item.is_new && (
                  <span className="rounded-sm border border-primary/50 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-[0.15em] text-primary">
                    Nowe
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.year_label} · {item.condition}
              </p>
              <p className="mt-1 font-display text-lg text-brass">
                {item.status === "sold" ? "Sprzedane" : formatPrice(item.price)}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <ItemDialog item={active} onClose={() => setActive(null)} />
    </>
  );
}