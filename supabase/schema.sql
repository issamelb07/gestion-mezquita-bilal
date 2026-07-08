-- ============================================================================
--  GESTIÓN — ASOCIACIÓN MEZQUITA BILAL
--  Esquema completo para Supabase (PostgreSQL)
--  Pegar TODO este archivo en: Supabase → SQL Editor → New query → Run
-- ============================================================================

-- Extensión para generar UUIDs (ya viene activa en Supabase, por si acaso)
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Función común: mantener updated_at al día en cada UPDATE
-- ----------------------------------------------------------------------------
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1) CONFIG — una sola fila con los parámetros de la asociación
-- ============================================================================
create table if not exists public.config (
  id              uuid primary key default gen_random_uuid(),
  -- Truco de fila única: esta columna siempre vale true y es UNIQUE,
  -- así la base de datos impide que exista más de una configuración.
  singleton       boolean not null default true unique check (singleton),
  nombre          text not null default 'Asociación Mezquita Bilal',
  anio            integer not null default extract(year from now())::int
                  check (anio between 2020 and 2100),
  cuota_mes       numeric(10,2) not null default 10 check (cuota_mes >= 0),
  saldo_ini_caja  numeric(12,2) not null default 0,
  saldo_ini_banco numeric(12,2) not null default 0,
  cat_ingreso     text[] not null default array['Cuota de socio','Donación viernes','Donativo puntual','Evento/Campaña','Otros ingresos'],
  cat_gasto       text[] not null default array['Alquiler','Electricidad','Agua','Productos de limpieza','Mantenimiento','Personal/Imam','Eventos','Otros gastos'],
  zonas           text[] not null default array['Sala de oración','Aseos / Wudú','Entrada','Cocina','Sala de mujeres','Exterior'],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger config_updated_at
  before update on public.config
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- 2) SOCIOS — miembros de la asociación
-- ============================================================================
create table if not exists public.socios (
  id               uuid primary key default gen_random_uuid(),
  codigo           text not null unique,                    -- S001, S002…
  nombre           text not null check (length(trim(nombre)) > 0),
  dni              text,                                    -- DNI o NIE
  telefono         text,
  email            text,
  direccion        text,                                    -- calle y número
  ciudad           text,
  codigo_postal    text,
  fecha_nacimiento date,
  alta             date,
  fecha_baja       date,                                    -- se rellena al pasar a Baja
  cargo            text not null default 'Socio'
                   check (cargo in ('Socio','Presidente','Vicepresidente','Secretario','Tesorero','Vocal','Imam')),
  cuota            numeric(10,2) not null default 10 check (cuota >= 0),
  estado           text not null default 'Activo' check (estado in ('Activo','Baja')),
  notas            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_socios_estado on public.socios (estado);
create index if not exists idx_socios_codigo on public.socios (codigo);
create index if not exists idx_socios_nombre on public.socios (nombre);

-- Un mismo DNI/NIE no puede repetirse (ignorando mayúsculas y vacíos)
create unique index if not exists idx_socios_dni_unico
  on public.socios (upper(dni))
  where dni is not null and dni <> '';

create trigger socios_updated_at
  before update on public.socios
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- 3) MOVIMIENTOS — todo el dinero: ingresos, gastos y traspasos caja↔banco
-- ============================================================================
create table if not exists public.movimientos (
  id          uuid primary key default gen_random_uuid(),
  fecha       date not null,
  tipo        text not null check (tipo in ('Ingreso','Gasto','Traspaso')),
  categoria   text,
  concepto    text,
  socio_id    uuid references public.socios (id) on delete set null,
  importe     numeric(12,2) not null check (importe > 0),
  pago        text check (pago in ('Caja','Banco')),        -- null en traspasos
  origen      text check (origen in ('Caja','Banco')),      -- solo traspasos
  destino     text check (destino in ('Caja','Banco')),     -- solo traspasos
  responsable text,
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Un traspaso debe tener origen y destino distintos; ingresos y gastos, forma de pago
  constraint traspaso_valido check (
    (tipo = 'Traspaso' and origen is not null and destino is not null and origen <> destino)
    or
    (tipo in ('Ingreso','Gasto') and pago is not null)
  )
);

create index if not exists idx_movimientos_fecha     on public.movimientos (fecha);
create index if not exists idx_movimientos_tipo      on public.movimientos (tipo);
create index if not exists idx_movimientos_categoria on public.movimientos (categoria);
create index if not exists idx_movimientos_socio     on public.movimientos (socio_id);

create trigger movimientos_updated_at
  before update on public.movimientos
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- 4) INVENTARIO — material de la mezquita
-- ============================================================================
create table if not exists public.inventario (
  id         uuid primary key default gen_random_uuid(),
  articulo   text not null check (length(trim(articulo)) > 0),
  categoria  text,
  cantidad   integer not null default 0 check (cantidad >= 0),
  minimo     integer not null default 0 check (minimo >= 0),
  ubicacion  text,
  revision   date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger inventario_updated_at
  before update on public.inventario
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- 5) LIMPIEZA — turnos por semana y zona
-- ============================================================================
create table if not exists public.limpieza (
  id          uuid primary key default gen_random_uuid(),
  semana      date not null,
  zona        text not null,
  responsable text not null check (length(trim(responsable)) > 0),
  estado      text not null default 'Pendiente' check (estado in ('Pendiente','Hecho')),
  obs         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_limpieza_semana on public.limpieza (semana desc);
create index if not exists idx_limpieza_estado on public.limpieza (estado);

create trigger limpieza_updated_at
  before update on public.limpieza
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- 6) TAREAS — administración general de la junta
-- ============================================================================
create table if not exists public.tareas (
  id           uuid primary key default gen_random_uuid(),
  tarea        text not null check (length(trim(tarea)) > 0),
  responsable  text,
  prioridad    text not null default 'Media' check (prioridad in ('Alta','Media','Baja')),
  fecha_limite date,
  estado       text not null default 'Pendiente' check (estado in ('Pendiente','En curso','Hecha')),
  notas        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_tareas_estado on public.tareas (estado);

create trigger tareas_updated_at
  before update on public.tareas
  for each row execute function public.tocar_updated_at();

-- ============================================================================
-- 7) DOCUMENTOS — actas, seguros, facturas, contratos, certificados…
--    Los archivos se guardan en el bucket "documentos" de Supabase Storage;
--    esta tabla guarda su información (título, categoría, fecha, ruta).
-- ============================================================================
create table if not exists public.documentos (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null check (length(trim(titulo)) > 0),
  categoria      text not null default 'Otro'
                 check (categoria in ('Acta','Estatutos','Seguro','Factura','Contrato','Certificado','Subvención','Correspondencia','Otro')),
  fecha_documento date,
  descripcion    text,
  archivo_ruta   text not null,
  archivo_nombre text not null,
  archivo_tipo   text,
  archivo_tamano bigint not null default 0 check (archivo_tamano >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_documentos_categoria on public.documentos (categoria);
create index if not exists idx_documentos_fecha     on public.documentos (fecha_documento desc);

create trigger documentos_updated_at
  before update on public.documentos
  for each row execute function public.tocar_updated_at();

-- Almacén de archivos: bucket "documentos" (máximo 10 MB por archivo)
insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', true, 10485760)
on conflict (id) do update set public = true, file_size_limit = 10485760;

drop policy if exists "documentos_lectura" on storage.objects;
drop policy if exists "documentos_subida"  on storage.objects;
drop policy if exists "documentos_borrado" on storage.objects;
create policy "documentos_lectura" on storage.objects
  for select using (bucket_id = 'documentos');
create policy "documentos_subida" on storage.objects
  for insert with check (bucket_id = 'documentos');
create policy "documentos_borrado" on storage.objects
  for delete using (bucket_id = 'documentos');

-- ============================================================================
-- SEGURIDAD (RLS)
-- La app usa la clave pública (anon). De momento se permite todo a anon
-- porque la aplicación no tiene login. IMPORTANTE: cuando se añada
-- autenticación (Auth.js o Supabase Auth), sustituir estas políticas por
-- otras que exijan usuario autenticado: using (auth.role() = 'authenticated').
-- ============================================================================
alter table public.config      enable row level security;
alter table public.socios      enable row level security;
alter table public.movimientos enable row level security;
alter table public.inventario  enable row level security;
alter table public.limpieza    enable row level security;
alter table public.tareas      enable row level security;
alter table public.documentos enable row level security;

drop policy if exists "acceso_total_config"      on public.config;
drop policy if exists "acceso_total_socios"      on public.socios;
drop policy if exists "acceso_total_movimientos" on public.movimientos;
drop policy if exists "acceso_total_inventario"  on public.inventario;
drop policy if exists "acceso_total_limpieza"    on public.limpieza;
drop policy if exists "acceso_total_tareas"      on public.tareas;
drop policy if exists "acceso_total_documentos" on public.documentos;

create policy "acceso_total_config"      on public.config      for all using (true) with check (true);
create policy "acceso_total_socios"      on public.socios      for all using (true) with check (true);
create policy "acceso_total_movimientos" on public.movimientos for all using (true) with check (true);
create policy "acceso_total_inventario"  on public.inventario  for all using (true) with check (true);
create policy "acceso_total_limpieza"    on public.limpieza    for all using (true) with check (true);
create policy "acceso_total_tareas"      on public.tareas      for all using (true) with check (true);
create policy "acceso_total_documentos" on public.documentos for all using (true) with check (true);

-- ============================================================================
-- DATOS INICIALES (necesarios): la fila única de configuración
-- ============================================================================
insert into public.config (singleton)
values (true)
on conflict (singleton) do nothing;

-- ============================================================================
-- DATOS DE EJEMPLO (OPCIONALES)
-- Quita los guiones "--" de las líneas siguientes solo si quieres probar
-- la aplicación con datos ficticios. En producción, déjalo comentado:
-- la app tiene su propio botón "Cargar datos de ejemplo" en Ajustes.
-- ============================================================================
-- insert into public.socios (codigo, nombre, telefono, alta, cuota, estado) values
--   ('S001', 'Ahmed El Amrani',  '600 111 222', current_date - interval '1 year', 10, 'Activo'),
--   ('S002', 'Youssef Benali',   '600 333 444', current_date - interval '1 year', 10, 'Activo'),
--   ('S003', 'Karim Ziani',      '600 555 666', current_date - interval '6 months', 10, 'Activo');
--
-- insert into public.movimientos (fecha, tipo, categoria, concepto, socio_id, importe, pago, responsable) values
--   (date_trunc('year', now())::date + 4,  'Ingreso', 'Cuota de socio',   'Cuota de enero',      (select id from public.socios where codigo = 'S001'), 10,  'Caja',  'Tesorero'),
--   (date_trunc('year', now())::date + 1,  'Ingreso', 'Donación viernes', 'Colecta del viernes', null, 85,  'Caja',  'Tesorero'),
--   (date_trunc('year', now())::date + 9,  'Gasto',   'Alquiler',         'Alquiler del local',  null, 400, 'Banco', 'Presidente');

-- ============================================================================
-- FIN — Comprueba en Table Editor que existen las 7 tablas.
-- ============================================================================
