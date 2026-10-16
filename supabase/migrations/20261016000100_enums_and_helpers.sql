-- Fase 1 · Tipos compartidos y utilidades
-- Enums usados por garments (y más adelante por outfits/tryon_jobs).

create type public.garment_category as enum (
  'top', 'bottom', 'outerwear', 'dress', 'shoes', 'accessory'
);

create type public.garment_season as enum (
  'spring', 'summer', 'autumn', 'winter'
);

create type public.processing_status as enum (
  'processing', 'ready', 'error'
);

-- Mantiene updated_at en cualquier tabla que tenga esa columna.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
