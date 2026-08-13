import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { RoomScene } from "@/components/RoomScene";
import { getRoom, rooms } from "@/data/rooms";
import { listRoomItems } from "@/lib/catalog.functions";

export const Route = createFileRoute("/pokoj/$slug")({
  loader: async ({ params }) => {
    const room = getRoom(params.slug);
    if (!room) throw notFound();
    const items = await listRoomItems({ data: { slug: params.slug } });
    return { room, items };
  },
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-xl px-6 py-24 text-center" role="alert">
      <h1 className="font-display text-3xl">Nie udało się otworzyć pomieszczenia</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">Tego pomieszczenia nie ma w domu</h1>
    </main>
  ),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Nie znaleziono pomieszczenia" }, { name: "robots", content: "noindex" }],
      };
    }
    const { room } = loaderData;
    const title = `${room.name} — Wirtualny Antykwariat`;
    return {
      meta: [
        { title },
        { name: "description", content: `${room.tagline} Kliknij przedmiot, aby poznać szczegóły.` },
        { property: "og:title", content: title },
        { property: "og:description", content: room.tagline },
      ],
    };
  },
  component: RoomPage,
});

function RoomPage() {
  const { room, items } = Route.useLoaderData();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        <Link to="/" className="text-primary hover:underline">
          🏠 Parter
        </Link>
        <span aria-hidden>/</span>
        <span>
          {room.icon} {room.name}
        </span>
      </nav>

      <header className="mb-6 mt-4">
        <h1 className="font-display text-4xl sm:text-5xl">{room.name}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{room.tagline}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.22em] text-primary">
          Kliknij świecące punkty na zdjęciu
        </p>
      </header>

      <RoomScene room={room} items={items} />

      <section className="mt-14 border-t border-border/60 pt-6">
        <h2 className="font-display text-2xl">Przejdź do innego pomieszczenia</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {rooms
            .filter((r) => r.slug !== room.slug)
            .map((r) => (
              <Link
                key={r.slug}
                to="/pokoj/$slug"
                params={{ slug: r.slug }}
                className="rounded-sm border border-border/70 px-4 py-2 text-sm transition-colors hover:border-primary/60 hover:text-primary"
              >
                {r.icon} {r.name}
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}