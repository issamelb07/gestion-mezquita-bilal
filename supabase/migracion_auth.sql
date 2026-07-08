-- ============================================================================
--  MIGRACIÓN: autenticación — cerrar la base de datos a usuarios con sesión
--  Pegar en Supabase → SQL Editor → Run (después de activar el login en la app).
--
--  Antes de ejecutarla, crea al menos un usuario:
--    Supabase → Authentication → Users → Add user → email + contraseña
--    (marca "Auto Confirm User" para no depender del correo)
--  Y desactiva el registro público:
--    Authentication → Sign In / Up → desactiva "Allow new users to sign up"
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) Tablas: solo usuarios autenticados (la clave anon sin sesión ya no vale)
-- ----------------------------------------------------------------------------
drop policy if exists "acceso_total_config"      on public.config;
drop policy if exists "acceso_total_socios"      on public.socios;
drop policy if exists "acceso_total_movimientos" on public.movimientos;
drop policy if exists "acceso_total_inventario"  on public.inventario;
drop policy if exists "acceso_total_limpieza"    on public.limpieza;
drop policy if exists "acceso_total_tareas"      on public.tareas;
drop policy if exists "acceso_total_documentos"  on public.documentos;

create policy "config_autenticados"      on public.config      for all to authenticated using (true) with check (true);
create policy "socios_autenticados"      on public.socios      for all to authenticated using (true) with check (true);
create policy "movimientos_autenticados" on public.movimientos for all to authenticated using (true) with check (true);
create policy "inventario_autenticados"  on public.inventario  for all to authenticated using (true) with check (true);
create policy "limpieza_autenticados"    on public.limpieza    for all to authenticated using (true) with check (true);
create policy "tareas_autenticados"      on public.tareas      for all to authenticated using (true) with check (true);
create policy "documentos_autenticados"  on public.documentos  for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
-- 2) Almacén de documentos: bucket privado + acceso solo con sesión
--    (la app pasa a usar enlaces firmados temporales para ver los archivos)
-- ----------------------------------------------------------------------------
update storage.buckets set public = false where id = 'documentos';

drop policy if exists "documentos_lectura" on storage.objects;
drop policy if exists "documentos_subida"  on storage.objects;
drop policy if exists "documentos_borrado" on storage.objects;

create policy "documentos_lectura" on storage.objects
  for select to authenticated using (bucket_id = 'documentos');
create policy "documentos_subida" on storage.objects
  for insert to authenticated with check (bucket_id = 'documentos');
create policy "documentos_borrado" on storage.objects
  for delete to authenticated using (bucket_id = 'documentos');

-- ============================================================================
-- FIN — Desde este momento, sin iniciar sesión no se puede leer ni escribir
-- nada, aunque alguien conozca la URL del proyecto y la clave anon.
-- ============================================================================
