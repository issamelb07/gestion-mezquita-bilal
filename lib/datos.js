"use client";

// ============================================================
// datos.js — el "almacén" de la aplicación, ahora sobre Supabase
//
// Carga todos los datos al abrir, y ofrece una API de operaciones
// (api.crearMovimiento, api.borrarSocio…) que actualiza la pantalla
// al instante y guarda en la base de datos por detrás. Si el guardado
// falla, avisa y recarga desde el servidor para no mostrar datos falsos.
// ============================================================

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as db from "@/lib/supabase";

const Ctx = createContext(null);

export function DatosProvider({ children }) {
  const [datos, setDatos] = useState(null);   // null = cargando
  const [error, setError] = useState(null);   // texto si Supabase no responde
  const [aviso, setAviso] = useState(null);
  const timerAviso = useRef(null);
  const timerConfig = useRef(null);

  const avisar = useCallback((msg) => {
    setAviso(msg);
    clearTimeout(timerAviso.current);
    timerAviso.current = setTimeout(() => setAviso(null), 3200);
  }, []);

  // ---- Carga inicial (y recarga tras un error de guardado) ----
  const recargar = useCallback(async () => {
    try {
      setError(null);
      const d = await db.cargarTodo();
      setDatos(d);
    } catch (e) {
      console.error("Error cargando datos de Supabase:", e);
      setError(e?.message || "No se pudo conectar con la base de datos.");
    }
  }, []);

  useEffect(() => { recargar(); }, [recargar]);

  // ---- Patrón optimista: pinta el cambio ya, guarda por detrás ----
  const aplicar = useCallback((cambioLocal, operacionRemota) => {
    setDatos((d) => cambioLocal(d));
    operacionRemota().catch((e) => {
      console.error("Error guardando en Supabase:", e);
      avisar("No se pudo guardar en la base de datos. Recargando…");
      recargar();
    });
  }, [avisar, recargar]);

  const api = useMemo(() => ({
    recargar,

    // ---- Configuración (con retardo para no guardar en cada tecla) ----
    guardarConfig: (config) => {
      setDatos((d) => ({ ...d, config }));
      clearTimeout(timerConfig.current);
      timerConfig.current = setTimeout(() => {
        db.guardarConfig(config).catch((e) => {
          console.error(e);
          avisar("No se pudo guardar la configuración.");
          recargar();
        });
      }, 600);
    },

    // ---- Movimientos ----
    crearMovimiento: (m) =>
      aplicar((d) => ({ ...d, movimientos: [...d.movimientos, m] }), () => db.crearMovimiento(m)),
    crearMovimientos: (lista) =>
      aplicar((d) => ({ ...d, movimientos: [...d.movimientos, ...lista] }), () => db.crearMovimientos(lista)),
    borrarMovimiento: (id) =>
      aplicar((d) => ({ ...d, movimientos: d.movimientos.filter((x) => x.id !== id) }), () => db.borrarMovimiento(id)),

    // ---- Socios ----
    crearSocio: (s) =>
      aplicar((d) => ({ ...d, socios: [...d.socios, s] }), () => db.crearSocio(s)),
    actualizarSocio: (id, campos) =>
      aplicar((d) => ({ ...d, socios: d.socios.map((x) => (x.id === id ? { ...x, ...campos } : x)) }), () => db.actualizarSocio(id, campos)),
    borrarSocio: (id) =>
      aplicar((d) => ({ ...d, socios: d.socios.filter((x) => x.id !== id) }), () => db.borrarSocio(id)),

    // ---- Inventario ----
    crearInventario: (i) =>
      aplicar((d) => ({ ...d, inventario: [...d.inventario, i] }), () => db.crearInventario(i)),
    actualizarInventario: (id, campos) =>
      aplicar((d) => ({ ...d, inventario: d.inventario.map((x) => (x.id === id ? { ...x, ...campos } : x)) }), () => db.actualizarInventario(id, campos)),
    borrarInventario: (id) =>
      aplicar((d) => ({ ...d, inventario: d.inventario.filter((x) => x.id !== id) }), () => db.borrarInventario(id)),

    // ---- Limpieza ----
    crearLimpieza: (l) =>
      aplicar((d) => ({ ...d, limpieza: [...d.limpieza, l] }), () => db.crearLimpieza(l)),
    actualizarLimpieza: (id, campos) =>
      aplicar((d) => ({ ...d, limpieza: d.limpieza.map((x) => (x.id === id ? { ...x, ...campos } : x)) }), () => db.actualizarLimpieza(id, campos)),
    borrarLimpieza: (id) =>
      aplicar((d) => ({ ...d, limpieza: d.limpieza.filter((x) => x.id !== id) }), () => db.borrarLimpieza(id)),

    // ---- Tareas ----
    crearTarea: (t) =>
      aplicar((d) => ({ ...d, tareas: [...d.tareas, t] }), () => db.crearTarea(t)),
    actualizarTarea: (id, campos) =>
      aplicar((d) => ({ ...d, tareas: d.tareas.map((x) => (x.id === id ? { ...x, ...campos } : x)) }), () => db.actualizarTarea(id, campos)),
    borrarTarea: (id) =>
      aplicar((d) => ({ ...d, tareas: d.tareas.filter((x) => x.id !== id) }), () => db.borrarTarea(id)),

    // ---- Documentos (la subida espera al Storage; no es optimista) ----
    crearDocumento: async (params) => {
      try {
        const doc = await db.subirDocumento(params);
        setDatos((d) => ({ ...d, documentos: [doc, ...d.documentos] }));
        return true;
      } catch (e) {
        console.error(e);
        avisar("No se pudo subir el documento: " + (e?.message || ""));
        return false;
      }
    },
    actualizarDocumento: (id, campos) =>
      aplicar((d) => ({ ...d, documentos: d.documentos.map((x) => (x.id === id ? { ...x, ...campos } : x)) }), () => db.actualizarDocumento(id, campos)),
    borrarDocumento: async (doc) => {
      try {
        await db.borrarDocumento(doc);
        setDatos((d) => ({ ...d, documentos: d.documentos.filter((x) => x.id !== doc.id) }));
        return true;
      } catch (e) {
        console.error(e);
        avisar("No se pudo borrar el documento.");
        await recargar();
        return false;
      }
    },

    // ---- Restaurar copia / demo / borrar todo ----
    reemplazarTodo: async (nuevo) => {
      try {
        const normalizado = await db.reemplazarTodo(nuevo);
        setDatos(normalizado);
        return true;
      } catch (e) {
        console.error(e);
        avisar("No se pudo escribir en la base de datos: " + (e?.message || ""));
        await recargar();
        return false;
      }
    },
  }), [aplicar, avisar, recargar]);

  // ---- Pantalla de error de conexión / configuración ----
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena p-6">
        <div className="max-w-lg rounded-xl border border-linea bg-white p-6">
          <h2 className="mb-2 font-display text-xl text-verde-oscuro">No hay conexión con la base de datos</h2>
          <p className="mb-3 text-[13px] leading-relaxed text-[#55645C]">{error}</p>
          <ol className="mb-4 list-decimal pl-5 text-[13px] leading-relaxed text-[#55645C]">
            <li>Crea el proyecto en supabase.com y ejecuta <b>supabase/schema.sql</b> en el SQL Editor.</li>
            <li>Copia <b>.env.example</b> como <b>.env.local</b> y pon la URL y la clave anon de Settings → API.</li>
            <li>Reinicia la aplicación (npm run dev).</li>
          </ol>
          <button className="btn-primario" onClick={recargar}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <Ctx.Provider value={{ datos, api, avisar }}>
      {aviso && (
        <div className="no-print fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-verde-oscuro px-5 py-2.5 text-sm text-laton-palido shadow-xl">
          {aviso}
        </div>
      )}
      {children}
    </Ctx.Provider>
  );
}

/** Hook para acceder a los datos y a la API desde cualquier página */
export function useDatos() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDatos debe usarse dentro de <DatosProvider>");
  return ctx;
}
