import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROOM_SLUGS = ["salon", "gabinet", "kuchnia", "korytarz"] as const;

export type Suggestion = {
  name: string;
  category: string;
  condition: string;
  year_label: string;
  dimensions: string;
  description: string;
  room_slug: string;
  icon: string;
  price: number | null;
};

const photoSchema = z.object({
  image: z.string().min(64).max(8_000_000),
  hint: z.string().max(400).optional(),
});

export const analyzePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => photoSchema.parse(input))
  .handler(async ({ data }): Promise<Suggestion> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Brak konfiguracji AI.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Jesteś rzeczoznawcą staroci w polskim antykwariacie. Na podstawie zdjęcia opisz przedmiot po polsku. " +
              `Zwróć WYŁĄCZNIE JSON o kluczach: name, category, condition, year_label, dimensions, description, room_slug, icon, price. ` +
              `room_slug musi być jednym z: ${ROOM_SLUGS.join(", ")} (salon = meble/zegary/porcelana, gabinet = książki/biuro, kuchnia = naczynia, korytarz = lustra/wieszaki/zegary stojące). ` +
              "icon to jedno emoji. price to liczba w złotych (szacunek) albo null. description ma 2-3 zdania.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: data.hint ? `Wskazówki sprzedawcy: ${data.hint}` : "Opisz ten przedmiot.",
              },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("Limit zapytań AI wyczerpany. Spróbuj za chwilę.");
      if (response.status === 402) throw new Error("Brak środków na AI w tym projekcie.");
      throw new Error("AI nie odpowiedziało poprawnie.");
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content ?? "";
    const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(json) as Record<string, unknown>;
    } catch {
      throw new Error("Nie udało się odczytać odpowiedzi AI.");
    }

    const text = (key: string, fallback = "") =>
      typeof parsed[key] === "string" ? (parsed[key] as string) : fallback;
    const slug = text("room_slug", "salon");

    return {
      name: text("name", "Nieokreślona starocia"),
      category: text("category", "inne").toLowerCase(),
      condition: text("condition", "Używany"),
      year_label: text("year_label"),
      dimensions: text("dimensions"),
      description: text("description"),
      room_slug: (ROOM_SLUGS as readonly string[]).includes(slug) ? slug : "salon",
      icon: text("icon", "🏺").slice(0, 4),
      price: typeof parsed["price"] === "number" ? (parsed["price"] as number) : null,
    };
  });

const listingSchema = z.object({
  image: z.string().min(64).max(8_000_000),
  name: z.string().min(2).max(160),
  category: z.string().min(2).max(60),
  condition: z.string().max(120),
  year_label: z.string().max(60),
  dimensions: z.string().max(120),
  description: z.string().max(2000),
  room_slug: z.string(),
  icon: z.string().max(4),
  price: z.number().nullable(),
});

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const slug = (ROOM_SLUGS as readonly string[]).includes(data.room_slug) ? data.room_slug : "salon";
    const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/.exec(data.image);
    if (!match) throw new Error("Nieobsługiwany format zdjęcia.");

    const contentType = match[1]!;
    const bytes = Uint8Array.from(atob(match[2]!), (char) => char.charCodeAt(0));
    const extension = contentType.split("/")[1]!.replace("jpeg", "jpg");
    const id = `${slugify(data.name)}-${Date.now().toString(36)}`;
    const path = `${context.userId}/${id}.${extension}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: uploadError } = await supabaseAdmin.storage
      .from("item-photos")
      .upload(path, bytes, { contentType, upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("item-photos")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (signError) throw new Error(signError.message);

    const { error: insertError } = await context.supabase.from("items").insert({
      id,
      room_slug: slug,
      name: data.name,
      icon: data.icon || "🏺",
      category: data.category.toLowerCase(),
      condition: data.condition,
      year_label: data.year_label,
      dimensions: data.dimensions,
      description: data.description,
      price: data.price,
      status: "available",
      is_new: true,
      x: 20 + Math.round(Math.random() * 60),
      y: 30 + Math.round(Math.random() * 40),
      photo_url: signed.signedUrl,
      owner_id: context.userId,
      published: true,
    });
    if (insertError) throw new Error(insertError.message);

    return { id, roomSlug: slug };
  });

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "starocia";
}