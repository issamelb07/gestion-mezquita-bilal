-- ============================================================================
--  MIGRACIÓN: módulo de Documentos (actas, seguros, facturas, contratos…)
--  Pegar en Supabase → SQL Editor → Run.
--  Crea la tabla de documentos y el almacén de archivos (bucket "documentos").
--  Es segura: no toca ningún dato existente.
--  (Las instalaciones nuevas no la necesitan: schema.sql ya lo incluye todo)
-- ============================================================================

-- 1) Tabla con la información de cada documento
create table if not exists public.documentos (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null check (length(trim(titulo)) > 0),
  categoria      text not null default 'Otro'
                 check (categoria in ('Acta','Estatutos','Seguro','Factura','Contrato','Certificado','Subvención','Correspondencia','Otro')),
  fecha_documento date,                       -- fecha del documento (no de subida)
  descripcion    text,
  archivo_ruta   text not null,               -- ruta dentro del bucket "documentos"
  archivo_nombre text not null,               -- nombre original del archivo
  archivo_tipo   text,                        -- tipo (application/pdf, image/jpeg…)
  archivo_tamano bigint not null default 0 check (archivo_tamano >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_documentos_categoria on public.documentos (categoria);
create index if not exists idx_documentos_fecha     on public.documentos (fecha_documento desc);

drop trigger if exists documentos_updated_at on public.documentos;
create trigger documentos_updated_at
  before update on public.documentos
  for each row execute function public.tocar_updated_at();

-- RLS igual que el resto de tablas (endurecer al añadir login)
alter table public.documentos enable row level security;
drop policy if exists "acceso_total_documentos" on public.documentos;
create policy "acceso_total_documentos" on public.documentos for all using (true) with check (true);

-- 2) Almacén de archivos: bucket "documentos" (máximo 10 MB por archivo)
insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', true, 10485760)
on conflict (id) do update set public = true, file_size_limit = 10485760;

-- 3) Permisos del almacén para la clave pública de la app
drop policy if exists "documentos_lectura" on storage.objects;
drop policy if exists "documentos_subida"  on storage.objects;
drop policy if exists "documentos_borrado" on storage.objects;

create policy "documentos_lectura" on storage.objects
  for select using (bucket_id = 'documentos');
create policy "documentos_subida" on storage.objects
  for insert with check (bucket_id = 'documentos');
create policy "documentos_borrado" on storage.objects
  for delete using (bucket_id = 'documentos');
