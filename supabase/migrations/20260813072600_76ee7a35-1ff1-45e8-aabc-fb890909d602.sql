
create type public.app_role as enum ('admin','seller','customer');
create type public.item_status as enum ('available','reserved','sold');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'customer')
  on conflict (user_id, role) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table public.items (
  id text primary key,
  room_slug text not null,
  name text not null,
  icon text not null default '🏺',
  category text not null default 'inne',
  condition text not null default '',
  year_label text not null default '',
  dimensions text not null default '',
  price numeric(10,2),
  description text not null default '',
  status public.item_status not null default 'available',
  is_new boolean not null default false,
  x numeric(5,2) not null default 50,
  y numeric(5,2) not null default 50,
  photo_url text,
  spin_images text[] not null default '{}',
  owner_id uuid references auth.users(id) on delete set null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.items to anon;
grant select, insert, update, delete on public.items to authenticated;
grant all on public.items to service_role;
alter table public.items enable row level security;
create policy "public items read" on public.items for select to anon using (published = true);
create policy "auth items read" on public.items for select to authenticated using (published = true or auth.uid() = owner_id or public.has_role(auth.uid(),'admin'));
create policy "own items insert" on public.items for insert to authenticated with check (auth.uid() = owner_id);
create policy "own items update" on public.items for update to authenticated using (auth.uid() = owner_id or public.has_role(auth.uid(),'admin')) with check (auth.uid() = owner_id or public.has_role(auth.uid(),'admin'));
create policy "own items delete" on public.items for delete to authenticated using (auth.uid() = owner_id or public.has_role(auth.uid(),'admin'));
create index items_room_idx on public.items (room_slug);
create index items_category_idx on public.items (category);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, item_id)
);
grant select, insert, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;
create policy "own cart all" on public.cart_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  total numeric(10,2) not null default 0,
  payment_ref text,
  buyer_name text,
  address text,
  created_at timestamptz not null default now()
);
grant select on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own orders read" on public.orders for select to authenticated using (auth.uid() = user_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_id text not null references public.items(id),
  name text not null,
  price numeric(10,2) not null default 0
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "own order items read" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

insert into public.items (id, room_slug, name, icon, category, condition, year_label, dimensions, price, description, status, is_new, x, y) values
('zegar-junghans','salon','Zegar mechaniczny Junghans','🕰️','zegary','Używany, sprawny','ok. 1960','35 × 20 cm',450,'Ścienny zegar wahadłowy z drewnianą obudową i mosiężnym wahadłem. Chodzi równo, wymaga nakręcania raz w tygodniu.','available',true,41,22),
('obraz-pejzaz','salon','Obraz olejny — pejzaż z drzewami','🖼️','obrazy','Dobry, rama z przetarciami','1. połowa XX w.','70 × 50 cm',890,'Olej na płótnie w złoconej ramie. Ciemna, nastrojowa paleta, sygnatura nieczytelna.','available',false,65,21),
('radio-bakelit','salon','Radio lampowe w bakelicie','📻','elektronika','Używane, do przeglądu','ok. 1958','48 × 28 × 22 cm',620,'Klasyczne radio lampowe ze świecącą skalą. Obudowa bez pęknięć, zalecany przegląd elektryki.','sold',false,70,51),
('lampa-mosiadz','salon','Lampa stołowa z mosiężną podstawą','💡','lampy','Bardzo dobry','lata 60.','wys. 62 cm',340,'Toczona mosiężna podstawa, oryginalny plisowany abażur, nowe okablowanie.','available',false,81,41),
('porcelana-serwis','salon','Porcelana — dzbanki i filiżanka','🏺','porcelana','Dobry, drobne przetarcia złoceń','lata 40.–50.','dzbanek wys. 24 cm',260,'Zestaw ręcznie malowanej porcelany. Sprzedawany jako komplet pięciu części.','available',true,56,49),
('fotel-tapicerowany','salon','Fotel tapicerowany, zielona tkanina','🪑','meble','Używany, tkanina do wymiany','ok. 1962','72 × 80 × 88 cm',520,'Konstrukcja z litego drewna, stabilna. Oryginalna żakardowa tkanina z widocznym zużyciem.','reserved',false,31,70),
('maszyna-do-pisania','gabinet','Maszyna do pisania, czarna emalia','⌨️','biuro','Używana, sprawna','ok. 1935','32 × 30 × 20 cm',780,'Wszystkie klawisze działają, taśma wymieniona. Polskie znaki diakrytyczne.','available',true,59,51),
('globus','gabinet','Globus na mosiężnej stopie','🌍','biuro','Dobry, patyna','lata 30.','wys. 46 cm',690,'Papierowa mapa na kuli gipsowej, granice przedwojenne. Obraca się swobodnie.','available',false,7,38),
('ksiazki-skora','gabinet','Książki w skórzanych oprawach (6 szt.)','📚','książki','Dobry','1890–1920','ok. 22 × 15 cm',480,'Zestaw sześciu tomów w skórze ze złoconymi tłoczeniami. Bloki zwarte.','available',false,44,49),
('lampa-bankierska','gabinet','Lampa bankierska, mosiądz i szkło','🛋️','lampy','Bardzo dobry','lata 20.','wys. 40 cm',560,'Mosiężny korpus, żółty szklany klosz. Okablowanie wymienione.','available',false,68,39),
('portret-olejny','gabinet','Portret olejny w złotej ramie','🖼️','obrazy','Dobry, werniks przyciemniony','XIX w.','60 × 45 cm',1450,'Portret mężczyzny, olej na płótnie. Rama ze śladami zużycia.','available',false,92,12),
('fotel-biurowy','gabinet','Fotel biurowy obrotowy, skóra','🪑','meble','Używany, skóra z patyną','ok. 1930','60 × 60 × 100 cm',1100,'Dębowa konstrukcja, pikowana skóra, sprawny mechanizm obrotowy.','available',false,34,74),
('garnki-emaliowane','kuchnia','Garnki emaliowane (3 szt.)','🍲','kuchnia','Używane, drobne odpryski','lata 50.','24, 20 i 16 cm',180,'Trzy garnki z pokrywkami, biała i miętowa emalia. Nadają się do użytku.','available',false,10,52),
('kuchnia-weglowa','kuchnia','Kuchnia węglowa, żeliwo','🔥','kuchnia','Do renowacji','przed 1939','100 × 60 × 85 cm',2200,'Masywny piec żeliwny z mosiężnymi okuciami. Wymaga czyszczenia i uszczelnień.','available',false,15,76),
('patelnie-miedziane','kuchnia','Patelnie miedziane na listwie (5 szt.)','🥘','kuchnia','Dobry, patyna','lata 40.','18–32 cm',420,'Pięć miedzianych patelni z kutymi uchwytami, sprzedawane z drewnianą listwą.','available',true,25,21),
('dzban-kamionkowy','kuchnia','Dzban kamionkowy','🏺','porcelana','Bardzo dobry','ok. 1930','wys. 28 cm',150,'Ręcznie toczona kamionka w kolorze oliwki, szkliwiona, bez pęknięć.','available',false,76,67),
('mlynek-do-kawy','kuchnia','Młynek do kawy z korbką','☕','kuchnia','Używany, sprawny','lata 50.','18 × 12 cm',210,'Drewniana skrzynka, żeliwny mechanizm, regulacja grubości mielenia.','sold',false,96,45),
('kredens-zielony','kuchnia','Kredens kuchenny, zielona patyna','🚪','meble','Dobry, oryginalna farba','lata 30.','120 × 45 × 200 cm',1900,'Dwuczęściowy kredens z witryną i szufladami. Oryginalna warstwa farby.','available',false,57,30),
('zegar-stojacy','korytarz','Zegar stojący z wahadłem','🕰️','zegary','Sprawny, po przeglądzie','ok. 1900','48 × 30 × 195 cm',4800,'Dębowa obudowa z rzeźbionym zwieńczeniem, mosiężna tarcza, bicie na godzinę i połowę.','available',true,28,45),
('lustro-owalne','korytarz','Lustro owalne w złoconej ramie','🪞','lustra','Dobry, tafla z plamkami','XIX/XX w.','70 × 50 cm',980,'Rzeźbione zwieńczenie, oryginalna tafla z charakterystyczną patyną.','available',false,85,24),
('wieszak-stojacy','korytarz','Wieszak stojący z kapeluszem','🎩','meble','Dobry','lata 20.','wys. 180 cm',640,'Toczony bukowy wieszak z sześcioma ramionami. Filcowy kapelusz w zestawie.','available',false,8,26),
('swiecznik-mosiezny','korytarz','Świecznik mosiężny','🕯️','dekoracje','Bardzo dobry','ok. 1910','wys. 34 cm',230,'Toczony mosiądz z naturalną patyną, stabilna podstawa.','available',false,77,55),
('konsolka','korytarz','Konsolka przedpokojowa','🪑','meble','Dobry, politura odświeżona','koniec XIX w.','80 × 40 × 78 cm',1250,'Giętkie nogi, fornirowany blat, jedna szuflada z drewnianym uchwytem.','reserved',false,83,72),
('kinkiet','korytarz','Kinkiet ze szklanym kloszem','💡','lampy','Sprawny','lata 20.','28 × 18 cm',390,'Mosiężne ramię, oryginalny szklany klosz w formie tulipana.','available',false,74,20);
