import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

const COLUMNS =
  "id, room_slug, name, icon, category, condition, year_label, dimensions, price, description, status, is_new, photo_url";

export default defineTool({
  name: "search_items",
  title: "Szukaj przedmiotów",
  description:
    "Przeszukuje publiczny katalog antykwariatu po słowach kluczowych, kategorii, pomieszczeniu i dostępności. Sortowanie po cenie lub dacie dodania.",
  inputSchema: {
    q: z.string().trim().optional().describe("Słowa kluczowe, np. 'zegar'."),
    category: z.string().trim().optional().describe("Kategoria przedmiotu."),
    room: z.enum(["salon", "gabinet", "kuchnia", "korytarz"]).optional().describe("Slug pomieszczenia."),
    onlyAvailable: z.boolean().optional().describe("Tylko przedmioty dostępne (nie zarezerwowane/sprzedane)."),
    sort: z.enum(["newest", "price-asc", "price-desc"]).optional().describe("Kolejność wyników."),
    limit: z.number().int().min(1).max(50).optional().describe("Maksymalna liczba wyników (domyślnie 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ q, category, room, onlyAvailable, sort, limit }) => {
    let query = supabaseAnon().from("items").select(COLUMNS).eq("published", true);

    const term = (q ?? "").trim();
    if (term) {
      const like = `%${term.replace(/[%,]/g, " ")}%`;
      query = query.or(
        `name.ilike.${like},description.ilike.${like},category.ilike.${like},condition.ilike.${like},year_label.ilike.${like}`,
      );
    }
    if (category) query = query.eq("category", category);
    if (room) query = query.eq("room_slug", room);
    if (onlyAvailable) query = query.eq("status", "available");

    if (sort === "price-asc") query = query.order("price", { ascending: true, nullsFirst: false });
    else if (sort === "price-desc") query = query.order("price", { ascending: false, nullsFirst: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query.limit(limit ?? 20);
    if (error) throw new ToolError(error.message);

    const items = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(items) }],
      structuredContent: { count: items.length, items },
    };
  },
});
