"use client";

// ============================================================
// Viernes — las colectas del yumu'a, viernes a viernes
// ============================================================

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useDatos } from "@/lib/datos";
import { useCalculos } from "@/lib/calculos";
import { eur, fFecha, isoDe, viernesDelAnio } from "@/lib/util";
import Cabecera from "@/components/Cabecera";
import Tarjeta from "@/components/Tarjeta";
import Kpi from "@/components/Kpi";

export default function Viernes() {
  const { datos } = useDatos();
  if (!datos) return <p className="vacio">Cargando…</p>;
  return <Contenido datos={datos} />;
}

function Contenido({ datos }) {
  const c = useCalculos(datos);
  const donaciones = c.ing.filter((m) => m.categoria === "Donación viernes");

  // Una fila por cada viernes del año, con lo recaudado ese día
  const filas = viernesDelAnio(c.anio).map((v, i) => {
    const iso = isoDe(v);
    const importe = donaciones.filter((m) => m.fecha === iso).reduce((s, m) => s + Number(m.importe), 0);
    return { n: i + 1, fecha: fFecha(iso), importe };
  });
  const conColecta = filas.filter((f) => f.importe > 0);
  const total = conColecta.reduce((s, f) => s + f.importe, 0);
  const mejor = conColecta.reduce((a, b) => (b.importe > (a?.importe || 0) ? b : a), null);
  const grafico = filas.map((f) => ({ fecha: f.fecha.slice(0, 5), Colecta: f.importe }));

  return (
    <>
      <Cabecera miga={`Donaciones de los viernes · ${c.anio}`} titulo="La colecta del yumu'a" />

      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Kpi titulo="Total del año" valor={eur(total)} />
        <Kpi titulo="Media por viernes" valor={conColecta.length ? eur(total / conColecta.length) : "—"} />
        <Kpi titulo="Mejor viernes" valor={mejor ? `${eur(mejor.importe)} · ${mejor.fecha}` : "—"} tono="brass" />
        <Kpi titulo="Viernes con colecta" valor={`${conColecta.length} de ${filas.length}`} />
      </div>

      <Tarjeta titulo="Colecta viernes a viernes">
        <div className="h-[220px] w-full">
          <ResponsiveContainer>
            <BarChart data={grafico} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5DFCE" />
              <XAxis dataKey="fecha" tick={{ fontSize: 9 }} interval={3} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => eur(v)} />
              <Bar dataKey="Colecta" fill="#14614B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="nota mb-0">
          Para apuntar una colecta: Registro → categoría &quot;Donación viernes&quot; con la fecha del viernes.
        </p>
      </Tarjeta>

      <Tarjeta titulo="Detalle">
        <div className="max-h-[380px] overflow-x-auto overflow-y-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead><tr><th>Nº</th><th>Viernes</th><th className="text-right">Colecta</th></tr></thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.n} className={f.importe === 0 ? "opacity-50" : ""}>
                  <td>{f.n}</td>
                  <td>{f.fecha}</td>
                  <td className={"text-right tabular-nums " + (f.importe ? "font-semibold" : "")}>
                    {f.importe ? eur(f.importe) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </>
  );
}
