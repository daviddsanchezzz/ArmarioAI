-- Fase 1 · Bucket privado para fotos de prendas
-- La app comprime a JPEG (máx. 2048 px) antes de subir; el worker escribe PNG.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'garments',
  'garments',
  false,                              -- privado: solo URLs firmadas
  10485760,                           -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Cada usuario solo ve y gestiona su carpeta {user_id}/...
-- (Defensa en profundidad: la API genera las URLs firmadas con el JWT del usuario.)
create policy garments_bucket_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'garments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy garments_bucket_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'garments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy garments_bucket_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'garments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Sin política de UPDATE: no se sobrescriben originales; rehacer foto = nuevo objeto.
