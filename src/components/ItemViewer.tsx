import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRoom, type Item } from "@/data/rooms";

/** Prosty cache przeglądarkowy: raz wczytana klatka nie jest pobierana ponownie. */
const loaded = new Set<string>();

function preload(src: string | undefined) {
  if (!src || typeof window === "undefined" || loaded.has(src)) return;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  loaded.add(src);
}

/** Zdjęcie z lupą (hover / dotyk) oraz obrotem 360° gdy przedmiot ma klatki. */
export function ItemViewer({ item }: { item: Item }) {
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const [frame, setFrame] = useState(0);
  const [zoomOn, setZoomOn] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  const frames = useMemo(() => item.spin_images ?? [], [item.spin_images]);
  const has360 = frames.length > 1;
  const fallback = item.photo_url ?? getRoom(item.room_slug)?.image ?? "";
  const src = has360 ? (frames[frame] ?? fallback) : fallback;

  useEffect(() => {
    const mql = window.matchMedia("(hover: none), (pointer: coarse)");
    setCoarse(mql.matches);
    const onChange = () => setCoarse(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Lazy loading klatek 360°: dociągamy tylko sąsiednie, nie całą sekwencję naraz.
  useEffect(() => {
    if (!has360) return;
    preload(frames[frame]);
    preload(frames[frame + 1]);
    preload(frames[frame - 1]);
  }, [frames, frame, has360]);

  useEffect(() => {
    setFrame(0);
    setLens(null);
    setZoomOn(false);
  }, [item.id]);

  const move = useCallback((clientX: number, clientY: number, el: HTMLElement) => {
    if (!rectRef.current) rectRef.current = el.getBoundingClientRect();
    const rect = rectRef.current;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setLens({
        x: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
        y: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
      });
    });
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const zoomActive = coarse ? zoomOn : true;

  return (
    <div className="space-y-2">
      <div
        className="relative aspect-[4/3] touch-pan-y overflow-hidden rounded-md border border-border/70 bg-muted select-none"
        onPointerDown={(event) => {
          if (!coarse || !zoomOn) return;
          rectRef.current = null;
          move(event.clientX, event.clientY, event.currentTarget);
        }}
        onPointerMove={(event) => {
          if (!zoomActive) return;
          if (coarse && event.pressure === 0 && event.pointerType !== "mouse") return;
          move(event.clientX, event.clientY, event.currentTarget);
        }}
        onPointerUp={() => setLens(null)}
        onPointerLeave={() => {
          rectRef.current = null;
          setLens(null);
        }}
      >
        <img
          src={src}
          alt={item.name}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          draggable={false}
          sizes="(max-width: 640px) 100vw, 480px"
        />
        {lens && zoomActive && (
          <div
            aria-hidden
            className="pointer-events-none absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/70 shadow-lg will-change-transform sm:h-28 sm:w-28"
            style={{
              left: `${lens.x}%`,
              top: `${lens.y}%`,
              backgroundImage: `url(${src})`,
              backgroundSize: "300% 300%",
              backgroundPosition: `${lens.x}% ${lens.y}%`,
            }}
          />
        )}
        {coarse ? (
          <button
            type="button"
            onClick={() => {
              setZoomOn((on) => !on);
              setLens(null);
            }}
            className="absolute bottom-2 right-2 rounded-sm bg-background/85 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground"
          >
            {zoomOn ? "✕ zamknij lupę" : "🔎 lupa"}
          </button>
        ) : (
          <span className="absolute bottom-2 right-2 rounded-sm bg-background/80 px-2 py-1 text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
            🔎 najedź, aby powiększyć
          </span>
        )}
      </div>

      {has360 && (
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
            🔄 360°
          </span>
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={frame}
            aria-label="Obróć przedmiot"
            onChange={(event) => setFrame(Number(event.target.value))}
            className="h-6 flex-1 accent-primary"
          />
          <span className="w-10 shrink-0 text-right text-[0.65rem] text-muted-foreground">
            {frame + 1}/{frames.length}
          </span>
        </div>
      )}
    </div>
  );
}
