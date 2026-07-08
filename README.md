# Gestión — Asociación Mezquita Bilal

Aplicación web completa para gestionar la asociación: ingresos, gastos, cuotas de socios,
donaciones de los viernes, traspasos caja↔banco, inventario, limpieza, tareas e informe mensual.

**Tecnologías:** Next.js 14 (App Router) · React 18 · Tailwind CSS · Recharts · **Supabase (PostgreSQL)**

---

## 1. Estructura del proyecto

```
gestion-mezquita-bilal/
├── package.json              Dependencias y comandos
├── next.config.mjs           Configuración de Next.js
├── tailwind.config.js        Paleta de colores y fuentes del proyecto
├── postcss.config.mjs        Necesario para Tailwind
├── jsconfig.json             Permite importar con "@/..."
├── .env.example              Variables de entorno (plantilla)
├── .gitignore
├── README.md                 Este archivo
├── app/
│   ├── layout.js             Estructura común (fuentes, barra lateral, datos)
│   ├── globals.css           Estilos base y clases reutilizables
│   ├── page.js               Panel (portada)
│   ├── registro/page.js      Registro de movimientos
│   ├── socios/page.js        Altas y bajas de socios
│   ├── cuotas/page.js        Cuadro de cuotas + registro masivo mensual
│   ├── viernes/page.js       Donaciones de los viernes
│   ├── tesoreria/page.js     Saldos caja/banco + traspasos
│   ├── inventario/page.js    Material con aviso de reposición
│   ├── limpieza/page.js      Turnos de limpieza
│   ├── tareas/page.js        Tareas de la junta
│   ├── informe/page.js       Informe mensual imprimible
│   ├── ajustes/page.js       Configuración, copias de seguridad
│   └── api/
│       ├── health/route.js   GET /api/health (estado del servidor)
│       └── demo/route.js     GET /api/demo (datos de ejemplo)
├── components/
│   ├── Sidebar.js            Navegación lateral (plegable en el móvil)
│   ├── Cabecera.js           Título de cada página
│   ├── Tarjeta.js            Bloque blanco reutilizable
│   ├── Kpi.js                Indicador numérico
│   ├── Campo.js              Campo de formulario con error
│   └── Khatam.js             Estrella de ocho puntas (motivo de la marca)
├── lib/
│   ├── util.js               Constantes, formato de euros y fechas
│   ├── supabase.js           Cliente de Supabase + todas las funciones CRUD
│   ├── datos.js              Une la interfaz con la base de datos (optimista)
│   └── calculos.js           Saldos, cuotas, deuda y series de gráficos
└── supabase/
    └── schema.sql            Esquema completo: pegar en el SQL Editor de Supabase
```

## 2. Dónde se guardan los datos

Los datos viven en **Supabase** (una base de datos PostgreSQL gratuita en la nube), en
6 tablas: `config`, `socios`, `movimientos`, `inventario`, `limpieza` y `tareas`.
Ventajas: todos los dispositivos ven los mismos datos al instante, y nada se pierde si
se borra el navegador. La app pinta cada cambio inmediatamente y lo guarda por detrás;
si el guardado falla, avisa y recarga desde el servidor.

### Crear la base de datos (5 minutos, gratis)

1. Entra en https://supabase.com → **Start your project** (cuenta gratis con GitHub o Google).
2. **New project** → ponle nombre (ej. `mezquita-bilal`), una contraseña de base de datos
   (guárdala) y región `West EU`. Espera 1-2 minutos a que se cree.
3. Menú lateral → **SQL Editor** → **New query** → pega TODO el contenido del archivo
   **`supabase/schema.sql`** de este proyecto → botón **Run**. Verás "Success".
4. Menú lateral → **Settings → API** → copia dos valores:
   - **Project URL** (algo como `https://abcdefgh.supabase.co`)
   - **anon public** (una clave larga que empieza por `eyJ...`)
5. En la carpeta del proyecto, copia `.env.example` como **`.env.local`** y pega ahí
   esos dos valores.

## 3. Instalación (paso a paso)

**Requisito único: Node.js 18 o superior.** Si no lo tienes, descárgalo de
https://nodejs.org (botón "LTS") e instálalo con "siguiente, siguiente".

Abre una terminal (en Windows: buscar "cmd" o "PowerShell") dentro de la carpeta del
proyecto y ejecuta:

```bash
npm install
```

Esto descarga todas las piezas que necesita la aplicación (tarda 1-2 minutos, solo se
hace una vez). Después, crea el archivo **`.env.local`** con tus claves de Supabase
(paso explicado en la sección 2). Sin ese archivo, la app mostrará una pantalla de
instrucciones en lugar de los datos.

## 4. Ejecutar en tu ordenador

```bash
npm run dev
```

Abre el navegador en **http://localhost:3000** y ya está funcionando. Para pararla,
pulsa Ctrl+C en la terminal.

## 5. Hacer la versión de producción (build)

```bash
npm run build
npm run start
```

`build` prepara la versión optimizada; `start` la sirve en http://localhost:3000.

## 6. Desplegar en Vercel (gratis)

**Opción A — Con la página web (recomendada para no técnicos):**
1. Crea una cuenta gratis en https://vercel.com (puedes entrar con Google o GitHub).
2. Sube el proyecto a un repositorio de GitHub (https://github.com/new → arrastra la carpeta,
   o con git: `git init && git add . && git commit -m "primera versión" && git push`).
3. En Vercel: **Add New → Project → Import** tu repositorio → botón **Deploy**.
4. Antes de pulsar Deploy, abre **Environment Variables** y añade las dos claves de
   Supabase: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (las mismas
   de tu `.env.local`).
5. En 1-2 minutos tendrás una dirección tipo `https://gestion-mezquita-bilal.vercel.app`.
   Cada vez que subas cambios a GitHub, Vercel actualiza la web sola.

**Opción B — Desde la terminal:**
```bash
npm install -g vercel
vercel login
vercel          # despliegue de prueba
vercel --prod   # despliegue definitivo
```

## 7. Variables de entorno (opcional)

Copia `.env.example` como `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL="https://TU-PROYECTO.supabase.co"   # obligatoria
NEXT_PUBLIC_SUPABASE_ANON_KEY="TU_CLAVE_ANON"                # obligatoria
NEXT_PUBLIC_NOMBRE_ASOCIACION="Asociación Mezquita Bilal"    # opcional
```

En Vercel se configuran en **Settings → Environment Variables**. La clave `anon` es la
pública (está pensada para usarse en el navegador); la seguridad real la ponen las
políticas RLS de la base de datos, que ya vienen creadas en `schema.sql`.

## 8. Explicación sencilla (para alguien no técnico)

- La app es como el Excel que teníamos, pero en una página web bonita que funciona en
  el móvil y en el ordenador.
- Todo el dinero se apunta en **Registro**. Las cuotas, los viernes y la tesorería se
  calculan solos a partir de eso.
- En **Cuotas** hay un botón que apunta de golpe la cuota del mes de todos los socios.
- En **Tesorería** está el traspaso para cuando se lleva el dinero de la caja al banco.
- En **Informe** se elige el mes y se imprime (o se guarda en PDF) para la asamblea.
- En **Ajustes** se cambian las categorías, la cuota, los saldos iniciales, y se hacen
  **copias de seguridad** (¡descarga una cada mes!). Los datos están en la nube:
  el móvil y el ordenador ven lo mismo.

## 8b. Módulo de Socios ampliado (libro de socios)

La ficha de cada socio incluye: DNI/NIE (con validación de la letra y sin duplicados),
dirección completa, email, fecha de nacimiento, cargo en la junta, fechas de alta y baja,
resumen económico (cuotas del año, deuda, total aportado) e historial de pagos. El listado
tiene buscador, filtro por estado y **exportación del libro de socios a CSV** (Excel).

**Si tu base de datos ya existía antes de esta versión**, ejecuta una vez el archivo
`supabase/migracion_socios.sql` en el SQL Editor de Supabase (es segura: solo añade
columnas, no toca datos). Las instalaciones nuevas no la necesitan.

## 9. Posibles mejoras futuras

- Recibos en PDF para cada socio al pagar su cuota.
- Campañas especiales (Ramadán, Aid) con objetivo y barra de progreso.
- Gráfico comparativo entre años.
- Recordatorios automáticos de cuotas pendientes por WhatsApp/SMS.
- Modo multiusuario con permisos (presidente ve todo, vocal solo limpieza).
- App instalable (PWA) con funcionamiento sin conexión.

## 10. Cómo conectar un dominio propio

1. Compra el dominio (por ejemplo `mezquitabilal.org`) en Namecheap, IONOS o similar (~10 €/año).
2. En Vercel: tu proyecto → **Settings → Domains → Add** → escribe el dominio.
3. Vercel te dará dos registros DNS (un A y un CNAME). Cópialos en el panel DNS de tu
   proveedor de dominio.
4. En unos minutos-horas el dominio funciona, con certificado HTTPS automático y gratis.

## 11. Base de datos: ya conectada ✔

Este proyecto ya usa **Supabase** como base de datos (ver sección 2). El esquema completo
está en `supabase/schema.sql`, el cliente y todas las funciones CRUD en `lib/supabase.js`,
y la capa que une la interfaz con la base de datos en `lib/datos.js`. Para ver o editar
los datos a mano: Supabase → **Table Editor**.

## 12. Cómo añadir login de usuarios

La librería estándar en Next.js es **Auth.js (NextAuth)**:

1. `npm install next-auth`
2. Crea `app/api/auth/[...nextauth]/route.js` con un proveedor (Google es el más fácil:
   solo necesitas crear unas credenciales gratuitas en Google Cloud Console).
3. Añade las variables `AUTH_SECRET`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en
   `.env.local` y en Vercel.
4. Protege las páginas con un `middleware.js` que redirija a /login si no hay sesión.
5. Al añadir login, sustituye en `supabase/schema.sql` las políticas RLS "acceso total"
   por políticas que exijan usuario autenticado, por ejemplo:
   `create policy ... using (auth.role() = 'authenticated');`
   Así, aunque alguien conozca la clave anon, sin iniciar sesión no podrá leer ni
   escribir nada. (Alternativa igual de buena: **Supabase Auth**, integrado en la
   misma plataforma.)

---

Hecho con cariño para la Asociación Mezquita Bilal. بارك الله فيكم
