import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ItemViewer } from "@/components/ItemViewer";
import { useAuth } from "@/hooks/useAuth";
import { addToCart } from "@/lib/shop.functions";
import { formatPrice, roomName, statusLabel, type Item } from "@/data/rooms";

export function ItemDialog({ item, onClose }: { item: Item | null; onClose: () => void }) {
  const { user } = useAuth();
  const add = useServerFn(addToCart);
  const [added, setAdded] = useState(false);

  const mutation = useMutation({
    mutationFn: (itemId: string) => add({ data: { itemId } }),
    onSuccess: () => {
      setAdded(true);
      toast.success("Dodano do koszyka");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) {
          setAdded(false);
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto border-border/70 bg-card/95 backdrop-blur">
        {item && (
          <>
            <DialogHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {roomName(item.room_slug)} · {statusLabel[item.status]}
              </p>
              <DialogTitle className="font-display text-2xl leading-tight">
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </DialogTitle>
            </DialogHeader>

            <ItemViewer item={item} />

            <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>

            <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border/60 py-4 text-sm">
              <Detail label="Stan" value={item.condition} />
              <Detail label="Rok" value={item.year_label} />
              <Detail label="Wymiary" value={item.dimensions} />
              <Detail label="Cena" value={formatPrice(item.price)} accent />
            </dl>

            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="brass"
                className="flex-1"
                disabled={item.status !== "available" || mutation.isPending || added || !user}
                onClick={() => mutation.mutate(item.id)}
              >
                {item.status === "sold"
                  ? "Sprzedane"
                  : item.status === "reserved"
                    ? "Zarezerwowane"
                    : !user
                      ? "Zaloguj się, aby kupić"
                      : added
                        ? "W koszyku ✓"
                        : "🛒 Dodaj do koszyka"}
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a
                  href={`mailto:kontakt@antykwariat.pl?subject=${encodeURIComponent(`Pytanie o: ${item.name}`)}`}
                >
                  💬 Zapytaj o przedmiot
                </a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
      <dd className={accent ? "font-display text-xl text-brass" : "mt-0.5 text-sm text-card-foreground"}>
        {value || "—"}
      </dd>
    </div>
  );
}
