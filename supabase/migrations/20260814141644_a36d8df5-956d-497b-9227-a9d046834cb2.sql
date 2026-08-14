create policy "admin orders read" on public.orders for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin orders update" on public.orders for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
grant update on public.orders to authenticated;

create policy "admin order items read" on public.order_items for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "admin profiles read" on public.profiles for select to authenticated using (public.has_role(auth.uid(), 'admin'));