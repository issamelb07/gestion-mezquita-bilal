"use client";

// ============================================================
// supabase.js — cliente de Supabase + todas las funciones CRUD
//
// La base de datos usa snake_case (socio_id, cuota_mes…) y la
// aplicación camelCase (socioId, cuotaMes…), así que este archivo
// también hace de "traductor" entre ambos mundos.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { DEFAULT_DATA, uid } from "@/lib/util";

// ---------- Cliente (creación perezosa) ----------
// Se crea al primer uso, en el navegador. Así el proyecto compila
// aunque todavía no existan las variables de entorno.
let cliente = null;

export function getSupabase() {
  if (cliente) return cliente;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
      "Crea el archivo .env.local copiando .env.example y pon ahí las claves de tu proyecto de Supabase."
    );
  }
  cliente = createClient(url, key);
  return cliente;
}

// Lanza un error legible si Supabase devuelve uno
const comprobar = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};

// ¿Es un UUID válido? (las copias antiguas usaban ids tipo "demo-s1")
const esUUID = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

const oNull = (v) => (v === "" || v === undefined ? null : v);

// ============================================================
// Traductores fila de base de datos <-> objeto de la aplicación
// ============================================================

const deConfig = (r) => ({
  nombre: r.nombre,
  anio: Number(r.anio),
  cuotaMes: Number(r.cuota_mes),
  saldoIniCaja: Number(r.saldo_ini_caja),
  saldoIniBanco: Number(r.saldo_ini_banco),
  catIngreso: r.cat_ingreso || [],
  catGasto: r.cat_gasto || [],
  zonas: r.zonas || [],
});
const aConfig = (c) => ({
  nombre: c.nombre,
  anio: Number(c.anio),
  cuota_mes: Number(c.cuotaMes) || 0,
  saldo_ini_caja: Number(c.saldoIniCaja) || 0,
  saldo_ini_banco: Number(c.saldoIniBanco) || 0,
  cat_ingreso: c.catIngreso,
  cat_gasto: c.catGasto,
  zonas: c.zonas,
});

const deMovimiento = (r) => ({
  id: r.id,
  fecha: r.fecha,
  tipo: r.tipo,
  categoria: r.categoria || "",
  concepto: r.concepto || "",
  socioId: r.socio_id || "",
  importe: Number(r.importe),
  pago: r.pago || "",
  origen: r.origen || undefined,
  destino: r.destino || undefined,
  responsable: r.responsable || "",
  notas: r.notas || "",
});
const aMovimiento = (m) => ({
  id: m.id,
  fecha: m.fecha,
  tipo: m.tipo,
  categoria: oNull(m.categoria),
  concepto: oNull(m.concepto),
  socio_id: oNull(m.socioId),
  importe: Number(m.importe),
  pago: m.tipo === "Traspaso" ? null : oNull(m.pago),
  origen: m.tipo === "Traspaso" ? oNull(m.origen) : null,
  destino: m.tipo === "Traspaso" ? oNull(m.destino) : null,
  responsable: oNull(m.responsable),
  notas: oNull(m.notas),
});

const deSocio = (r) => ({
  id: r.id, codigo: r.codigo, nombre: r.nombre,
  dni: r.dni || "", telefono: r.telefono || "", email: r.email || "",
  direccion: r.direccion || "", ciudad: r.ciudad || "", codigoPostal: r.codigo_postal || "",
  fechaNacimiento: r.fecha_nacimiento || "", alta: r.alta || "", fechaBaja: r.fecha_baja || "",
  cargo: r.cargo || "Socio",
  cuota: Number(r.cuota), estado: r.estado, notas: r.notas || "",
});
const aSocio = (s) => ({
  id: s.id, codigo: s.codigo, nombre: s.nombre,
  dni: oNull(s.dni), telefono: oNull(s.telefono), email: oNull(s.email),
  direccion: oNull(s.direccion), ciudad: oNull(s.ciudad), codigo_postal: oNull(s.codigoPostal),
  fecha_nacimiento: oNull(s.fechaNacimiento), alta: oNull(s.alta), fecha_baja: oNull(s.fechaBaja),
  cargo: s.cargo || "Socio",
  cuota: Number(s.cuota) || 0, estado: s.estado, notas: oNull(s.notas),
});

const deInventario = (r) => ({
  id: r.id, articulo: r.articulo, categoria: r.categoria || "",
  cantidad: Number(r.cantidad), minimo: Number(r.minimo),
  ubicacion: r.ubicacion || "", revision: r.revision || "",
});
const aInventario = (i) => ({
  id: i.id, articulo: i.articulo, categoria: oNull(i.categoria),
  cantidad: Number(i.cantidad) || 0, minimo: Number(i.minimo) || 0,
  ubicacion: oNull(i.ubicacion), revision: oNull(i.revision),
});

const deLimpieza = (r) => ({
  id: r.id, semana: r.semana, zona: r.zona,
  responsable: r.responsable, estado: r.estado, obs: r.obs || "",
});
const aLimpieza = (l) => ({
  id: l.id, semana: l.semana, zona: l.zona,
  responsable: l.responsable, estado: l.estado, obs: oNull(l.obs),
});

const deTarea = (r) => ({
  id: r.id, tarea: r.tarea, responsable: r.responsable || "",
  prioridad: r.prioridad, fechaLimite: r.fecha_limite || "",
  estado: r.estado, notas: r.notas || "",
});
const aTarea = (t) => ({
  id: t.id, tarea: t.tarea, responsable: oNull(t.responsable),
  prioridad: t.prioridad, fecha_limite: oNull(t.fechaLimite),
  estado: t.estado, notas: oNull(t.notas),
});

// ============================================================
// LECTURA — cargar todos los datos de golpe al abrir la app
// ============================================================

export async function cargarTodo() {
  const sb = getSupabase();

  // Aseguramos que existe la fila de configuración (si el SQL no la creó)
  let cfg = comprobar(await sb.from("config").select("*").limit(1))[0];
  if (!cfg) {
    cfg = comprobar(
      await sb.from("config").insert(aConfig(DEFAULT_DATA.config)).select().single()
    );
  }

  // Cargamos las cinco tablas en paralelo (más rápido)
  const [mov, soc, inv, lim, tar, doc] = await Promise.all([
    sb.from("movimientos").select("*").order("fecha", { ascending: true }),
    sb.from("socios").select("*").order("codigo", { ascending: true }),
    sb.from("inventario").select("*").order("created_at", { ascending: true }),
    sb.from("limpieza").select("*").order("semana", { ascending: false }),
    sb.from("tareas").select("*").order("created_at", { ascending: true }),
    sb.from("documentos").select("*").order("fecha_documento", { ascending: false, nullsFirst: false }),
  ]);

  return {
    config: deConfig(cfg),
    movimientos: comprobar(mov).map(deMovimiento),
    socios: comprobar(soc).map(deSocio),
    inventario: comprobar(inv).map(deInventario),
    limpieza: comprobar(lim).map(deLimpieza),
    tareas: comprobar(tar).map(deTarea),
    documentos: comprobar(doc).map(deDocumento),
  };
}

// ============================================================
// CONFIG (actualización de la fila única)
// ============================================================

export async function guardarConfig(config) {
  const sb = getSupabase();
  comprobar(await sb.from("config").update(aConfig(config)).eq("singleton", true).select());
}

// ============================================================
// MOVIMIENTOS — crear (uno o varios) y borrar
// ============================================================

export async function crearMovimiento(m) {
  comprobar(await getSupabase().from("movimientos").insert(aMovimiento(m)).select());
}

export async function crearMovimientos(lista) {
  if (!lista.length) return;
  comprobar(await getSupabase().from("movimientos").insert(lista.map(aMovimiento)).select());
}

export async function borrarMovimiento(id) {
  comprobar(await getSupabase().from("movimientos").delete().eq("id", id).select());
}

// ============================================================
// SOCIOS — crear, actualizar y borrar
// ============================================================

export async function crearSocio(s) {
  comprobar(await getSupabase().from("socios").insert(aSocio(s)).select());
}

export async function actualizarSocio(id, campos) {
  // Lista blanca campo de la app -> columna de la base de datos
  const MAPA = {
    nombre: "nombre", dni: "dni", telefono: "telefono", email: "email",
    direccion: "direccion", ciudad: "ciudad", codigoPostal: "codigo_postal",
    fechaNacimiento: "fecha_nacimiento", alta: "alta", fechaBaja: "fecha_baja",
    cargo: "cargo", estado: "estado", notas: "notas",
  };
  const cambios = {};
  for (const [campo, columna] of Object.entries(MAPA)) {
    if (campo in campos) {
      cambios[columna] = campo === "nombre" || campo === "estado" || campo === "cargo"
        ? campos[campo]
        : oNull(campos[campo]);
    }
  }
  if ("cuota" in campos) cambios.cuota = Number(campos.cuota) || 0;
  comprobar(await getSupabase().from("socios").update(cambios).eq("id", id).select());
}

export async function borrarSocio(id) {
  // Las cuotas antiguas del socio quedan con socio_id = null (ON DELETE SET NULL)
  comprobar(await getSupabase().from("socios").delete().eq("id", id).select());
}

// ============================================================
// INVENTARIO — crear, actualizar y borrar
// ============================================================

export async function crearInventario(i) {
  comprobar(await getSupabase().from("inventario").insert(aInventario(i)).select());
}

export async function actualizarInventario(id, campos) {
  const cambios = {};
  if ("cantidad" in campos) cambios.cantidad = Number(campos.cantidad) || 0;
  if ("minimo" in campos) cambios.minimo = Number(campos.minimo) || 0;
  if ("revision" in campos) cambios.revision = oNull(campos.revision);
  if ("articulo" in campos) cambios.articulo = campos.articulo;
  if ("categoria" in campos) cambios.categoria = oNull(campos.categoria);
  if ("ubicacion" in campos) cambios.ubicacion = oNull(campos.ubicacion);
  comprobar(await getSupabase().from("inventario").update(cambios).eq("id", id).select());
}

export async function borrarInventario(id) {
  comprobar(await getSupabase().from("inventario").delete().eq("id", id).select());
}

// ============================================================
// LIMPIEZA — crear, actualizar y borrar
// ============================================================

export async function crearLimpieza(l) {
  comprobar(await getSupabase().from("limpieza").insert(aLimpieza(l)).select());
}

export async function actualizarLimpieza(id, campos) {
  const cambios = {};
  if ("estado" in campos) cambios.estado = campos.estado;
  if ("responsable" in campos) cambios.responsable = campos.responsable;
  if ("zona" in campos) cambios.zona = campos.zona;
  if ("obs" in campos) cambios.obs = oNull(campos.obs);
  comprobar(await getSupabase().from("limpieza").update(cambios).eq("id", id).select());
}

export async function borrarLimpieza(id) {
  comprobar(await getSupabase().from("limpieza").delete().eq("id", id).select());
}

// ============================================================
// TAREAS — crear, actualizar y borrar
// ============================================================

export async function crearTarea(t) {
  comprobar(await getSupabase().from("tareas").insert(aTarea(t)).select());
}

export async function actualizarTarea(id, campos) {
  const cambios = {};
  if ("estado" in campos) cambios.estado = campos.estado;
  if ("prioridad" in campos) cambios.prioridad = campos.prioridad;
  if ("responsable" in campos) cambios.responsable = oNull(campos.responsable);
  if ("fechaLimite" in campos) cambios.fecha_limite = oNull(campos.fechaLimite);
  if ("tarea" in campos) cambios.tarea = campos.tarea;
  comprobar(await getSupabase().from("tareas").update(cambios).eq("id", id).select());
}

export async function borrarTarea(id) {
  comprobar(await getSupabase().from("tareas").delete().eq("id", id).select());
}

// ============================================================
// DOCUMENTOS — archivos en Supabase Storage + su información
// ============================================================

const BUCKET_DOCS = "documentos";

const deDocumento = (r) => ({
  id: r.id, titulo: r.titulo, categoria: r.categoria,
  fecha: r.fecha_documento || "", descripcion: r.descripcion || "",
  ruta: r.archivo_ruta, nombreArchivo: r.archivo_nombre,
  tipo: r.archivo_tipo || "", tamano: Number(r.archivo_tamano) || 0,
  creado: r.created_at,
});

/** URL pública para ver o descargar un documento */
export function urlDocumento(ruta) {
  return getSupabase().storage.from(BUCKET_DOCS).getPublicUrl(ruta).data.publicUrl;
}

/** Sube el archivo al Storage y crea su ficha. Si la ficha falla,
    borra el archivo subido para no dejar restos (reversión). */
export async function subirDocumento({ archivo, titulo, categoria, fecha, descripcion }) {
  const sb = getSupabase();
  const id = uid();
  // Nombre de archivo seguro (sin acentos, espacios ni caracteres raros)
  const limpio = archivo.name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const ruta = `${id}/${limpio}`;

  const { error: errorSubida } = await sb.storage.from(BUCKET_DOCS).upload(ruta, archivo, { upsert: false });
  if (errorSubida) throw new Error(errorSubida.message);

  const fila = {
    id, titulo, categoria,
    fecha_documento: oNull(fecha), descripcion: oNull(descripcion),
    archivo_ruta: ruta, archivo_nombre: archivo.name,
    archivo_tipo: archivo.type || null, archivo_tamano: archivo.size || 0,
  };
  const { data, error } = await sb.from("documentos").insert(fila).select().single();
  if (error) {
    await sb.storage.from(BUCKET_DOCS).remove([ruta]); // reversión
    throw new Error(error.message);
  }
  return deDocumento(data);
}

export async function actualizarDocumento(id, campos) {
  const cambios = {};
  if ("titulo" in campos) cambios.titulo = campos.titulo;
  if ("categoria" in campos) cambios.categoria = campos.categoria;
  if ("fecha" in campos) cambios.fecha_documento = oNull(campos.fecha);
  if ("descripcion" in campos) cambios.descripcion = oNull(campos.descripcion);
  comprobar(await getSupabase().from("documentos").update(cambios).eq("id", id).select());
}

/** Borra la ficha y después el archivo del Storage */
export async function borrarDocumento(doc) {
  const sb = getSupabase();
  comprobar(await sb.from("documentos").delete().eq("id", doc.id).select());
  const { error } = await sb.storage.from(BUCKET_DOCS).remove([doc.ruta]);
  if (error) console.warn("La ficha se borró pero el archivo no:", error.message);
}

// ============================================================
// REEMPLAZAR TODO — para restaurar copias, cargar la demo
// o el botón "Borrar todos los datos" de Ajustes.
// Vacía las tablas y vuelve a insertar el contenido completo.
// ============================================================

export async function reemplazarTodo(datos) {
  const sb = getSupabase();

  // 1) Normalizar ids: las copias antiguas (versión localStorage) usaban
  //    ids que no eran UUID. Aquí se les asigna uno nuevo manteniendo
  //    la relación cuota -> socio.
  const mapaSocios = {};
  const socios = (datos.socios || []).map((s) => {
    const nuevoId = esUUID(s.id) ? s.id : uid();
    mapaSocios[s.id] = nuevoId;
    return { ...s, id: nuevoId };
  });
  const conIdNuevo = (x) => ({ ...x, id: esUUID(x.id) ? x.id : uid() });
  const movimientos = (datos.movimientos || []).map((m) =>
    conIdNuevo({ ...m, socioId: m.socioId ? (mapaSocios[m.socioId] || (esUUID(m.socioId) ? m.socioId : "")) : "" })
  );
  const inventario = (datos.inventario || []).map(conIdNuevo);
  const limpieza = (datos.limpieza || []).map(conIdNuevo);
  const tareas = (datos.tareas || []).map(conIdNuevo);

  // 2) Vaciar (primero movimientos, que dependen de socios)
  comprobar(await sb.from("movimientos").delete().not("id", "is", null).select("id"));
  comprobar(await sb.from("limpieza").delete().not("id", "is", null).select("id"));
  comprobar(await sb.from("tareas").delete().not("id", "is", null).select("id"));
  comprobar(await sb.from("inventario").delete().not("id", "is", null).select("id"));
  comprobar(await sb.from("socios").delete().not("id", "is", null).select("id"));

  // 3) Insertar el contenido nuevo
  if (socios.length) comprobar(await sb.from("socios").insert(socios.map(aSocio)).select("id"));
  if (movimientos.length) comprobar(await sb.from("movimientos").insert(movimientos.map(aMovimiento)).select("id"));
  if (inventario.length) comprobar(await sb.from("inventario").insert(inventario.map(aInventario)).select("id"));
  if (limpieza.length) comprobar(await sb.from("limpieza").insert(limpieza.map(aLimpieza)).select("id"));
  if (tareas.length) comprobar(await sb.from("tareas").insert(tareas.map(aTarea)).select("id"));

  // 4) Guardar la configuración
  const config = { ...DEFAULT_DATA.config, ...(datos.config || {}) };
  await guardarConfig(config);

  // Los documentos NO se tocan: son archivos reales en el Storage y no
  // forman parte de las copias JSON. Se conservan tal cual estaban.
  const docs = comprobar(
    await sb.from("documentos").select("*").order("fecha_documento", { ascending: false, nullsFirst: false })
  ).map(deDocumento);

  // Devolvemos los datos ya normalizados para que la app los muestre tal cual
  return { config, movimientos, socios, inventario, limpieza, tareas, documentos: docs };
}
