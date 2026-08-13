import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getCart, removeFromCart } from "@/lib/shop.functions";
import { formatPrice, roomName } from "@/data/rooms";

export const Route = createFileRoute("/_authenticated/koszyk")({
  head: () => ({
    meta: [
      { title: "Koszyk — Wirtualny Antykwariat" },
      { name: "description", content: "Twoje wybrane starocie gotowe do zakupu." },
      { property: "og:title", content: "Koszyk w Wirtualnym Antykwariacie" },
      { property: "og:description", content: "Podsumowanie wybranych staroci." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const fetchCart = useServerFn(getCart);
  const remove = useServerFn(removeFromCart);
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey: ["cart"], queryFn: () => fetchCart({}) });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => remove({ data: { itemId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const total = items.reduce((sum, item) => sum + Number(item.price ?? 0), 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl">🛒 Koszyk</h1>
      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Ładowanie…</p>}
      {!isLoading && items.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Koszyk jest pusty. <Link to="/" className="text-primary hover:underline">Zwiedź dom</Link>.
        </p>
      )}

      <ul className="mt-6 divide-y divide-border/60">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-display text-lg">
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {roomName(item.room_slug)} · {item.condition}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-display text-lg text-brass">{formatPrice(item.price)}</span>
              <Button variant="outline" size="sm" onClick={() => removeItem.mutate(item.id)}>
                Usuń
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {items.length > 0 && (
        <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
          <p className="font-display text-2xl">Razem: {formatPrice(total)}</p>
          <Button variant="brass" asChild>
            <Link to="/kasa">Przejdź do kasy</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
