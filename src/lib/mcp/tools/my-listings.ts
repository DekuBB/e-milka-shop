import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_listings",
  title: "Moje wystawione przedmioty",
  description: "Zwraca przedmioty wystawione przez zalogowanego użytkownika wraz ze statusem i publikacją.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Wymagane zalogowanie." }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("items")
      .select("id, name, room_slug, category, price, status, published, created_at")
      .eq("owner_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const items = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(items) }],
      structuredContent: { count: items.length, items },
    };
  },
});
