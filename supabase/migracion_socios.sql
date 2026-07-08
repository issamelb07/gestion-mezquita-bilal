-- ============================================================================
--  MIGRACIÓN: módulo de Socios ampliado (ficha completa)
--  Para bases de datos que YA ejecutaron schema.sql anteriormente.
--  Pegar en Supabase → SQL Editor → Run. Es segura: no toca datos existentes.
--  (Las instalaciones nuevas no la necesitan: schema.sql ya lo incluye todo)
-- ============================================================================

alter table public.socios add column if not exists dni              text;
alter table public.socios add column if not exists direccion        text;
alter table public.socios add column if not exists ciudad           text;
alter table public.socios add column if not exists codigo_postal    text;
alter table public.socios add column if not exists email            text;
alter table public.socios add column if not exists fecha_nacimiento date;
alter table public.socios add column if not exists fecha_baja       date;
alter table public.socios add column if not exists cargo            text not null default 'Socio';

-- Cargo dentro de la junta (o socio normal)
alter table public.socios drop constraint if exists socios_cargo_valido;
alter table public.socios add constraint socios_cargo_valido
  check (cargo in ('Socio','Presidente','Vicepresidente','Secretario','Tesorero','Vocal','Imam'));

-- Un mismo DNI/NIE no puede repetirse (ignorando mayúsculas y vacíos)
create unique index if not exists idx_socios_dni_unico
  on public.socios (upper(dni))
  where dni is not null and dni <> '';

-- Índice para búsquedas por nombre
create index if not exists idx_socios_nombre on public.socios (nombre);
