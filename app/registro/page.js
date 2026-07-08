"use client";

// ============================================================
// Registro — el corazón del sistema: aquí se apunta todo el dinero
// ============================================================

import { useState } from "react";
import { useDatos } from "@/lib/datos";
import { eur, fFecha, hoyISO, uid, MESES, mesDe, anioDe } from "@/lib/util";
import Cabecera from "@/components/Cabecera";
import Tarjeta from "@/components/Tarjeta";
import Campo from "@/components/Campo";

const FORM_VACIO = {
  fecha: "", tipo: "Ingreso", categoria: "", concepto: "",
  socioId: "", importe: "", pago: "Caja", responsable: "", notas: "",
};

export default function Registro() {
  const { datos } = useDatos();
  if (!datos) return <p className="vacio">Cargando…</p>;
  return <Contenido />;
}

function Contenido() {
  const { datos, api, avisar } = useDatos();
  const { config, movimientos, socios } = datos;
  const [f, setF] = useState({ ...FORM_VACIO, fecha: hoyISO() });
  const [err, setErr] = useState({});
  const [filtroMes, setFiltroMes] = useState(0);

  const cats = f.tipo === "Ingreso" ? config.catIngreso : config.catGasto;
  const pon = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const guardar = () => {
    // Validación de campos obligatorios, con el error junto al campo
    const e = {};
    if (!f.fecha) e.fecha = "Falta la fecha";
    if (!f.categoria) e.categoria = "Elige una categoría";
    if (!f.importe || Number(f.importe) <= 0) e.importe = "Pon un importe mayor que cero";
    if (f.categoria === "Cuota de socio" && !f.socioId) e.socioId = "Una cuota necesita su socio";
    setErr(e);
    if (Object.keys(e).length) return;

    // Detección de duplicados: misma fecha + categoría + socio + importe
    const dup = movimientos.find(
      (m) => m.fecha === f.fecha && m.categoria === f.categoria &&
             (m.socioId || "") === (f.socioId || "") && Number(m.importe) === Number(f.importe)
    );
    if (dup && !window.confirm("Ya existe un movimiento idéntico (misma fecha, categoría, socio e importe).\n\n¿Guardarlo de todas formas?")) return;

    const nuevo = { ...f, id: uid(), importe: Number(f.importe) };
    api.crearMovimiento(nuevo);
    // Se conservan fecha, tipo, pago y responsable para encadenar apuntes rápido
    setF({ ...FORM_VACIO, fecha: f.fecha, tipo: f.tipo, pago: f.pago, responsable: f.responsable });
    avisar("Movimiento guardado.");
  };

  const borrar = (id) => {
    if (!window.confirm("¿Borrar este movimiento? No se puede deshacer.")) return;
    api.borrarMovimiento(id);
  };

  const lista = [...movimientos]
    .filter((m) => anioDe(m.fecha) === Number(config.anio))
    .filter((m) => !filtroMes || mesDe(m.fecha) === Number(filtroMes))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const nombreSocio = (id) => socios.find((s) => s.id === id)?.nombre || "";

  return (
    <>
      <Cabecera miga="Registro de movimientos" titulo="Todo el dinero pasa por aquí" />

      <Tarjeta titulo="Nuevo movimiento">
        <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Campo etiqueta="Fecha *" error={err.fecha}>
            <input type="date" value={f.fecha} onChange={pon("fecha")} />
          </Campo>
          <Campo etiqueta="Tipo *">
            <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value, categoria: "" })}>
              <option>Ingreso</option><option>Gasto</option>
            </select>
          </Campo>
          <Campo etiqueta="Categoría *" error={err.categoria}>
            <select value={f.categoria} onChange={pon("categoria")}>
              <option value="">— elegir —</option>
              {cats.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Importe (€) *" error={err.importe}>
            <input type="number" min="0" step="0.01" value={f.importe} onChange={pon("importe")} placeholder="0,00" />
          </Campo>
          {f.categoria === "Cuota de socio" && (
            <Campo etiqueta="Socio *" error={err.socioId}>
              <select value={f.socioId} onChange={pon("socioId")}>
                <option value="">— elegir socio —</option>
                {socios.filter((s) => s.estado === "Activo").map((s) => (
                  <option key={s.id} value={s.id}>{s.codigo} · {s.nombre}</option>
                ))}
              </select>
            </Campo>
          )}
          <Campo etiqueta="Forma de pago *">
            <select value={f.pago} onChange={pon("pago")}>
              <option>Caja</option><option>Banco</option>
            </select>
          </Campo>
          <Campo etiqueta="Concepto">
            <input value={f.concepto} onChange={pon("concepto")} placeholder="Ej.: colecta del viernes" />
          </Campo>
          <Campo etiqueta="Responsable">
            <input value={f.responsable} onChange={pon("responsable")} placeholder="Ej.: Tesorero" />
          </Campo>
          <Campo etiqueta="Notas">
            <input value={f.notas} onChange={pon("notas")} />
          </Campo>
        </div>
        <button className="btn-primario" onClick={guardar}>Guardar movimiento</button>
        <p className="nota mb-0 mt-2.5">¿Necesitas mover dinero de la caja al banco? Eso se hace desde Tesorería → Traspaso.</p>
      </Tarjeta>

      <Tarjeta>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <h3 className="titulo-tarjeta mb-0">Movimientos de {config.anio}</h3>
          <select className="!w-auto" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
            <option value={0}>Todos los meses</option>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        {lista.length === 0 ? (
          <p className="vacio">Aún no hay movimientos. Guarda el primero con el formulario de arriba.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Concepto</th><th>Socio</th><th className="text-right">Importe</th><th>Pago</th><th></th></tr>
              </thead>
              <tbody>
                {lista.map((m) => (
                  <tr key={m.id}>
                    <td>{fFecha(m.fecha)}</td>
                    <td>
                      <span className={"chip " + (m.tipo === "Ingreso" ? "chip-verde" : m.tipo === "Gasto" ? "chip-rojo" : "chip-brass")}>
                        {m.tipo}
                      </span>
                    </td>
                    <td>{m.tipo === "Traspaso" ? `${m.origen} → ${m.destino}` : m.categoria}</td>
                    <td>{m.concepto || "—"}</td>
                    <td>{nombreSocio(m.socioId) || "—"}</td>
                    <td className="text-right font-semibold tabular-nums">{eur(m.importe)}</td>
                    <td>{m.tipo === "Traspaso" ? "—" : m.pago}</td>
                    <td><button className="btn-borrar" onClick={() => borrar(m.id)} title="Borrar">✕</button></td>
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
