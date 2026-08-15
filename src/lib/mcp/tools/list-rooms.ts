import { defineTool } from "@lovable.dev/mcp-js";

const ROOMS = [
  { slug: "salon", name: "Salon", icon: "🛋️", floor: "Parter", tagline: "Meble, zegary i porcelana z lat 50. i 60." },
  { slug: "gabinet", name: "Gabinet", icon: "📚", floor: "Parter", tagline: "Książki, maszyny do pisania i przedmioty biurowe." },
  { slug: "kuchnia", name: "Kuchnia", icon: "🍽️", floor: "Parter", tagline: "Naczynia emaliowane, kamionka i sprzęty gospodarskie." },
  { slug: "korytarz", name: "Korytarz", icon: "🕰️", floor: "Parter", tagline: "Zegary stojące, lustra i drobne meble wejściowe." },
] as const;

export default defineTool({
  name: "list_rooms",
  title: "Lista pomieszczeń antykwariatu",
  description: "Zwraca wirtualne pomieszczenia sklepu (salon, gabinet, kuchnia, korytarz) wraz z ich identyfikatorami.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [{ type: "text", text: JSON.stringify(ROOMS) }],
    structuredContent: { rooms: ROOMS },
  }),
});
