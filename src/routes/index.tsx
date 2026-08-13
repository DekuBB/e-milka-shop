import { createFileRoute, Link } from "@tanstack/react-router";
import house from "@/assets/house-exterior.jpg";
import { formatPrice, newItems, rooms } from "@/data/rooms";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wirtualny Antykwariat — sklep ze starociami w starym domu" },
      {
        name: "description",
        content:
          "Wejdź do wirtualnego starego domu: salon, gabinet, kuchnia i korytarz pełne staroci. Kliknij przedmiot, poznaj jego stan, rok i cenę.",
      },
      { property: "og:title", content: "Wirtualny Antykwariat" },
      {
        property: "og:description",
        content: "Zwiedzaj pokoje, klikaj przedmioty, kupuj starocie z historią.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <img
          src={house}
          alt="Kamienica antykwariatu o zmierzchu"
          width={1536}
          height={1024}
          className="h-[68vh] min-h-[420px] w-full object-cover"
        />
        <div className="absolute inset-0 vignette bg-background/55" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-[0.7rem] uppercase tracking-[0.4em] text-primary">est. 1904</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-none sm:text-6xl md:text-7xl">
            Wirtualny Antykwariat
          </h1>
          <p className="mt-5 max-w-xl text-sm text-muted-foreground sm:text-base">
            Zamiast kafelków z produktami — cały stary dom. Wejdź do pokoju, kliknij przedmiot i
            poznaj jego historię, stan oraz cenę.
          </p>
          <a
            href="#parter"
            className="mt-8 inline-flex items-center gap-2 rounded-sm border border-primary/50 px-6 py-3 text-xs uppercase tracking-[0.25em] text-primary transition-colors hover:bg-primary/10"
          >
            Otwórz drzwi
          </a>
        </div>
      </section>

      <section id="parter" className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-4">
          <h2 className="font-display text-3xl sm:text-4xl">🏠 Parter</h2>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {rooms.length} pomieszczenia ·{" "}
            {rooms.reduce((n, r) => n + r.items.length, 0)} przedmiotów
          </p>
        </header>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {rooms.map((room) => (
            <Link
              key={room.slug}
              to="/pokoj/$slug"
              params={{ slug: room.slug }}
              className="group overflow-hidden rounded-lg border border-border/60 bg-card/60 transition-colors hover:border-primary/60"
            >
              <div className="relative">
                <img
                  src={room.image}
                  alt={`Pomieszczenie: ${room.name}`}
                  loading="lazy"
                  width={1536}
                  height={1024}
                  className="aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 vignette" />
              </div>
              <div className="flex items-start justify-between gap-4 p-5">
                <div>
                  <h3 className="font-display text-2xl">
                    <span className="mr-2">{room.icon}</span>
                    {room.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{room.tagline}</p>
                </div>
                <span className="mt-1 whitespace-nowrap text-xs uppercase tracking-[0.2em] text-primary">
                  {room.items.length} rzeczy
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="border-b border-border/60 pb-4 font-display text-3xl sm:text-4xl">
          🏷️ Nowe w antykwariacie
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {newItems.map(({ item, room }) => (
            <li key={item.id}>
              <Link
                to="/pokoj/$slug"
                params={{ slug: room.slug }}
                className="block h-full rounded-md border border-border/60 bg-card/70 p-5 transition-colors hover:border-primary/60"
              >
                <span className="text-2xl">{item.icon}</span>
                <h3 className="mt-3 font-display text-xl leading-tight">{item.name}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {room.icon} {room.name} · {item.year}
                </p>
                <p className="mt-2 font-display text-lg text-brass">{formatPrice(item.price)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-border/60 px-6 py-10 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Wirtualny Antykwariat · kontakt@antykwariat.pl
      </footer>
    </main>
  );
}
