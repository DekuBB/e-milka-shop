import salon from "@/assets/room-salon.jpg";
import gabinet from "@/assets/room-gabinet.jpg";
import kuchnia from "@/assets/room-kuchnia.jpg";
import korytarz from "@/assets/room-korytarz.jpg";

export type ItemStatus = "available" | "reserved" | "sold";

export type Item = {
  id: string;
  room_slug: string;
  name: string;
  icon: string;
  category: string;
  condition: string;
  year_label: string;
  dimensions: string;
  price: number | null;
  description: string;
  status: ItemStatus;
  is_new: boolean;
  x: number;
  y: number;
  photo_url: string | null;
  spin_images: string[];
};

export type Room = {
  slug: string;
  name: string;
  icon: string;
  floor: string;
  tagline: string;
  image: string;
};

export const rooms: Room[] = [
  {
    slug: "salon",
    name: "Salon",
    icon: "🛋️",
    floor: "Parter",
    tagline: "Meble, zegary i porcelana z lat 50. i 60.",
    image: salon,
  },
  {
    slug: "gabinet",
    name: "Gabinet",
    icon: "📚",
    floor: "Parter",
    tagline: "Książki, maszyny do pisania i przedmioty biurowe.",
    image: gabinet,
  },
  {
    slug: "kuchnia",
    name: "Kuchnia",
    icon: "🍽️",
    floor: "Parter",
    tagline: "Naczynia emaliowane, kamionka i sprzęty gospodarskie.",
    image: kuchnia,
  },
  {
    slug: "korytarz",
    name: "Korytarz",
    icon: "🕰️",
    floor: "Parter",
    tagline: "Zegary stojące, lustra i drobne meble wejściowe.",
    image: korytarz,
  },
];

export const getRoom = (slug: string) => rooms.find((r) => r.slug === slug);

export const roomName = (slug: string) => getRoom(slug)?.name ?? slug;

export const statusLabel: Record<ItemStatus, string> = {
  available: "Dostępny",
  reserved: "Zarezerwowany",
  sold: "Sprzedany",
};

export const formatPrice = (price: number | null) =>
  price === null ? "cena do ustalenia" : `${Number(price).toLocaleString("pl-PL")} zł`;
