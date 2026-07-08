"use client";

// ============================================================
// Cuotas — cuadro anual socio × mes y registro masivo mensual
// ============================================================

import { useState } from "react";
import { useDatos } from "@/lib/datos";
import { useCalculos } from "@/lib/calculos";
import { eur, hoyISO, uid, MESES, MESES_CORTO } from "@/lib/util";
import Cabecera from "@/components/Cabecera";
import Tarjeta from "@/components/Tarjeta";
import Kpi from "@/components/Kpi";

export default function Cuotas() {
  const { datos } = useDatos();
  if (!datos) return <p className="vacio">Cargando…</p>;
  return <Contenido />;
}

function Contenido() {
  const { datos, api, avisar } = useDatos();
  const c = useCalculos(datos);
  const { config } = datos;
  const [mesMasivo, setMesMasivo] = useState(new Date().getMonth() + 1);
  const [pagoMasivo, setPagoMasivo] = useState("Caja");

  // Registra de golpe la cuota de todos los socios activos que falten ese mes
  const registrarMes = () => {
    const mes = Number(mesMasivo);
    const pendientes = c.cuotasPorSocio.filter((x) => x.socio.estado === "Activo" && !x.pagos.has(mes));
    if (!pendientes.length) { avisar("Todos los socios activos ya tienen la cuota de ese mes."); return; }
    if (!window.confirm(`Se registrará la cuota de ${MESES[mes - 1]} para ${pendientes.length} socio(s) que aún no la han pagado.\n\n¿Continuar?`)) return;

    const esMesActual = c.anio === new Date().getFullYear() && mes === new Date().getMonth() + 1;
    const fecha = esMesActual ? hoyISO() : `${c.anio}-${String(mes).padStart(2, "0")}-01`;
    const nuevos = pendientes.map((x) => ({
      id: uid(), fecha, tipo: "Ingreso", categoria: "Cuota de socio",
      concepto: `Cuota de ${MESES[mes - 1].toLowerCase()}`, socioId: x.socio.id,
      importe: Number(x.socio.cuota || config.cuotaMes), pago: pagoMasivo,
      responsable: "Tesorero", notas: "Registro masivo",
    }));
    api.crearMovimientos(nuevos);
    avisar(`${nuevos.length} cuota(s) registradas.`);
  };

  const pctCobrado =
    c.activos.length && c.mesesTranscurridos
      ? Math.round(100 * c.cuotasPorSocio.reduce((s, x) => s + x.pagadas, 0) / (c.activos.length * c.mesesTranscurridos)) + " %"
      : "—";

  return (
    <>
      <Cabecera miga={`Cuotas · ${config.anio}`} titulo="Quién ha pagado y quién debe" />

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <Kpi titulo="Deuda total pendiente" valor={eur(c.deudaTotal)} tono="rojo" />
        <Kpi titulo="Cuotas cobradas (año)" valor={pctCobrado} />
      </div>

      <Tarjeta titulo="Registro rápido de cuotas del mes" brass>
        <p className="nota">
          Apunta de golpe la cuota de todos los socios activos que aún no la hayan pagado. Los que ya pagaron se saltan solos.
        </p>
        <div className="flex flex-wrap items-end gap-2.5">
          <select className="!w-auto" value={mesMasivo} onChange={(e) => setMesMasivo(e.target.value)}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select className="!w-auto" value={pagoMasivo} onChange={(e) => setPagoMasivo(e.target.value)}>
            <option>Caja</option><option>Banco</option>
          </select>
          <button className="btn-primario" onClick={registrarMes}>Registrar cuotas del mes</button>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Cuadro anual">
        {datos.socios.length === 0 ? (
          <p className="vacio">Da de alta socios para ver aquí su cuadro de cuotas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th>Socio</th>
                  {MESES_CORTO.map((m) => <th key={m} className="text-center">{m}</th>)}
                  <th className="text-right">Debe</th>
                </tr>
              </thead>
              <tbody>
                {c.cuotasPorSocio.map(({ socio, pagos, deuda }) => (
                  <tr key={socio.id} className={socio.estado === "Baja" ? "opacity-50" : ""}>
                    <td className="whitespace-nowrap">
                      <b className="text-verde">{socio.codigo}</b> {socio.nombre}{socio.estado === "Baja" && " (baja)"}
                    </td>
                    {MESES_CORTO.map((_, i) => (
                      <td key={i} className={"text-center " + (pagos.has(i + 1) ? "bg-verde-suave font-bold text-verde" : "")}>
                        {pagos.has(i + 1) ? "✔" : ""}
                      </td>
                    ))}
                    <td className={"text-right tabular-nums " + (deuda > 0 ? "font-bold text-barro" : "")}>
                      {deuda > 0 ? eur(deuda) : "—"}
                    </td>
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
