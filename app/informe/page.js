"use client";

// ============================================================
// Informe — resumen mensual imprimible para la asamblea
// ============================================================

import { useState } from "react";
import { useDatos } from "@/lib/datos";
import { useCalculos } from "@/lib/calculos";
import { eur, MESES, mesDe } from "@/lib/util";
import Cabecera from "@/components/Cabecera";
import Tarjeta from "@/components/Tarjeta";
import Khatam from "@/components/Khatam";

export default function Informe() {
  const { datos } = useDatos();
  if (!datos) return <p className="vacio">Cargando…</p>;
  return <Contenido datos={datos} />;
}

function Contenido({ datos }) {
  const c = useCalculos(datos);
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  const del = c.delAnio.filter((m) => mesDe(m.fecha) === Number(mes));

  // Agrupa los movimientos del mes por categoría, de mayor a menor
  const grupo = (tipo) => {
    const map = {};
    del.filter((m) => m.tipo === tipo).forEach((m) => {
      map[m.categoria] = (map[m.categoria] || 0) + Number(m.importe);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };
  const ingresos = grupo("Ingreso");
  const gastos = grupo("Gasto");
  const tIng = ingresos.reduce((s, [, v]) => s + v, 0);
  const tGas = gastos.reduce((s, [, v]) => s + v, 0);
  const donV = del.filter((m) => m.categoria === "Donación viernes").reduce((s, m) => s + Number(m.importe), 0);
  const nCuotas = del.filter((m) => m.categoria === "Cuota de socio").length;

  return (
    <>
      <Cabecera miga="Informe mensual" titulo="Para presentar en la asamblea" ocultarAlImprimir />

      <Tarjeta className="no-print">
        <div className="flex flex-wrap items-end gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="etiqueta-campo">Mes del informe</span>
            <select className="!w-auto" value={mes} onChange={(e) => setMes(e.target.value)}>
              {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </label>
          <button className="btn-primario" onClick={() => window.print()}>Imprimir / guardar PDF</button>
        </div>
      </Tarjeta>

      <Tarjeta>
        {/* Cabecera del documento */}
        <div className="mb-4 flex items-center gap-3 border-b-2 border-laton pb-3">
          <Khatam size={20} color="#97741B" />
          <div>
            <h3 className="font-display text-lg text-verde-oscuro">{datos.config.nombre}</h3>
            <p className="text-[12.5px] text-[#6E7A72]">Informe de {MESES[mes - 1]} de {c.anio}</p>
          </div>
        </div>

        {/* Ingresos y gastos por categoría */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-display text-verde-oscuro">Ingresos</h4>
            <table className="w-full border-collapse text-[13px]">
              <tbody>
                {ingresos.length === 0 && <tr><td className="vacio">Sin ingresos este mes</td><td /></tr>}
                {ingresos.map(([cat, v]) => (
                  <tr key={cat}><td>{cat}</td><td className="text-right tabular-nums">{eur(v)}</td></tr>
                ))}
                <tr className="border-t-2 border-linea font-bold">
                  <td>Total ingresos</td><td className="text-right tabular-nums">{eur(tIng)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 className="mb-2 font-display text-verde-oscuro">Gastos</h4>
            <table className="w-full border-collapse text-[13px]">
              <tbody>
                {gastos.length === 0 && <tr><td className="vacio">Sin gastos este mes</td><td /></tr>}
                {gastos.map(([cat, v]) => (
                  <tr key={cat}><td>{cat}</td><td className="text-right tabular-nums">{eur(v)}</td></tr>
                ))}
                <tr className="border-t-2 border-linea font-bold">
                  <td>Total gastos</td><td className="text-right tabular-nums">{eur(tGas)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-linea pt-4 lg:grid-cols-4">
          <div>
            <span className="block text-[11.5px] text-[#6E7A72]">Resultado del mes</span>
            <strong className={"text-[17px] " + (tIng - tGas >= 0 ? "text-verde" : "text-barro")}>{eur(tIng - tGas)}</strong>
          </div>
          <div>
            <span className="block text-[11.5px] text-[#6E7A72]">Donaciones de viernes</span>
            <strong className="text-[17px]">{eur(donV)}</strong>
          </div>
          <div>
            <span className="block text-[11.5px] text-[#6E7A72]">Cuotas cobradas</span>
            <strong className="text-[17px]">{nCuotas} de {c.activos.length}</strong>
          </div>
          <div>
            <span className="block text-[11.5px] text-[#6E7A72]">Saldo total a día de hoy</span>
            <strong className="text-[17px] text-laton-oscuro">{eur(c.saldoTotal)}</strong>
          </div>
        </div>

        {/* Firmas */}
        <div className="mt-11 flex gap-10">
          <div className="flex-1 border-t border-tinta pt-1.5 text-center text-xs text-[#55645C]">Firma del Presidente</div>
          <div className="flex-1 border-t border-tinta pt-1.5 text-center text-xs text-[#55645C]">Firma del Tesorero</div>
        </div>
      </Tarjeta>
    </>
  );
}
