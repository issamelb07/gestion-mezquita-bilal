"use client";

// ============================================================
// Tareas — lo que la junta tiene entre manos, con vencimientos
// ============================================================

import { useState } from "react";
import { useDatos } from "@/lib/datos";
import { fFecha, hoyISO, uid } from "@/lib/util";
import Cabecera from "@/components/Cabecera";
import Tarjeta from "@/components/Tarjeta";
import Campo from "@/components/Campo";

export default function Tareas() {
  const { datos } = useDatos();
  if (!datos) return <p className="vacio">Cargando…</p>;
  return <Contenido />;
}

function Contenido() {
  const { datos, api, avisar } = useDatos();
  const { tareas } = datos;
  const [f, setF] = useState({ tarea: "", responsable: "", prioridad: "Media", fechaLimite: "" });
  const hoy = hoyISO();

  const anadir = () => {
    if (!f.tarea.trim()) { avisar("Escribe la tarea."); return; }
    api.crearTarea({ ...f, id: uid(), estado: "Pendiente", notas: "" });
    setF({ tarea: "", responsable: "", prioridad: "Media", fechaLimite: "" });
  };

  const cambiar = (id, campo, valor) => api.actualizarTarea(id, { [campo]: valor });

  const borrar = (id) => api.borrarTarea(id);

  // Orden: primero las abiertas por prioridad, las hechas al final
  const orden = { Alta: 0, Media: 1, Baja: 2 };
  const lista = [...tareas].sort(
    (a, b) => (a.estado === "Hecha") - (b.estado === "Hecha") || orden[a.prioridad] - orden[b.prioridad]
  );

  return (
    <>
      <Cabecera
        miga={`Tareas · ${tareas.filter((t) => t.estado !== "Hecha").length} abiertas`}
        titulo="Lo que la junta tiene entre manos"
      />

      <Tarjeta titulo="Nueva tarea">
        <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Tarea *"><input value={f.tarea} onChange={(e) => setF({ ...f, tarea: e.target.value })} /></Campo>
          <Campo etiqueta="Responsable"><input value={f.responsable} onChange={(e) => setF({ ...f, responsable: e.target.value })} /></Campo>
          <Campo etiqueta="Prioridad">
            <select value={f.prioridad} onChange={(e) => setF({ ...f, prioridad: e.target.value })}>
              <option>Alta</option><option>Media</option><option>Baja</option>
            </select>
          </Campo>
          <Campo etiqueta="Fecha límite">
            <input type="date" value={f.fechaLimite} onChange={(e) => setF({ ...f, fechaLimite: e.target.value })} />
          </Campo>
        </div>
        <button className="btn-primario" onClick={anadir}>Añadir tarea</button>
      </Tarjeta>

      <Tarjeta titulo="Lista">
        {lista.length === 0 ? (
          <p className="vacio">Sin tareas pendientes. Las tareas con fecha pasada se marcarán como vencidas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead><tr><th>Tarea</th><th>Responsable</th><th>Prioridad</th><th>Límite</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {lista.map((t) => {
                  const vencida = t.estado !== "Hecha" && t.fechaLimite && t.fechaLimite < hoy;
                  return (
                    <tr key={t.id} className={t.estado === "Hecha" ? "opacity-50" : ""}>
                      <td>
                        {t.tarea}
                        {vencida && <span className="chip chip-rojo ml-2">Vencida</span>}
                      </td>
                      <td>{t.responsable || "—"}</td>
                      <td>
                        <span className={"chip " + (t.prioridad === "Alta" ? "chip-rojo" : t.prioridad === "Media" ? "chip-naranja" : "chip-gris")}>
                          {t.prioridad}
                        </span>
                      </td>
                      <td>{t.fechaLimite ? fFecha(t.fechaLimite) : "—"}</td>
                      <td>
                        <select className="!w-auto" value={t.estado} onChange={(e) => cambiar(t.id, "estado", e.target.value)}>
                          <option>Pendiente</option><option>En curso</option><option>Hecha</option>
                        </select>
                      </td>
                      <td><button className="btn-borrar" onClick={() => borrar(t.id)}>✕</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </>
  );
}
