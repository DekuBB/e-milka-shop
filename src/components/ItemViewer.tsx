import { useState } from "react";
import { getRoom, type Item } from "@/data/rooms";

/** Zdjęcie z lupą (hover) oraz obrotem 360° gdy przedmiot ma klatki. */
export function ItemViewer({ item }: { item: Item }) {
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const [frame, setFrame] = useState(0);
  const frames = item.spin_images ?? [];
  const has360 = frames.length > 1;
  const src = has360 ? frames[frame]! : (item.photo_url ?? getRoom(item.room_slug)?.image ?? "");

  return (
    <div className="space-y-2">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-md border border-border/70 bg-muted"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setLens({
            x: ((event.clientX - rect.left) / rect.width) * 100,
            y: ((event.clientY - rect.top) / rect.height) * 100,
          });
        }}
        onMouseLeave={() => setLens(null)}
      >
        <img src={src} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
        {lens && (
          <div
            aria-hidden
            className="pointer-events-none absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/70 shadow-lg"
            style={{
              left: `${lens.x}%`,
              top: `${lens.y}%`,
              backgroundImage: `url(${src})`,
              backgroundSize: "300% 300%",
              backgroundPosition: `${lens.x}% ${lens.y}%`,
            }}
          />
        )}
        <span className="absolute bottom-2 right-2 rounded-sm bg-background/80 px-2 py-1 text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
          🔎 najedź, aby powiększyć
        </span>
      </div>

      {has360 && (
        <div className="flex items-center gap-3">
          <span className="text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
            🔄 obrót 360°
          </span>
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={frame}
            aria-label="Obróć przedmiot"
            onChange={(event) => setFrame(Number(event.target.value))}
            className="flex-1 accent-primary"
          />
        </div>
      )}
    </div>
  );
}
