import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Item } from "@/data/rooms";

const ITEM_COLUMNS =
  "id, room_slug, name, icon, category, condition, year_label, dimensions, price, description, status, is_new, x, y, photo_url, spin_images, published, created_at";

export type AdminItem = Item & { published: boolean; created_at: string };

export type AdminOrder = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  buyer_name: string | null;
  address: string | null;
  items: { item_id: string; name: string; price: number }[];
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Brak uprawnień administratora.");
}

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<string[]> => {
    const { data, error } = await context.supabase.from("user_roles").select("role");
    if (error) throw new Error(error.message);
    return (data ?? []).map((row: { role: string }) => row.role);
  });

export const adminListItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminItem[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("items")
      .select(ITEM_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as AdminItem[];
  });

export const adminUpdateItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string(),
        status: z.enum(["available", "reserved", "sold"]).optional(),
        published: z.boolean().optional(),
        is_new: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("items").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOrder[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, status, total, created_at, buyer_name, address, order_items(item_id, name, price)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as (Omit<AdminOrder, "items"> & {
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

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        status: z.enum(["pending", "paid", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.orderId);
    if (error) throw new Error(error.message);

    const itemStatus =
      data.status === "paid" ? "sold" : data.status === "cancelled" ? "available" : "reserved";
    const { data: lines } = await context.supabase
      .from("order_items")
      .select("item_id")
      .eq("order_id", data.orderId);
    if (lines?.length) {
      await context.supabase
        .from("items")
        .update({ status: itemStatus })
        .in(
          "id",
          lines.map((line: { item_id: string }) => line.item_id),
        );
    }
    return { ok: true };
  });
