"use client";

// ============================================================
// Limpieza — turnos por semana y zona, con estado de un clic
// ============================================================

import { useState } from "react";
import { useDatos } from "@/lib/datos";
import { fFecha, hoyISO, uid } from "@/lib/util";
import Cabecera from "@/components/Cabecera";
import Tarjeta from "@/components/Tarjeta";
import Campo from "@/components/Campo";

export default function Limpieza() {
  const { datos } = useDatos();
  if (!datos) return <p className="vacio">Cargando…</p>;
  return <Contenido />;
}

function Contenido() {
  const { datos, api, avisar } = useDatos();
  const { limpieza, config } = datos;
  const [f, setF] = useState({ semana: hoyISO(), zona: config.zonas[0] || "", responsable: "", obs: "" });

  const anadir = () => {
    if (!f.responsable.trim()) { avisar("Falta el responsable del turno."); return; }
    api.crearLimpieza({ ...f, id: uid(), estado: "Pendiente" });
    setF({ ...f, responsable: "", obs: "" });
  };

  const alternarEstado = (id) => {
    const turno = limpieza.find((l) => l.id === id);
    if (!turno) return;
    api.actualizarLimpieza(id, { estado: turno.estado === "Hecho" ? "Pendiente" : "Hecho" });
  };

  const borrar = (id) => api.borrarLimpieza(id);

  const lista = [...limpieza].sort((a, b) => b.semana.localeCompare(a.semana));

  return (
    <>
      <Cabecera
        miga={`Limpieza · ${limpieza.filter((l) => l.estado === "Pendiente").length} turnos pendientes`}
        titulo="Los turnos de limpieza"
      />

      <Tarjeta titulo="Nuevo turno">
        <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Semana (lunes)">
            <input type="date" value={f.semana} onChange={(e) => setF({ ...f, semana: e.target.value })} />
          </Campo>
          <Campo etiqueta="Zona">
            <select value={f.zona} onChange={(e) => setF({ ...f, zona: e.target.value })}>
              {config.zonas.map((z) => <option key={z}>{z}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Responsable *">
            <input value={f.responsable} onChange={(e) => setF({ ...f, responsable: e.target.value })} />
          </Campo>
          <Campo etiqueta="Observaciones">
            <input value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} />
          </Campo>
        </div>
        <button className="btn-primario" onClick={anadir}>Añadir turno</button>
      </Tarjeta>

      <Tarjeta titulo="Calendario de turnos">
        {lista.length === 0 ? (
          <p className="vacio">Sin turnos todavía. Las zonas se pueden ajustar en Ajustes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead><tr><th>Semana</th><th>Zona</th><th>Responsable</th><th>Estado</th><th>Observaciones</th><th></th></tr></thead>
              <tbody>
                {lista.map((l) => (
                  <tr key={l.id}>
                    <td>{fFecha(l.semana)}</td>
                    <td>{l.zona}</td>
                    <td>{l.responsable}</td>
                    <td>
                      <button
                        className={"chip " + (l.estado === "Hecho" ? "chip-verde" : "chip-naranja")}
                        onClick={() => alternarEstado(l.id)}
                        title="Pulsar para cambiar el estado"
                      >
                        {l.estado}
                      </button>
                    </td>
                    <td>{l.obs || "—"}</td>
                    <td><button className="btn-borrar" onClick={() => borrar(l.id)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </>
  );
}
