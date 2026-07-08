"use client";

// ============================================================
// Socios — el libro de socios de la asociación
//
// · Alta con ficha completa (DNI/NIE validado, dirección, contacto…)
// · Buscador y filtro por estado
// · Ficha individual: datos editables + resumen económico
//   (cuotas del año, deuda, total aportado, historial de pagos)
// · Baja con fecha automática y reactivación
// · Exportación del libro de socios a CSV (Excel)
// ============================================================

import { useMemo, useState } from "react";
import { useDatos } from "@/lib/datos";
import { useCalculos } from "@/lib/calculos";
import { eur, fFecha, hoyISO, uid, validarDNI, aniosDesde, CARGOS, MESES_CORTO } from "@/lib/util";
import Cabecera from "@/components/Cabecera";
import Tarjeta from "@/components/Tarjeta";
import Kpi from "@/components/Kpi";
import Campo from "@/components/Campo";
import Khatam from "@/components/Khatam";

const ALTA_VACIA = {
  nombre: "", dni: "", telefono: "", email: "",
  direccion: "", ciudad: "", codigoPostal: "",
  fechaNacimiento: "", alta: "", cargo: "Socio", cuota: 10, notas: "",
};

export default function Socios() {
  const { datos } = useDatos();
  if (!datos) return <p className="vacio">Cargando…</p>;
  return <Contenido />;
}

function Contenido() {
  const { datos, api, avisar } = useDatos();
  const c = useCalculos(datos);
  const { socios, config } = datos;

  const [f, setF] = useState({ ...ALTA_VACIA, alta: hoyISO(), cuota: config.cuotaMes });
  const [err, setErr] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Activo");
  const [fichaId, setFichaId] = useState(null); // socio abierto en la ficha

  const pon = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // El código de socio (S001, S002…) se genera solo a partir del más alto
  const siguienteCodigo = () => {
    const nums = socios.map((s) => Number((s.codigo || "").replace(/\D/g, ""))).filter((n) => !isNaN(n));
    return "S" + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, "0");
  };

  const alta = () => {
    const e = {};
    if (!f.nombre.trim()) e.nombre = "Falta el nombre";
    if (f.dni && !validarDNI(f.dni)) e.dni = "DNI/NIE no válido (revisa la letra)";
    const dniNorm = f.dni.trim().toUpperCase();
    if (dniNorm && socios.some((s) => (s.dni || "").toUpperCase() === dniNorm)) e.dni = "Ya hay un socio con ese DNI/NIE";
    setErr(e);
    if (Object.keys(e).length) return;

    const nuevo = {
      ...f, id: uid(), codigo: siguienteCodigo(), dni: dniNorm,
      cuota: Number(f.cuota) || 0, estado: "Activo", fechaBaja: "",
    };
    api.crearSocio(nuevo);
    setF({ ...ALTA_VACIA, alta: hoyISO(), cuota: config.cuotaMes });
    avisar(`Socio ${nuevo.codigo} dado de alta.`);
  };

  // ---- Búsqueda y filtro ----
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return socios
      .filter((s) => filtroEstado === "Todos" || s.estado === filtroEstado)
      .filter((s) =>
        !q ||
        [s.nombre, s.codigo, s.dni, s.telefono, s.email, s.ciudad]
          .some((v) => (v || "").toLowerCase().includes(q))
      );
  }, [socios, busqueda, filtroEstado]);

  const cuotasDe = (id) => c.cuotasPorSocio.find((x) => x.socio.id === id);

  // ---- Exportar libro de socios a CSV (se abre en Excel) ----
  const exportarCSV = () => {
    const cab = ["Código","Nombre","DNI/NIE","Teléfono","Email","Dirección","Ciudad","C.P.","F. nacimiento","F. alta","F. baja","Cargo","Cuota (€)","Estado","Deuda (€)","Notas"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const filas = socios.map((s) => {
      const q = cuotasDe(s.id);
      return [s.codigo, s.nombre, s.dni, s.telefono, s.email, s.direccion, s.ciudad, s.codigoPostal,
        fFecha(s.fechaNacimiento), fFecha(s.alta), fFecha(s.fechaBaja), s.cargo, s.cuota, s.estado,
        q ? q.deuda : 0, s.notas].map(esc).join(";");
    });
    const csv = "\uFEFF" + cab.map(esc).join(";") + "\n" + filas.join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `libro_socios_${hoyISO()}.csv`; a.click();
    URL.revokeObjectURL(url);
    avisar("Libro de socios exportado.");
  };

  const nBajas = socios.filter((s) => s.estado === "Baja").length;
  const conDeuda = c.cuotasPorSocio.filter((x) => x.deuda > 0).length;
  const nuevosEsteAnio = socios.filter((s) => (s.alta || "").startsWith(String(c.anio))).length;

  return (
    <>
      <Cabecera miga={`Socios · ${c.activos.length} activos`} titulo="El libro de socios" />

      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Kpi titulo="Socios activos" valor={c.activos.length} />
        <Kpi titulo="Con cuotas pendientes" valor={conDeuda} tono={conDeuda ? "rojo" : "verde"} />
        <Kpi titulo={`Altas en ${c.anio}`} valor={nuevosEsteAnio} tono="brass" />
        <Kpi titulo="Bajas" valor={nBajas} />
      </div>

      <Tarjeta titulo="Alta de socio">
        <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Nombre y apellidos *" error={err.nombre}>
            <input value={f.nombre} onChange={pon("nombre")} />
          </Campo>
          <Campo etiqueta="DNI / NIE" error={err.dni}>
            <input value={f.dni} onChange={pon("dni")} placeholder="12345678Z" />
          </Campo>
          <Campo etiqueta="Teléfono"><input value={f.telefono} onChange={pon("telefono")} /></Campo>
          <Campo etiqueta="Email"><input type="email" value={f.email} onChange={pon("email")} /></Campo>
          <div className="lg:col-span-2">
            <Campo etiqueta="Dirección (calle y número)">
              <input value={f.direccion} onChange={pon("direccion")} placeholder="Calle Feria, 12, 3ºB" />
            </Campo>
          </div>
          <Campo etiqueta="Ciudad"><input value={f.ciudad} onChange={pon("ciudad")} /></Campo>
          <Campo etiqueta="Código postal"><input value={f.codigoPostal} onChange={pon("codigoPostal")} /></Campo>
          <Campo etiqueta="Fecha de nacimiento">
            <input type="date" value={f.fechaNacimiento} onChange={pon("fechaNacimiento")} />
          </Campo>
          <Campo etiqueta="Fecha de alta"><input type="date" value={f.alta} onChange={pon("alta")} /></Campo>
          <Campo etiqueta="Cargo">
            <select value={f.cargo} onChange={pon("cargo")}>
              {CARGOS.map((x) => <option key={x}>{x}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Cuota mensual (€)">
            <input type="number" min="0" step="0.5" value={f.cuota} onChange={pon("cuota")} />
          </Campo>
        </div>
        <button className="btn-primario" onClick={alta}>Dar de alta</button>
      </Tarjeta>

      <Tarjeta>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <h3 className="titulo-tarjeta mb-0">Listado</h3>
          <div className="flex flex-wrap gap-2">
            <input
              className="!w-[220px]"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar nombre, DNI, teléfono…"
            />
            <select className="!w-auto" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option>Activo</option><option>Baja</option><option>Todos</option>
            </select>
            <button className="btn-secundario" onClick={exportarCSV}>Exportar CSV</button>
          </div>
        </div>

        {filtrados.length === 0 ? (
          <p className="vacio">
            {socios.length === 0
              ? "Todavía no hay socios. El primero recibirá el código S001."
              : "Ningún socio coincide con la búsqueda."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr><th>Código</th><th>Nombre</th><th>DNI/NIE</th><th>Teléfono</th><th>Cargo</th><th className="text-right">Deuda</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {filtrados.map((s) => {
                  const q = cuotasDe(s.id);
                  return (
                    <tr key={s.id} className={"cursor-pointer hover:bg-[#FBF9F2] " + (s.estado === "Baja" ? "opacity-50" : "")}
                        onClick={() => setFichaId(s.id)}>
                      <td className="font-bold text-verde">{s.codigo}</td>
                      <td>
                        {s.nombre}
                        {s.cargo !== "Socio" && <span className="chip chip-brass ml-2">{s.cargo}</span>}
                      </td>
                      <td>{s.dni || "—"}</td>
                      <td>{s.telefono || "—"}</td>
                      <td>{s.cargo}</td>
                      <td className={"text-right tabular-nums " + (q?.deuda > 0 ? "font-bold text-barro" : "")}>
                        {q?.deuda > 0 ? eur(q.deuda) : "—"}
                      </td>
                      <td><span className={"chip " + (s.estado === "Activo" ? "chip-verde" : "chip-gris")}>{s.estado}</span></td>
                      <td className="text-laton-oscuro">Ficha →</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      {fichaId && (
        <FichaSocio
          socio={socios.find((s) => s.id === fichaId)}
          cuotas={cuotasDe(fichaId)}
          datos={datos}
          api={api}
          avisar={avisar}
          cerrar={() => setFichaId(null)}
        />
      )}
    </>
  );
}

// ============================================================
// FICHA DE SOCIO — ventana con los datos completos y su economía
// ============================================================

function FichaSocio({ socio, cuotas, datos, api, avisar, cerrar }) {
  const [f, setF] = useState({ ...socio });
  const [err, setErr] = useState({});
  const pon = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (!socio) return null;

  // Historial económico del socio (cuotas y cualquier movimiento a su nombre)
  const historial = datos.movimientos
    .filter((m) => m.socioId === socio.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const totalAportado = historial
    .filter((m) => m.tipo === "Ingreso")
    .reduce((s, m) => s + Number(m.importe), 0);
  const antiguedad = aniosDesde(socio.alta);

  const guardar = () => {
    const e = {};
    if (!f.nombre.trim()) e.nombre = "Falta el nombre";
    if (f.dni && !validarDNI(f.dni)) e.dni = "DNI/NIE no válido (revisa la letra)";
    const dniNorm = (f.dni || "").trim().toUpperCase();
    if (dniNorm && datos.socios.some((s) => s.id !== socio.id && (s.dni || "").toUpperCase() === dniNorm))
      e.dni = "Ya hay otro socio con ese DNI/NIE";
    setErr(e);
    if (Object.keys(e).length) return;

    api.actualizarSocio(socio.id, {
      nombre: f.nombre, dni: dniNorm, telefono: f.telefono, email: f.email,
      direccion: f.direccion, ciudad: f.ciudad, codigoPostal: f.codigoPostal,
      fechaNacimiento: f.fechaNacimiento, alta: f.alta, cargo: f.cargo,
      cuota: f.cuota, notas: f.notas,
    });
    avisar("Ficha guardada.");
    cerrar();
  };

  // Baja: guarda la fecha del día. Reactivar: la limpia.
  const cambiarEstado = () => {
    if (socio.estado === "Activo") {
      if (!window.confirm(`¿Dar de baja a ${socio.nombre}?\nSu historial y sus cuotas pagadas se conservan.`)) return;
      api.actualizarSocio(socio.id, { estado: "Baja", fechaBaja: hoyISO() });
      avisar("Socio dado de baja.");
    } else {
      api.actualizarSocio(socio.id, { estado: "Activo", fechaBaja: "" });
      avisar("Socio reactivado.");
    }
    cerrar();
  };

  const borrar = () => {
    const tiene = historial.length > 0;
    const msg = tiene
      ? `${socio.nombre} tiene ${historial.length} pago(s) registrados. Si lo borras, esos pagos quedarán sin socio.\n\n¿Borrar de todas formas? (Normalmente es mejor darle de baja)`
      : `¿Borrar a ${socio.nombre} definitivamente?`;
    if (!window.confirm(msg)) return;
    api.borrarSocio(socio.id);
    avisar("Socio borrado.");
    cerrar();
  };

  return (
    <div className="no-print fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-tinta/40 p-4 md:p-8" onClick={cerrar}>
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Cabecera de la ficha */}
        <div className="flex items-center gap-3 rounded-t-2xl bg-verde-oscuro px-5 py-4 text-[#EDE7D4]">
          <Khatam size={18} color="#E2C88A" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg text-laton-palido">
              {socio.codigo} · {socio.nombre}
            </h3>
            <p className="text-[12px] text-[#EDE7D4]/75">
              {socio.cargo !== "Socio" ? socio.cargo + " · " : ""}
              {socio.estado === "Activo"
                ? (antiguedad != null ? `Socio desde hace ${antiguedad} año(s)` : "Socio activo")
                : `De baja desde ${fFecha(socio.fechaBaja)}`}
            </p>
          </div>
          <button className="rounded-lg px-2.5 py-1 text-lg hover:bg-white/10" onClick={cerrar} aria-label="Cerrar">✕</button>
        </div>

        <div className="p-5">
          {/* Resumen económico */}
          <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <Kpi titulo={`Cuotas ${datos.config.anio}`} valor={`${cuotas?.pagadas ?? 0} de ${cuotas ? cuotas.pagadas + cuotas.pendientes : 0}`} />
            <Kpi titulo="Deuda pendiente" valor={eur(cuotas?.deuda ?? 0)} tono={cuotas?.deuda > 0 ? "rojo" : "verde"} />
            <Kpi titulo="Total aportado" valor={eur(totalAportado)} tono="brass" />
            <Kpi titulo="Pagos registrados" valor={historial.length} />
          </div>

          {/* Mini cuadro de cuotas del año */}
          <div className="mb-4 flex flex-wrap gap-1">
            {MESES_CORTO.map((m, i) => (
              <span key={m}
                className={"rounded-md px-2 py-1 text-[10.5px] font-semibold " +
                  (cuotas?.pagos?.has(i + 1) ? "bg-verde-suave text-verde" : "bg-[#EDEBE3] text-[#8A948C]")}>
                {m} {cuotas?.pagos?.has(i + 1) ? "✔" : ""}
              </span>
            ))}
          </div>

          {/* Datos personales editables */}
          <h4 className="titulo-tarjeta !text-[15px]"><Khatam size={11} /> Datos del socio</h4>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Campo etiqueta="Nombre y apellidos *" error={err.nombre}><input value={f.nombre} onChange={pon("nombre")} /></Campo>
            <Campo etiqueta="DNI / NIE" error={err.dni}><input value={f.dni} onChange={pon("dni")} placeholder="12345678Z" /></Campo>
            <Campo etiqueta="Teléfono"><input value={f.telefono} onChange={pon("telefono")} /></Campo>
            <Campo etiqueta="Email"><input type="email" value={f.email} onChange={pon("email")} /></Campo>
            <div className="sm:col-span-2">
              <Campo etiqueta="Dirección"><input value={f.direccion} onChange={pon("direccion")} /></Campo>
            </div>
            <Campo etiqueta="Ciudad"><input value={f.ciudad} onChange={pon("ciudad")} /></Campo>
            <Campo etiqueta="Código postal"><input value={f.codigoPostal} onChange={pon("codigoPostal")} /></Campo>
            <Campo etiqueta="Fecha de nacimiento"><input type="date" value={f.fechaNacimiento} onChange={pon("fechaNacimiento")} /></Campo>
            <Campo etiqueta="Fecha de alta"><input type="date" value={f.alta} onChange={pon("alta")} /></Campo>
            <Campo etiqueta="Cargo">
              <select value={f.cargo} onChange={pon("cargo")}>{CARGOS.map((x) => <option key={x}>{x}</option>)}</select>
            </Campo>
            <Campo etiqueta="Cuota mensual (€)"><input type="number" min="0" step="0.5" value={f.cuota} onChange={pon("cuota")} /></Campo>
            <div className="sm:col-span-2 lg:col-span-3">
              <Campo etiqueta="Notas"><input value={f.notas} onChange={pon("notas")} placeholder="Observaciones internas" /></Campo>
            </div>
          </div>

          {/* Historial de pagos */}
          <h4 className="titulo-tarjeta !text-[15px]"><Khatam size={11} /> Historial de pagos</h4>
          {historial.length === 0 ? (
            <p className="vacio">Sin pagos registrados todavía.</p>
          ) : (
            <div className="mb-2 max-h-[180px] overflow-y-auto rounded-lg border border-linea">
              <table className="w-full border-collapse text-[12.5px]">
                <thead><tr><th>Fecha</th><th>Concepto</th><th>Pago</th><th className="text-right">Importe</th></tr></thead>
                <tbody>
                  {historial.map((m) => (
                    <tr key={m.id}>
                      <td>{fFecha(m.fecha)}</td>
                      <td>{m.concepto || m.categoria}</td>
                      <td>{m.pago || "—"}</td>
                      <td className="text-right font-semibold tabular-nums">{eur(m.importe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-linea pt-4">
            <button className="btn-primario" onClick={guardar}>Guardar cambios</button>
            <button className="btn-secundario" onClick={cambiarEstado}>
              {socio.estado === "Activo" ? "Dar de baja" : "Reactivar socio"}
            </button>
            <button className="btn-peligro ml-auto" onClick={borrar}>Borrar definitivamente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
