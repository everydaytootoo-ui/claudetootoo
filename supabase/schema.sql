-- PackWith (팩위드) Supabase 스키마
-- 가족 공유(6자리 초대 코드) + 통합 위치 검색을 지원하는 최소 스키마

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  invite_code char(6) not null unique,
  created_at timestamptz not null default now()
);

create table if not exists family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null, -- "엄마", "아빠" 등
  joined_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  destination_country text not null, -- ISO 국가 코드 (JP, KR ...)
  season text not null check (season in ('spring', 'summer', 'autumn', 'winter')),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists bags (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  owner_name text not null, -- "엄마 24인치 캐리어" 표시용
  kind text not null check (kind in ('carryon20','carryon24','carryon28','backpack','boston')),
  label text not null,
  color text not null default 'cream_white',
  decoration_placements jsonb not null default '[]'::jsonb, -- StickerPlacement[]
  created_at timestamptz not null default now()
);

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  bag_id uuid not null references bags(id) on delete cascade,
  kind text not null default 'custom',
  name text not null,
  icon text not null default '🧳',
  baggage_mode text not null check (baggage_mode in ('checked', 'carryOn')),
  is_custom boolean not null default false,
  sort_order int not null default 0
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references sections(id) on delete cascade,
  name text not null,
  emoji text not null default '🧺',
  photo_url text,
  checked boolean not null default false,
  quantity int not null default 1,
  restriction text not null default 'none' check (
    restriction in ('spare_battery','lighter','liquid_over_100ml','liquid_under_100ml','sharp_object','aerosol','none')
  ),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_items_name_trgm on items using gin (name gin_trgm_ops);
create index if not exists idx_sections_bag on sections(bag_id);
create index if not exists idx_bags_trip on bags(trip_id);

-- ---------------------------------------------------------------------
-- RLS: 같은 family_id에 속한 유저만 해당 family의 데이터를 읽고 쓸 수 있다.
-- ---------------------------------------------------------------------
alter table families enable row level security;
alter table family_members enable row level security;
alter table trips enable row level security;
alter table bags enable row level security;
alter table sections enable row level security;
alter table items enable row level security;

create or replace function is_family_member(target_family_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from family_members
    where family_id = target_family_id and user_id = auth.uid()
  );
$$;

create policy "family_members can read their family" on families
  for select using (is_family_member(id));

create policy "members read own roster" on family_members
  for select using (is_family_member(family_id));

create policy "members join by invite" on family_members
  for insert with check (user_id = auth.uid());

create policy "family trips rw" on trips
  for all using (is_family_member(family_id)) with check (is_family_member(family_id));

create policy "family bags rw" on bags
  for all using (is_family_member((select family_id from trips where trips.id = trip_id)))
  with check (is_family_member((select family_id from trips where trips.id = trip_id)));

create policy "family sections rw" on sections
  for all using (
    is_family_member((select t.family_id from trips t join bags b on b.trip_id = t.id where b.id = bag_id))
  ) with check (
    is_family_member((select t.family_id from trips t join bags b on b.trip_id = t.id where b.id = bag_id))
  );

create policy "family items rw" on items
  for all using (
    is_family_member((
      select t.family_id from trips t
      join bags b on b.trip_id = t.id
      join sections s on s.bag_id = b.id
      where s.id = section_id
    ))
  ) with check (
    is_family_member((
      select t.family_id from trips t
      join bags b on b.trip_id = t.id
      join sections s on s.bag_id = b.id
      where s.id = section_id
    ))
  );

-- 6자리 초대 코드로 가족 방에 합류하기 위한 RPC
create or replace function join_family_by_code(code text, display_name text)
returns uuid language plpgsql security definer as $$
declare
  target_family_id uuid;
begin
  select id into target_family_id from families where invite_code = upper(code);
  if target_family_id is null then
    raise exception 'invalid invite code';
  end if;

  insert into family_members (family_id, user_id, display_name)
  values (target_family_id, auth.uid(), display_name)
  on conflict (family_id, user_id) do nothing;

  return target_family_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 캘린더 & 바우처/메모 보관함
-- ---------------------------------------------------------------------
create table if not exists calendar_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  event_date date not null,
  event_time time,
  title text not null,
  memo text,
  category text not null default 'etc' check (
    category in ('flight','hotel','activity','food','transport','etc')
  ),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_calendar_events_trip_date on calendar_events(trip_id, event_date);

create table if not exists vault_documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  type text not null check (
    type in ('flight_ticket','hotel_voucher','qr_code','memo','other')
  ),
  title text not null,
  file_url text, -- Supabase Storage 경로 (PDF/이미지). 오프라인 메모는 null
  file_mime_type text,
  memo_text text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_vault_documents_trip on vault_documents(trip_id);

alter table calendar_events enable row level security;
alter table vault_documents enable row level security;

create policy "family calendar_events rw" on calendar_events
  for all using (is_family_member((select family_id from trips where trips.id = trip_id)))
  with check (is_family_member((select family_id from trips where trips.id = trip_id)));

create policy "family vault_documents rw" on vault_documents
  for all using (is_family_member((select family_id from trips where trips.id = trip_id)))
  with check (is_family_member((select family_id from trips where trips.id = trip_id)));

-- vault_documents.file_url / items.photo_url 은 Supabase Storage의 비공개 버킷(예: "vault", "item-photos")에
-- 업로드한 뒤 반환되는 signed URL 또는 storage 경로를 저장하는 것을 권장한다. 버킷 정책 역시
-- family_members를 통해 같은 가족만 read/write 가능하도록 제한해야 한다.
