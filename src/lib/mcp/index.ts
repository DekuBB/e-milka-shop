import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listRooms from "./tools/list-rooms";
import searchItems from "./tools/search-items";
import getItem from "./tools/get-item";
import myOrders from "./tools/my-orders";
import myListings from "./tools/my-listings";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

// Narzędzia bez `outputSchema` (opcjonalne w SDK) nie przechodzą kontroli
// `exactOptionalPropertyTypes` w tej wersji typów — zawężamy typ listy.
type McpTools = Parameters<typeof defineMcp>[0]["tools"];
const tools = [listRooms, searchItems, getItem, myOrders, myListings] as unknown as McpTools;

export default defineMcp({
  name: "virtual-vintage-emporium",
  title: "Virtual Vintage Emporium",
  version: "0.1.0",
  instructions:
    "Narzędzia Wirtualnego Antykwariatu. `list_rooms` i `search_items` przeglądają publiczny katalog staroci, `get_item` zwraca szczegóły przedmiotu, a `my_orders` i `my_listings` pokazują dane zalogowanego użytkownika.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listRooms, searchItems, getItem, myOrders, myListings],
});
