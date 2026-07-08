"use client";

// ============================================================
// Panel — la portada: saldo, indicadores del mes, alertas y gráfico
// ============================================================

import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { useDatos } from "@/lib/datos";
import { useCalculos } from "@/lib/calculos";
import { eur, hoyISO, MESES, mesDe } from "@/lib/util";
import Cabecera from "@/components/Cabecera";
import Tarjeta from "@/components/Tarjeta";
import Kpi from "@/components/Kpi";

export default function Panel() {
  const { datos } = useDatos();
  if (!datos) return <p className="vacio">Abriendo el libro de cuentas…</p>;
  return <Contenido datos={datos} />;
}

function Contenido({ datos }) {
  const c = useCalculos(datos);
  const { inventario, tareas, limpieza } = datos;
  const hoy = hoyISO();

  // Mes que se muestra: el actual si el año activo es este; si no, diciembre
  const esAnioActual = c.anio === new Date().getFullYear();
  const mes = esAnioActual ? new Date().getMonth() + 1 : 12;

  const ingMes = c.suma(c.ing.filter((m) => mesDe(m.fecha) === mes));
  const gasMes = c.suma(c.gas.filter((m) => mesDe(m.fecha) === mes));
  const donMes = c.suma(c.ing.filter((m) => m.categoria === "Donación viernes" && mesDe(m.fecha) === mes));

  // Alertas clicables: llevan a la sección con el problema
  const alertas = [];
  const morosos = c.cuotasPorSocio.filter((x) => x.pendientes >= 2).length;
  if (morosos) alertas.push({ n: morosos, t: "socios con 2 o más cuotas pendientes", href: "/cuotas" });
  const reponer = inventario.filter((i) => Number(i.cantidad) <= Number(i.minimo)).length;
  if (reponer) alertas.push({ n: reponer, t: "artículos por reponer", href: "/inventario" });
  const vencidas = tareas.filter((t) => t.estado !== "Hecha" && t.fechaLimite && t.fechaLimite < hoy).length;
  if (vencidas) alertas.push({ n: vencidas, t: "tareas vencidas", href: "/tareas" });
  const pendLimp = limpieza.filter((l) => l.estado === "Pendiente").length;
  if (pendLimp) alertas.push({ n: pendLimp, t: "turnos de limpieza pendientes", href: "/limpieza" });

  return (
    <>
      <Cabecera miga={`Panel · ${MESES[mes - 1]} ${c.anio}`} titulo="El estado de la casa" />

      {/* Saldo total con desglose caja / banco */}
      <div className="mb-3.5 flex flex-col gap-1 rounded-2xl bg-verde-oscuro px-6 py-5 text-[#EDE7D4] [background-image:radial-gradient(circle_at_92%_15%,rgba(201,162,39,.22),transparent_45%)]">
        <span className="text-xs uppercase tracking-[1.2px] text-[#E2C88A]/90">Saldo total de la asociación</span>
        <strong className="font-display text-[38px] leading-tight text-laton-palido">{eur(c.saldoTotal)}</strong>
        <div className="text-[13px] text-[#EDE7D4]/85">En caja {eur(c.saldoCaja)} · En banco {eur(c.saldoBanco)}</div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6">
        <Kpi titulo={`Ingresos de ${MESES[mes - 1].toLowerCase()}`} valor={eur(ingMes)} />
        <Kpi titulo={`Gastos de ${MESES[mes - 1].toLowerCase()}`} valor={eur(gasMes)} tono="rojo" />
        <Kpi titulo="Resultado del mes" valor={eur(ingMes - gasMes)} tono="brass" />
        <Kpi titulo="Donaciones viernes (mes)" valor={eur(donMes)} />
        <Kpi titulo="Socios activos" valor={c.activos.length} />
        <Kpi titulo="Deuda de cuotas" valor={eur(c.deudaTotal)} tono="rojo" />
      </div>

      {alertas.length > 0 && (
        <Tarjeta titulo="Requiere atención" className="border-l-4 border-l-barro">
          {alertas.map((a, i) => (
            <Link key={i} href={a.href} className="flex items-baseline gap-1.5 rounded-md px-1 py-1.5 hover:bg-[#FBF4EF]">
              <b className="text-[15px] text-barro">{a.n}</b> {a.t}
              <span className="ml-auto text-xs text-laton-oscuro">ver →</span>
            </Link>
          ))}
        </Tarjeta>
      )}

      <Tarjeta titulo="Ingresos y gastos del año">
        <div className="h-[260px] w-full">
          <ResponsiveContainer>
            <LineChart data={c.porMes} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5DFCE" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => eur(v)} />
              <Legend />
              <Line type="monotone" dataKey="Ingresos" stroke="#14614B" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Gastos" stroke="#B4452F" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Tarjeta>
    </>
  );
}
