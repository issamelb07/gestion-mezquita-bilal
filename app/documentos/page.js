"use client";

// ============================================================
// Documentos — el archivo de la asociación
//
// · Subida de archivos (PDF, imágenes, Word, Excel…) hasta 10 MB
// · Cada documento con título, categoría, fecha y descripción
// · Buscador, filtro por categoría con contadores, ver/descargar
// · Los archivos viven en Supabase Storage (bucket "documentos")
// ============================================================

import { useMemo, useRef, useState } from "react";
import { useDatos } from "@/lib/datos";
import { urlDocumento } from "@/lib/supabase";
import { fFecha, hoyISO, fmtTamano, CATEGORIAS_DOC } from "@/lib/util";
import Cabecera from "@/components/Cabecera";
import Tarjeta from "@/components/Tarjeta";
import Kpi from "@/components/Kpi";
import Campo from "@/components/Campo";
import Khatam from "@/components/Khatam";

const MAX_MB = 10;

// Icono según el tipo de archivo
const icono = (tipo, nombre) => {
  const t = (tipo || "").toLowerCase();
  const n = (nombre || "").toLowerCase();
  if (t.includes("pdf") || n.endsWith(".pdf")) return "📄";
  if (t.startsWith("image/")) return "🖼️";
  if (n.match(/\.(doc|docx|odt)$/)) return "📝";
  if (n.match(/\.(xls|xlsx|ods|csv)$/)) return "📊";
  return "📎";
};

export default function Documentos() {
  const { datos } = useDatos();
  if (!datos) return <p className="vacio">Cargando…</p>;
  return <Contenido />;
}

function Contenido() {
  const { datos, api, avisar } = useDatos();
  const documentos = datos.documentos || [];

  const [f, setF] = useState({ titulo: "", categoria: "Otro", fecha: hoyISO(), descripcion: "" });
  const [archivo, setArchivo] = useState(null);
  const [err, setErr] = useState({});
  const [subiendo, setSubiendo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCat, setFiltroCat] = useState("Todas");
  const [editando, setEditando] = useState(null); // documento en edición
  const inputArchivo = useRef(null);

  const pon = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const elegirArchivo = (e) => {
    const a = e.target.files?.[0];
    if (!a) return;
    if (a.size > MAX_MB * 1024 * 1024) {
      avisar(`El archivo pesa ${fmtTamano(a.size)}. El máximo es ${MAX_MB} MB.`);
      e.target.value = "";
      return;
    }
    setArchivo(a);
    // Si el título está vacío, se propone el nombre del archivo (sin extensión)
    if (!f.titulo.trim()) {
      setF({ ...f, titulo: a.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ") });
    }
  };

  const subir = async () => {
    const e = {};
    if (!archivo) e.archivo = "Elige un archivo";
    if (!f.titulo.trim()) e.titulo = "Ponle un título al documento";
    setErr(e);
    if (Object.keys(e).length) return;

    setSubiendo(true);
    const ok = await api.crearDocumento({ archivo, ...f, titulo: f.titulo.trim() });
    setSubiendo(false);
    if (ok) {
      setF({ titulo: "", categoria: f.categoria, fecha: hoyISO(), descripcion: "" });
      setArchivo(null);
      if (inputArchivo.current) inputArchivo.current.value = "";
      avisar("Documento guardado en el archivo.");
    }
  };

  const borrar = async (doc) => {
    if (!window.confirm(`¿Borrar "${doc.titulo}"?\nEl archivo se eliminará definitivamente del almacén.`)) return;
    const ok = await api.borrarDocumento(doc);
    if (ok) avisar("Documento borrado.");
  };

  // ---- Contadores por categoría (solo las que tienen documentos) ----
  const porCategoria = useMemo(() => {
    const m = {};
    documentos.forEach((d) => { m[d.categoria] = (m[d.categoria] || 0) + 1; });
    return m;
  }, [documentos]);

  // ---- Búsqueda y filtro ----
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return documentos
      .filter((d) => filtroCat === "Todas" || d.categoria === filtroCat)
      .filter((d) =>
        !q ||
        [d.titulo, d.descripcion, d.nombreArchivo, d.categoria]
          .some((v) => (v || "").toLowerCase().includes(q))
      );
  }, [documentos, busqueda, filtroCat]);

  const tamanoTotal = documentos.reduce((s, d) => s + d.tamano, 0);
  const anioActual = String(new Date().getFullYear());

  return (
    <>
      <Cabecera miga={`Documentos · ${documentos.length} archivados`} titulo="El archivo de la asociación" />

      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Kpi titulo="Documentos guardados" valor={documentos.length} />
        <Kpi titulo="Espacio ocupado" valor={fmtTamano(tamanoTotal)} tono="brass" />
        <Kpi titulo={`Añadidos en ${anioActual}`} valor={documentos.filter((d) => (d.creado || "").startsWith(anioActual)).length} />
      </div>

      <Tarjeta titulo="Guardar un documento">
        <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Campo etiqueta="Archivo * (PDF, imagen, Word, Excel… máx. 10 MB)" error={err.archivo}>
              <div className="flex items-center gap-2.5">
                <label className="btn-secundario shrink-0">
                  Elegir archivo…
                  <input ref={inputArchivo} type="file" className="hidden" onChange={elegirArchivo} />
                </label>
                <span className="truncate text-[12.5px] text-[#6E7A72]">
                  {archivo ? `${icono(archivo.type, archivo.name)} ${archivo.name} (${fmtTamano(archivo.size)})` : "Ningún archivo elegido"}
                </span>
              </div>
            </Campo>
          </div>
          <Campo etiqueta="Título *" error={err.titulo}>
            <input value={f.titulo} onChange={pon("titulo")} placeholder="Ej.: Acta asamblea junio" />
          </Campo>
          <Campo etiqueta="Categoría">
            <select value={f.categoria} onChange={pon("categoria")}>
              {CATEGORIAS_DOC.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Fecha del documento">
            <input type="date" value={f.fecha} onChange={pon("fecha")} />
          </Campo>
          <div className="sm:col-span-2 lg:col-span-3">
            <Campo etiqueta="Descripción">
              <input value={f.descripcion} onChange={pon("descripcion")} placeholder="Ej.: renovación del seguro del local, vence en junio" />
            </Campo>
          </div>
        </div>
        <button className="btn-primario" onClick={subir} disabled={subiendo}>
          {subiendo ? "Subiendo…" : "Guardar en el archivo"}
        </button>
      </Tarjeta>

      <Tarjeta>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <h3 className="titulo-tarjeta mb-0">Documentos</h3>
          <input
            className="!w-[220px]"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar título, descripción…"
          />
        </div>

        {/* Filtro por categoría con contadores */}
        <div className="mb-3.5 flex flex-wrap gap-1.5">
          {["Todas", ...CATEGORIAS_DOC.filter((c) => porCategoria[c])].map((c) => (
            <button
              key={c}
              onClick={() => setFiltroCat(c)}
              className={
                "rounded-full px-3 py-1 text-[12px] font-semibold transition-colors " +
                (filtroCat === c
                  ? "bg-verde text-laton-palido"
                  : "bg-verde-suave text-verde-oscuro hover:bg-verde/20")
              }
            >
              {c}{c !== "Todas" && ` · ${porCategoria[c]}`}
            </button>
          ))}
        </div>

        {filtrados.length === 0 ? (
          <p className="vacio">
            {documentos.length === 0
              ? "El archivo está vacío. Sube el primer documento con el formulario de arriba."
              : "Ningún documento coincide con la búsqueda."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr><th></th><th>Título</th><th>Categoría</th><th>Fecha</th><th className="text-right">Tamaño</th><th></th></tr>
              </thead>
              <tbody>
                {filtrados.map((d) => (
                  <tr key={d.id}>
                    <td className="w-8 text-[16px]">{icono(d.tipo, d.nombreArchivo)}</td>
                    <td>
                      <div className="font-medium">{d.titulo}</div>
                      {d.descripcion && <div className="text-[11.5px] text-[#8A948C]">{d.descripcion}</div>}
                    </td>
                    <td><span className="chip chip-brass">{d.categoria}</span></td>
                    <td>{fFecha(d.fecha)}</td>
                    <td className="text-right tabular-nums">{fmtTamano(d.tamano)}</td>
                    <td className="whitespace-nowrap text-right">
                      <a
                        className="btn-secundario !px-2.5 !py-1 !text-[12px]"
                        href={urlDocumento(d.ruta)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver
                      </a>
                      <button
                        className="btn-secundario !ml-1.5 !px-2.5 !py-1 !text-[12px]"
                        onClick={() => setEditando(d)}
                      >
                        Editar
                      </button>
                      <button className="btn-borrar" onClick={() => borrar(d)} title="Borrar">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="nota mb-0 mt-3">
          Los archivos se guardan en el almacén seguro de Supabase (bucket &quot;documentos&quot;), no en este dispositivo.
        </p>
      </Tarjeta>

      {editando && (
        <EditarDocumento
          doc={editando}
          api={api}
          avisar={avisar}
          cerrar={() => setEditando(null)}
        />
      )}
    </>
  );
}

// ============================================================
// Ventana para editar la ficha de un documento (no el archivo)
// ============================================================

function EditarDocumento({ doc, api, avisar, cerrar }) {
  const [f, setF] = useState({ titulo: doc.titulo, categoria: doc.categoria, fecha: doc.fecha, descripcion: doc.descripcion });
  const pon = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const guardar = () => {
    if (!f.titulo.trim()) { avisar("El título no puede quedar vacío."); return; }
    api.actualizarDocumento(doc.id, { ...f, titulo: f.titulo.trim() });
    avisar("Documento actualizado.");
    cerrar();
  };

  return (
    <div className="no-print fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-tinta/40 p-4 md:p-8" onClick={cerrar}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 rounded-t-2xl bg-verde-oscuro px-5 py-4 text-[#EDE7D4]">
          <Khatam size={16} color="#E2C88A" />
          <h3 className="min-w-0 flex-1 truncate font-display text-[16px] text-laton-palido">Editar documento</h3>
          <button className="rounded-lg px-2.5 py-1 text-lg hover:bg-white/10" onClick={cerrar} aria-label="Cerrar">✕</button>
        </div>
        <div className="p-5">
          <p className="nota mt-0">Archivo: {doc.nombreArchivo} · {fmtTamano(doc.tamano)}. (Para cambiar el archivo, borra el documento y súbelo de nuevo.)</p>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Campo etiqueta="Título *"><input value={f.titulo} onChange={pon("titulo")} /></Campo>
            </div>
            <Campo etiqueta="Categoría">
              <select value={f.categoria} onChange={pon("categoria")}>
                {CATEGORIAS_DOC.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Campo>
            <Campo etiqueta="Fecha del documento">
              <input type="date" value={f.fecha} onChange={pon("fecha")} />
            </Campo>
            <div className="sm:col-span-2">
              <Campo etiqueta="Descripción"><input value={f.descripcion} onChange={pon("descripcion")} /></Campo>
            </div>
          </div>
          <button className="btn-primario" onClick={guardar}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}
