import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getMyListings, getMyOrders } from "@/lib/shop.functions";
import { formatPrice, roomName, statusLabel } from "@/data/rooms";

export const Route = createFileRoute("/_authenticated/konto")({
  head: () => ({
    meta: [
      { title: "Moje konto — Wirtualny Antykwariat" },
      { name: "description", content: "Historia zamówień, statusy przedmiotów i Twoje wystawione starocie." },
      { property: "og:title", content: "Konto klienta — Wirtualny Antykwariat" },
      { property: "og:description", content: "Zamówienia, rezerwacje i wystawione przedmioty." },
    ],
  }),
  component: AccountPage,
});

const orderStatus: Record<string, string> = {
  pending: "Oczekuje na płatność",
  paid: "Opłacone",
  cancelled: "Anulowane",
};

function AccountPage() {
  const fetchOrders = useServerFn(getMyOrders);
  const fetchListings = useServerFn(getMyListings);
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => fetchOrders({}) });
  const { data: listings = [] } = useQuery({ queryKey: ["listings"], queryFn: () => fetchListings({}) });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl">👤 Moje konto</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/wystaw">📸 Wystaw przedmiot</Link>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}
          >
            Wyloguj
          </Button>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl">📦 Historia zamówień</h2>
        {orders.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Brak zamówień.</p>}
        <ul className="mt-4 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-md border border-border/60 bg-card/60 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("pl-PL")} ·{" "}
                  {orderStatus[order.status] ?? order.status}
                </p>
                <p className="font-display text-xl text-brass">{formatPrice(order.total)}</p>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {order.items.map((line) => (
                  <li key={line.item_id}>
                    {line.name} — {formatPrice(line.price)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">🏷️ Moje wystawione przedmioty</h2>
        {listings.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">Nie wystawiłeś jeszcze nic.</p>
        )}
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {listings.map((item) => (
            <li key={item.id} className="rounded-md border border-border/60 bg-card/60 p-4">
              <p className="font-display text-lg">
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {roomName(item.room_slug)} · {statusLabel[item.status]}
              </p>
              <p className="mt-1 font-display text-brass">{formatPrice(item.price)}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
