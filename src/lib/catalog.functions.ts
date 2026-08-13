import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Item } from "@/data/rooms";

const ITEM_COLUMNS =
  "id, room_slug, name, icon, category, condition, year_label, dimensions, price, description, status, is_new, x, y, photo_url, spin_images";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  room: z.string().optional(),
  sort: z.string().optional(),
  onlyAvailable: z.boolean().optional(),
});

export const listItems = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => searchSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<Item[]> => {
    const { createPublicClient } = await import("./supabase-public.server");
    const supabase = createPublicClient();

    let query = supabase.from("items").select(ITEM_COLUMNS).eq("published", true);

    const q = (data.q ?? "").trim();
    if (q) {
      const like = `%${q.replace(/[%,]/g, " ")}%`;
      query = query.or(
        `name.ilike.${like},description.ilike.${like},category.ilike.${like},condition.ilike.${like},year_label.ilike.${like}`,
      );
    }
    if (data.category) query = query.eq("category", data.category);
    if (data.room) query = query.eq("room_slug", data.room);
    if (data.onlyAvailable) query = query.eq("status", "available");

    switch (data.sort) {
      case "price-asc":
        query = query.order("price", { ascending: true, nullsFirst: false });
        break;
      case "price-desc":
        query = query.order("price", { ascending: false, nullsFirst: false });
        break;
      case "condition":
        query = query.order("condition", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data: rows, error } = await query.limit(200);
    if (error) throw new Error(error.message);
    return (rows ?? []) as Item[];
  });

export const listRoomItems = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }): Promise<Item[]> => {
    const { createPublicClient } = await import("./supabase-public.server");
    const { data: rows, error } = await createPublicClient()
      .from("items")
      .select(ITEM_COLUMNS)
      .eq("published", true)
      .eq("room_slug", data.slug)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as Item[];
  });