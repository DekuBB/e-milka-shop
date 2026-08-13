import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatPrice, type Item } from "@/data/rooms";

const statusLabel: Record<Item["status"], string> = {
  available: "Dostępny",
  reserved: "Zarezerwowany",
  sold: "Sprzedany",
};

export function ItemDialog({
  item,
  roomName,
  onClose,
}: {
  item: Item | null;
  roomName: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border/70 bg-card/95 backdrop-blur">
        {item && (
          <>
            <DialogHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {roomName} · {statusLabel[item.status]}
              </p>
              <DialogTitle className="font-display text-2xl leading-tight">
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </DialogTitle>
            </DialogHeader>

            <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>

            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border/60 py-4 text-sm">
              <Detail label="Stan" value={item.condition} />
              <Detail label="Rok" value={item.year} />
              <Detail label="Wymiary" value={item.dimensions} />
              <Detail label="Cena" value={formatPrice(item.price)} accent />
            </dl>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="brass"
                className="flex-1"
                disabled={item.status !== "available"}
                onClick={onClose}
              >
                {item.status === "sold"
                  ? "Sprzedane"
                  : item.status === "reserved"
                    ? "Zarezerwowane"
                    : "Kup"}
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <a
                  href={`mailto:kontakt@antykwariat.pl?subject=${encodeURIComponent(`Pytanie o: ${item.name}`)}`}
                >
                  Zapytaj o przedmiot
                </a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Detail({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</dt>
      <dd
        className={
          accent
            ? "font-display text-xl text-brass"
            : "mt-0.5 text-sm text-card-foreground"
        }
      >
        {value}
      </dd>
    </div>
  );
}