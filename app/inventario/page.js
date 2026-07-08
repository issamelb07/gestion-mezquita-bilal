"use client";

// ============================================================
// Inventario — material de la mezquita con aviso de reposición
// ============================================================

import { useState } from "react";
import { useDatos } from "@/lib/datos";
import { fFecha, hoyISO, uid } from "@/lib/util";
import Cabecera from "@/components/Cabecera";
import Tarjeta from "@/components/Tarjeta";
import Campo from "@/components/Campo";

export default function Inventario() {
  const { datos } = useDatos();
  if (!datos) return <p className="vacio">Cargando…</p>;
  return <Contenido />;
}

function Contenido() {
  const { datos, api, avisar } = useDatos();
  const { inventario } = datos;
  const [f, setF] = useState({ articulo: "", categoria: "", cantidad: "", minimo: "", ubicacion: "" });

  const anadir = () => {
    if (!f.articulo.trim()) { avisar("Falta el nombre del artículo."); return; }
    const nuevo = { ...f, id: uid(), cantidad: Number(f.cantidad) || 0, minimo: Number(f.minimo) || 0, revision: hoyISO() };
    api.crearInventario(nuevo);
    setF({ articulo: "", categoria: "", cantidad: "", minimo: "", ubicacion: "" });
  };

  // Editar la cantidad directamente en la tabla actualiza la fecha de revisión
  const cambiarCantidad = (id, cantidad) =>
    api.actualizarInventario(id, { cantidad: Number(cantidad), revision: hoyISO() });

  const borrar = (id) => {
    if (!window.confirm("¿Borrar este artículo del inventario?")) return;
    api.borrarInventario(id);
  };

  return (
    <>
      <Cabecera miga={`Inventario · ${inventario.length} artículos`} titulo="El material de la mezquita" />

      <Tarjeta titulo="Añadir artículo">
        <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Campo etiqueta="Artículo *"><input value={f.articulo} onChange={(e) => setF({ ...f, articulo: e.target.value })} /></Campo>
          <Campo etiqueta="Categoría"><input value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} placeholder="Limpieza, biblioteca…" /></Campo>
          <Campo etiqueta="Cantidad"><input type="number" min="0" value={f.cantidad} onChange={(e) => setF({ ...f, cantidad: e.target.value })} /></Campo>
          <Campo etiqueta="Stock mínimo"><input type="number" min="0" value={f.minimo} onChange={(e) => setF({ ...f, minimo: e.target.value })} /></Campo>
          <Campo etiqueta="Ubicación"><input value={f.ubicacion} onChange={(e) => setF({ ...f, ubicacion: e.target.value })} /></Campo>
        </div>
        <button className="btn-primario" onClick={anadir}>Añadir al inventario</button>
      </Tarjeta>

      <Tarjeta titulo="Existencias">
        {inventario.length === 0 ? (
          <p className="vacio">Inventario vacío. Cuando la cantidad de un artículo baje de su mínimo, se marcará en rojo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr><th>Artículo</th><th>Categoría</th><th className="text-right">Cantidad</th><th className="text-right">Mínimo</th><th>Ubicación</th><th>Estado</th><th>Revisado</th><th></th></tr>
              </thead>
              <tbody>
                {inventario.map((i) => {
                  const bajo = Number(i.cantidad) <= Number(i.minimo);
                  return (
                    <tr key={i.id}>
                      <td>{i.articulo}</td>
                      <td>{i.categoria || "—"}</td>
                      <td className="text-right">
                        <input
                          className="!w-[70px] !px-1.5 !py-1 text-right"
                          type="number" min="0" value={i.cantidad}
                          onChange={(e) => cambiarCantidad(i.id, e.target.value)}
                        />
                      </td>
                      <td className="text-right tabular-nums">{i.minimo}</td>
                      <td>{i.ubicacion || "—"}</td>
                      <td><span className={"chip " + (bajo ? "chip-rojo" : "chip-verde")}>{bajo ? "Reponer" : "OK"}</span></td>
                      <td>{fFecha(i.revision)}</td>
                      <td><button className="btn-borrar" onClick={() => borrar(i.id)}>✕</button></td>
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
