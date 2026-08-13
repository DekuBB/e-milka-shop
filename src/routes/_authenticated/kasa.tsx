import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrder, getCart, payOrder } from "@/lib/shop.functions";
import { formatPrice } from "@/data/rooms";

export const Route = createFileRoute("/_authenticated/kasa")({
  head: () => ({
    meta: [
      { title: "Kasa — Wirtualny Antykwariat" },
      { name: "description", content: "Dane do wysyłki i płatność za wybrane starocie." },
      { property: "og:title", content: "Kasa Wirtualnego Antykwariatu" },
      { property: "og:description", content: "Zamówienie i płatność w kilku krokach." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const fetchCart = useServerFn(getCart);
  const create = useServerFn(createOrder);
  const pay = useServerFn(payOrder);
  const navigate = useNavigate();
  const [buyerName, setBuyerName] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: items = [] } = useQuery({ queryKey: ["cart"], queryFn: () => fetchCart({}) });
  const total = items.reduce((sum, item) => sum + Number(item.price ?? 0), 0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const order = await create({ data: { buyerName, address } });
      await pay({ data: { orderId: order.orderId } });
      toast.success("Zamówienie opłacone. Przedmioty oznaczone jako sprzedane.");
      navigate({ to: "/konto" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-4xl">💳 Kasa</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {items.length} przedmiot(y) · razem {formatPrice(total)}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="name">Imię i nazwisko</Label>
          <Input id="name" required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="address">Adres wysyłki</Label>
          <Textarea id="address" required value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <Button type="submit" variant="brass" className="w-full" disabled={busy || items.length === 0}>
          Zapłać {formatPrice(total)}
        </Button>
        <p className="text-xs text-muted-foreground">
          Płatność działa obecnie w trybie testowym — po podłączeniu Stripe ten sam przycisk przeniesie
          Cię do prawdziwej bramki płatniczej.
        </p>
      </form>
    </main>
  );
}
