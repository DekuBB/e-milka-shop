import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  adminListItems,
  adminListOrders,
  adminUpdateItem,
  adminUpdateOrderStatus,
  getMyRoles,
} from "@/lib/admin.functions";
import { formatPrice, roomName, statusLabel, type ItemStatus } from "@/data/rooms";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Panel administratora — Wirtualny Antykwariat" },
      {
        name: "description",
        content: "Zarządzanie przedmiotami, publikacją wpisów i statusami zamówień antykwariatu.",
      },
      { property: "og:title", content: "Panel administratora antykwariatu" },
      { property: "og:description", content: "Rezerwacje, sprzedaż i publikacja staroci w jednym miejscu." },
    ],
  }),
  component: AdminPage,
});

const orderStatuses = [
  { value: "pending", label: "Oczekuje" },
  { value: "paid", label: "Opłacone" },
  { value: "cancelled", label: "Anulowane" },
] as const;

const itemStatuses: ItemStatus[] = ["available", "reserved", "sold"];

function AdminPage() {
  const fetchRoles = useServerFn(getMyRoles);
  const fetchItems = useServerFn(adminListItems);
  const fetchOrders = useServerFn(adminListOrders);
  const updateItem = useServerFn(adminUpdateItem);
  const updateOrder = useServerFn(adminUpdateOrderStatus);
  const queryClient = useQueryClient();

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => fetchRoles({}),
  });
  const isAdmin = roles.includes("admin");

  const { data: items = [] } = useQuery({
    queryKey: ["admin-items"],
    queryFn: () => fetchItems({}),
    enabled: isAdmin,
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => fetchOrders({}),
    enabled: isAdmin,
  });

  const itemMutation = useMutation({
    mutationFn: (input: { id: string; status?: ItemStatus; published?: boolean; is_new?: boolean }) =>
      updateItem({ data: input }),
    onSuccess: () => {
      toast.success("Zaktualizowano przedmiot");
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const orderMutation = useMutation({
    mutationFn: (input: { orderId: string; status: "pending" | "paid" | "cancelled" }) =>
      updateOrder({ data: input }),
    onSuccess: () => {
      toast.success("Zaktualizowano zamówienie");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-items"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (rolesLoading) {
    return <main className="mx-auto max-w-5xl px-6 py-12 text-sm text-muted-foreground">Ładowanie…</main>;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl">🔒 Brak dostępu</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ta część antykwariatu jest dostępna tylko dla administratora.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl sm:text-4xl">🗄️ Panel administratora</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {items.length} przedmiotów · {orders.length} zamówień
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl">📦 Zamówienia</h2>
        {orders.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Brak zamówień.</p>}
        <ul className="mt-4 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-md border border-border/60 bg-card/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {new Date(order.created_at).toLocaleString("pl-PL")} · {order.buyer_name ?? "—"}
                </p>
                <p className="font-display text-xl text-brass">{formatPrice(order.total)}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{order.address}</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {order.items.map((line) => (
                  <li key={line.item_id}>
                    {line.name} — {formatPrice(line.price)}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {orderStatuses.map((status) => (
                  <Button
                    key={status.value}
                    size="sm"
                    variant={order.status === status.value ? "brass" : "outline"}
                    disabled={orderMutation.isPending}
                    onClick={() => orderMutation.mutate({ orderId: order.id, status: status.value })}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">🏺 Przedmioty</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border border-border/60 bg-card/60 p-4">
              <p className="font-display text-lg">
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {roomName(item.room_slug)} · {statusLabel[item.status]} ·{" "}
                {item.published ? "opublikowany" : "szkic"}
              </p>
              <p className="mt-1 font-display text-brass">{formatPrice(item.price)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {itemStatuses.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={item.status === status ? "brass" : "outline"}
                    disabled={itemMutation.isPending}
                    onClick={() => itemMutation.mutate({ id: item.id, status })}
                  >
                    {statusLabel[status]}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="parchment"
                  disabled={itemMutation.isPending}
                  onClick={() => itemMutation.mutate({ id: item.id, published: !item.published })}
                >
                  {item.published ? "Ukryj" : "Publikuj"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={itemMutation.isPending}
                  onClick={() => itemMutation.mutate({ id: item.id, is_new: !item.is_new })}
                >
                  {item.is_new ? "Zdejmij „nowe”" : "Oznacz „nowe”"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
