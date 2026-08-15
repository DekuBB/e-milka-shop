import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "get_item",
  title: "Szczegóły przedmiotu",
  description: "Zwraca pełny opis jednego opublikowanego przedmiotu z katalogu na podstawie jego identyfikatora.",
  inputSchema: { id: z.string().trim().min(1).describe("Identyfikator przedmiotu.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    const { data, error } = await supabaseAnon()
      .from("items")
      .select(
        "id, room_slug, name, icon, category, condition, year_label, dimensions, price, description, status, is_new, photo_url, spin_images",
      )
      .eq("published", true)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError(`Nie znaleziono przedmiotu o id ${id}.`);
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { item: data } };
  },
});
