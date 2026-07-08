"use client";

// ============================================================
// Tesorería — saldos de caja y banco + traspasos entre cuentas
// ============================================================

import { useState } from "react";
import { useDatos } from "@/lib/datos";
import { useCalculos } from "@/lib/calculos";
import { eur, hoyISO, uid, MESES, mesDe } from "@/lib/util";
import Cabecera from "@/components/Cabecera";
import Tarjeta from "@/components/Tarjeta";
import Kpi from "@/components/Kpi";
import Campo from "@/components/Campo";

export default function Tesoreria() {
  const { datos } = useDatos();
  if (!datos) return <p className="vacio">Cargando…</p>;
  return <Contenido />;
}

function Contenido() {
  const { datos, api, avisar } = useDatos();
  const c = useCalculos(datos);
  const { config } = datos;
  const [tf, setTf] = useState({ fecha: hoyISO(), dir: "CB", importe: "", concepto: "" });

  // Registrar un traspaso: no es ingreso ni gasto, solo mueve dinero de cuenta
  const hacerTraspaso = () => {
    const importe = Number(tf.importe);
    if (!tf.fecha) { avisar("Falta la fecha del traspaso."); return; }
    if (!importe || importe <= 0) { avisar("Pon un importe mayor que cero."); return; }
    const origen = tf.dir === "CB" ? "Caja" : "Banco";
    const destino = tf.dir === "CB" ? "Banco" : "Caja";
    const saldoOrigen = origen === "Caja" ? c.saldoCaja : c.saldoBanco;
    if (importe > saldoOrigen &&
        !window.confirm(`En ${origen.toLowerCase()} hay ${eur(saldoOrigen)} y quieres traspasar ${eur(importe)}.\nEl saldo de ${origen.toLowerCase()} quedaría en negativo.\n\n¿Registrar de todas formas?`)) return;

    const mov = {
      id: uid(), fecha: tf.fecha, tipo: "Traspaso", origen, destino,
      categoria: "Traspaso interno",
      concepto: tf.concepto || `Traspaso de ${origen.toLowerCase()} a ${destino.toLowerCase()}`,
      socioId: "", importe, pago: "", responsable: "", notas: "",
    };
    api.crearMovimiento(mov);
    setTf({ ...tf, importe: "", concepto: "" });
    avisar(`Traspaso registrado: ${eur(importe)} de ${origen.toLowerCase()} a ${destino.toLowerCase()}.`);
  };

  // Tabla mes a mes: los traspasos cuentan como salida del origen y entrada en el destino
  let caja = Number(config.saldoIniCaja);
  let banco = Number(config.saldoIniBanco);
  const filas = [{ mes: "Saldo inicial", eC: null, sC: null, caja, eB: null, sB: null, banco, total: caja + banco }];
  for (let m = 1; m <= 12; m++) {
    const del = c.delAnio.filter((x) => mesDe(x.fecha) === m);
    const s = (tipo, pago) => del.filter((x) => x.tipo === tipo && x.pago === pago).reduce((a, x) => a + Number(x.importe), 0);
    const tr = (cuenta) => del.filter((x) => x.tipo === "Traspaso" && x.origen === cuenta).reduce((a, x) => a + Number(x.importe), 0);
    const deCaja = tr("Caja"), deBanco = tr("Banco");
    const eC = s("Ingreso", "Caja") + deBanco, sC = s("Gasto", "Caja") + deCaja;
    const eB = s("Ingreso", "Banco") + deCaja, sB = s("Gasto", "Banco") + deBanco;
    caja += eC - sC; banco += eB - sB;
    filas.push({ mes: MESES[m - 1], eC, sC, caja, eB, sB, banco, total: caja + banco });
  }

  return (
    <>
      <Cabecera miga={`Tesorería · ${c.anio}`} titulo="Caja y banco, mes a mes" />

      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Kpi titulo="Ahora mismo en caja" valor={eur(c.saldoCaja)} />
        <Kpi titulo="Ahora mismo en banco" valor={eur(c.saldoBanco)} />
        <Kpi titulo="Saldo total" valor={eur(c.saldoTotal)} tono="brass" />
      </div>

      <Tarjeta titulo="Traspaso entre caja y banco" brass>
        <p className="nota">
          Para cuando se coge dinero de la caja y se ingresa en el banco (o al revés).
          No es ni ingreso ni gasto: el saldo total no cambia, solo se mueve de sitio.
        </p>
        <div className="grid grid-cols-1 items-end gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          <Campo etiqueta="Fecha">
            <input type="date" value={tf.fecha} onChange={(e) => setTf({ ...tf, fecha: e.target.value })} />
          </Campo>
          <Campo etiqueta="Sentido">
            <select value={tf.dir} onChange={(e) => setTf({ ...tf, dir: e.target.value })}>
              <option value="CB">De Caja a Banco</option>
              <option value="BC">De Banco a Caja</option>
            </select>
          </Campo>
          <Campo etiqueta="Importe (€)">
            <input type="number" min="0" step="0.01" value={tf.importe} onChange={(e) => setTf({ ...tf, importe: e.target.value })} placeholder="0,00" />
          </Campo>
          <Campo etiqueta="Concepto">
            <input value={tf.concepto} onChange={(e) => setTf({ ...tf, concepto: e.target.value })} placeholder="Ej.: ingreso de la colecta" />
          </Campo>
          <button className="btn-primario" onClick={hacerTraspaso}>Registrar traspaso</button>
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th>Mes</th>
                <th className="text-right">Entra caja</th><th className="text-right">Sale caja</th><th className="text-right">Saldo caja</th>
                <th className="text-right">Entra banco</th><th className="text-right">Sale banco</th><th className="text-right">Saldo banco</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i} className={i === 0 ? "bg-laton-palido font-semibold" : ""}>
                  <td>{f.mes}</td>
                  <td className="text-right tabular-nums">{f.eC == null ? "—" : eur(f.eC)}</td>
                  <td className="text-right tabular-nums">{f.sC == null ? "—" : eur(f.sC)}</td>
                  <td className="text-right tabular-nums">{eur(f.caja)}</td>
                  <td className="text-right tabular-nums">{f.eB == null ? "—" : eur(f.eB)}</td>
                  <td className="text-right tabular-nums">{f.sB == null ? "—" : eur(f.sB)}</td>
                  <td className="text-right tabular-nums">{eur(f.banco)}</td>
                  <td className="text-right font-bold tabular-nums text-verde">{eur(f.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="nota mb-0">Los saldos iniciales se cambian en Ajustes.</p>
      </Tarjeta>
    </>
  );
}
