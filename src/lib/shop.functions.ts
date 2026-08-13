import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Item } from "@/data/rooms";

const ITEM_COLUMNS =
  "id, room_slug, name, icon, category, condition, year_label, dimensions, price, description, status, is_new, x, y, photo_url, spin_images";

export type OrderSummary = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer_name: string | null;
  address: string | null;
  items: { item_id: string; name: string; price: number }[];
};

export const getCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Item[]> => {
    const { data, error } = await context.supabase
      .from("cart_items")
      .select(`item_id, items!inner(${ITEM_COLUMNS})`)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as { items: Item }[]).map((row) => row.items);
  });

export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ itemId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: item, error: itemError } = await context.supabase
      .from("items")
      .select("id, status")
      .eq("id", data.itemId)
      .maybeSingle();
    if (itemError) throw new Error(itemError.message);
    if (!item) throw new Error("Nie znaleziono przedmiotu.");
    if (item.status !== "available") throw new Error("Ten przedmiot nie jest już dostępny.");

    const { error } = await context.supabase
      .from("cart_items")
      .insert({ user_id: context.userId, item_id: data.itemId });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ itemId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cart_items")
      .delete()
      .eq("user_id", context.userId)
      .eq("item_id", data.itemId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ buyerName: z.string().min(2).max(120), address: z.string().min(5).max(400) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: cart, error: cartError } = await context.supabase
      .from("cart_items")
      .select("item_id, items!inner(id, name, price, status)")
      .eq("user_id", context.userId);
    if (cartError) throw new Error(cartError.message);

    const lines = ((cart ?? []) as unknown as {
      items: { id: string; name: string; price: number | null; status: string };
    }[])
      .map((row) => row.items)
      .filter((item) => item.status === "available");

    if (lines.length === 0) throw new Error("Koszyk jest pusty lub przedmioty są już niedostępne.");

    const total = lines.reduce((sum, line) => sum + Number(line.price ?? 0), 0);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: context.userId,
        status: "pending",
        total,
        buyer_name: data.buyerName,
        address: data.address,
      })
      .select("id, total")
      .single();
    if (orderError) throw new Error(orderError.message);

    const { error: linesError } = await supabaseAdmin.from("order_items").insert(
      lines.map((line) => ({
        order_id: order.id,
        item_id: line.id,
        name: line.name,
        price: Number(line.price ?? 0),
      })),
    );
    if (linesError) throw new Error(linesError.message);

    await supabaseAdmin
      .from("items")
      .update({ status: "reserved" })
      .in(
        "id",
        lines.map((line) => line.id),
      );

    return { orderId: order.id as string, total: Number(order.total) };
  });

export const payOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, status, total")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Nie znaleziono zamówienia.");
    if (order.status === "paid") return { ok: true, alreadyPaid: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: lines } = await supabaseAdmin
      .from("order_items")
      .select("item_id")
      .eq("order_id", order.id);

    await supabaseAdmin
      .from("orders")
      .update({ status: "paid", payment_ref: `demo-${Date.now()}` })
      .eq("id", order.id)
      .eq("user_id", context.userId);

    if (lines?.length) {
      await supabaseAdmin
        .from("items")
        .update({ status: "sold" })
        .in(
          "id",
          lines.map((line) => line.item_id),
        );
    }

    await supabaseAdmin.from("cart_items").delete().eq("user_id", context.userId);

    return { ok: true, alreadyPaid: false };
  });

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrderSummary[]> => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, status, total, created_at, buyer_name, address, order_items(item_id, name, price)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return ((data ?? []) as unknown as (Omit<OrderSummary, "items"> & {
      order_items: { item_id: string; name: string; price: number }[];
    })[]).map((order) => ({
      id: order.id,
      status: order.status,
      total: Number(order.total),
      created_at: order.created_at,
      buyer_name: order.buyer_name,
      address: order.address,
      items: order.order_items ?? [],
    }));
  });

export const getMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Item[]> => {
    const { data, error } = await context.supabase
      .from("items")
      .select(ITEM_COLUMNS)
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Item[];
  });