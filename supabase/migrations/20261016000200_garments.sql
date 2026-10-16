-- Fase 1 · Tabla garments con RLS
-- Guardamos rutas de Storage (no URLs): las URLs firmadas caducan y se generan al leer.
-- Convención de rutas: {user_id}/{garment_id}/original.jpg  y  {user_id}/{garment_id}/cutout.png

create table public.garments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid()
                   references auth.users (id) on delete cascade,

  -- Imágenes
  original_path  text not null,
  cutout_path    text,

  -- Etiquetas (las rellena la IA en fase 2; el usuario puede corregirlas)
  category       public.garment_category,
  subcategory    text,
  colors         text[] not null default '{}',
  pattern        text,
  material       text,
  seasons        public.garment_season[] not null default '{}',
  formality      smallint check (formality between 1 and 5),
  brand          text,
  notes          text,

  -- Estado del procesado (solo lo escribe el backend con service_role)
  status         public.processing_status not null default 'processing',
  error_message  text,
  attempts       smallint not null default 0,
  ai_tags        jsonb,          -- respuesta cruda de la IA, para depurar
  processed_at   timestamptz,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Una prenda solo puede apuntar a ficheros de su propia carpeta.
  constraint garments_original_path_owner
    check (original_path like user_id::text || '/' || id::text || '/%'),
  constraint garments_cutout_path_owner
    check (cutout_path is null or cutout_path like user_id::text || '/' || id::text || '/%'),

  constraint garments_text_lengths check (
        char_length(coalesce(subcategory, '')) <= 60
    and char_length(coalesce(pattern, ''))     <= 60
    and char_length(coalesce(material, ''))    <= 60
    and char_length(coalesce(brand, ''))       <= 100
    and char_length(coalesce(notes, ''))       <= 1000
  ),
  constraint garments_colors_max check (cardinality(colors) <= 5)
);

comment on table public.garments is 'Prendas del armario de cada usuario.';

-- Índices para el listado del armario y sus filtros
create index garments_user_created_idx  on public.garments (user_id, created_at desc);
create index garments_user_category_idx on public.garments (user_id, category);
create index garments_colors_gin        on public.garments using gin (colors);
create index garments_seasons_gin       on public.garments using gin (seasons);

create trigger garments_set_updated_at
  before update on public.garments
  for each row execute function public.set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.garments enable row level security;

create policy garments_select_own on public.garments
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy garments_insert_own on public.garments
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy garments_update_own on public.garments
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy garments_delete_own on public.garments
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ── Privilegios por columna ────────────────────────────────────────────────
-- RLS decide QUÉ filas; los grants deciden QUÉ columnas.
-- El usuario no puede tocar user_id, status, cutout_path, ai_tags, attempts…
revoke all on public.garments from anon;
revoke insert, update on public.garments from authenticated;

grant insert (id, original_path, category, subcategory, colors, pattern,
              material, seasons, formality, brand, notes)
  on public.garments to authenticated;

grant update (category, subcategory, colors, pattern, material, seasons,
              formality, brand, notes)
  on public.garments to authenticated;
