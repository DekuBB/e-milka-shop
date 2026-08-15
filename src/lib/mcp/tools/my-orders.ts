import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "my_orders",
  title: "Moje zamówienia",
  description: "Zwraca zamówienia zalogowanego użytkownika wraz z pozycjami, kwotą i statusem płatności.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Wymagane zalogowanie." }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("orders")
      .select("id, status, total, created_at, order_items(item_id, name, price)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const orders = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(orders) }],
      structuredContent: { count: orders.length, orders },
    };
  },
});
