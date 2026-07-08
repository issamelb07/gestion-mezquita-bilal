"use client";

// ============================================================
// Ajustes — la "hoja CONFIG": parámetros, categorías, copias
// ============================================================

import { useState } from "react";
import { useDatos } from "@/lib/datos";
import { CAT_ESPECIALES, DEFAULT_DATA, hoyISO } from "@/lib/util";
import Cabecera from "@/components/Cabecera";
import Tarjeta from "@/components/Tarjeta";
import Campo from "@/components/Campo";

export default function Ajustes() {
  const { datos } = useDatos();
  if (!datos) return <p className="vacio">Cargando…</p>;
  return <Contenido />;
}

function Contenido() {
  const { datos, api, avisar } = useDatos();
  const { config } = datos;
  const [cargandoDemo, setCargandoDemo] = useState(false);

  // Guarda la configuración con un pequeño retardo (no en cada tecla)
  const ponConfig = (campo, valor) => api.guardarConfig({ ...config, [campo]: valor });

  // ---- Copia de seguridad: descarga todos los datos en un archivo ----
  const exportar = () => {
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `copia_mezquita_bilal_${hoyISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    avisar("Copia de seguridad descargada.");
  };

  // ---- Restaurar una copia previa ----
  const importar = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = async () => {
      try {
        const nuevo = JSON.parse(lector.result);
        if (!nuevo.config || !Array.isArray(nuevo.movimientos)) throw new Error("formato");
        if (!window.confirm("Esto sustituirá TODOS los datos actuales por los de la copia. ¿Continuar?")) return;
        const ok = await api.reemplazarTodo(nuevo);
        if (ok) avisar("Copia restaurada.");
      } catch {
        avisar("Ese archivo no es una copia válida del sistema.");
      }
    };
    lector.onerror = () => avisar("No se pudo leer el archivo.");
    lector.readAsText(archivo);
    e.target.value = "";
  };

  // ---- Datos de ejemplo desde la API (/api/demo) ----
  const cargarDemo = async () => {
    if (!window.confirm("Se cargarán datos de EJEMPLO sustituyendo los actuales.\nÚtil para probar la aplicación.\n\n¿Continuar?")) return;
    setCargandoDemo(true);
    try {
      const res = await fetch("/api/demo");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const demo = await res.json();
      const ok = await api.reemplazarTodo({
        ...demo,
        config: { ...config, ...demo.config, nombre: config.nombre },
      });
      if (ok) avisar("Datos de ejemplo cargados.");
    } catch (e) {
      console.error(e);
      avisar("No se pudieron cargar los datos de ejemplo.");
    } finally {
      setCargandoDemo(false);
    }
  };

  // ---- Borrado total (doble confirmación) ----
  const borrarTodo = async () => {
    if (!window.confirm("Se borrarán TODOS los datos: movimientos, socios, inventario, limpieza y tareas.\n\n¿Seguro?")) return;
    if (!window.confirm("Última confirmación: esta acción no se puede deshacer. ¿Borrar todo?")) return;
    const ok = await api.reemplazarTodo({ ...DEFAULT_DATA, config: { ...config } });
    if (ok) avisar("Datos borrados. La configuración se ha conservado.");
  };

  return (
    <>
      <Cabecera miga="Ajustes" titulo="La configuración, como en el Excel" />

      <Tarjeta titulo="Parámetros generales">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Campo etiqueta="Nombre de la asociación">
            <input value={config.nombre} onChange={(e) => ponConfig("nombre", e.target.value)} />
          </Campo>
          <Campo etiqueta="Año activo">
            <input type="number" min="2020" max="2100" value={config.anio} onChange={(e) => ponConfig("anio", Number(e.target.value))} />
          </Campo>
          <Campo etiqueta="Cuota mensual estándar (€)">
            <input type="number" min="0" step="0.5" value={config.cuotaMes} onChange={(e) => ponConfig("cuotaMes", Number(e.target.value))} />
          </Campo>
          <Campo etiqueta="Saldo inicial de Caja (€)">
            <input type="number" step="0.01" value={config.saldoIniCaja} onChange={(e) => ponConfig("saldoIniCaja", Number(e.target.value))} />
          </Campo>
          <Campo etiqueta="Saldo inicial de Banco (€)">
            <input type="number" step="0.01" value={config.saldoIniBanco} onChange={(e) => ponConfig("saldoIniBanco", Number(e.target.value))} />
          </Campo>
        </div>
        <p className="nota mb-0 mt-3">
          El año activo cambia lo que ves en el Panel, Cuotas, Viernes, Tesorería e Informe.
          Los movimientos de otros años no se borran.
        </p>
      </Tarjeta>

      <EditorLista
        titulo="Categorías de ingreso"
        lista={config.catIngreso}
        protegidas={CAT_ESPECIALES}
        onChange={(l) => ponConfig("catIngreso", l)}
        avisar={avisar}
      />
      <EditorLista
        titulo="Categorías de gasto"
        lista={config.catGasto}
        onChange={(l) => ponConfig("catGasto", l)}
        avisar={avisar}
      />
      <EditorLista
        titulo="Zonas de limpieza"
        lista={config.zonas}
        onChange={(l) => ponConfig("zonas", l)}
        avisar={avisar}
      />

      <Tarjeta titulo="Copias de seguridad y datos de ejemplo">
        <p className="nota">
          Descarga una copia de todos los datos de vez en cuando (por ejemplo, tras cada cierre de mes).
          Se puede restaurar en cualquier momento y en cualquier dispositivo.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <button className="btn-primario" onClick={exportar}>Descargar copia de seguridad</button>
          <label className="btn-secundario">
            Restaurar copia…
            <input type="file" accept="application/json" onChange={importar} className="hidden" />
          </label>
          <button className="btn-secundario" onClick={cargarDemo} disabled={cargandoDemo}>
            {cargandoDemo ? "Cargando…" : "Cargar datos de ejemplo"}
          </button>
        </div>
      </Tarjeta>

      <Tarjeta className="border-[#E8C9C0]">
        <h3 className="titulo-tarjeta !text-barro">Zona de peligro</h3>
        <p className="nota">
          Borra todos los movimientos, socios, inventario, limpieza y tareas. La configuración se conserva.
        </p>
        <button className="btn-peligro" onClick={borrarTodo}>Borrar todos los datos</button>
      </Tarjeta>
    </>
  );
}

// Editor de listas tipo "chips": añadir y quitar opciones de un desplegable
function EditorLista({ titulo, lista, onChange, protegidas = [], avisar }) {
  const [nueva, setNueva] = useState("");

  const anadir = () => {
    const v = nueva.trim();
    if (!v) return;
    if (lista.some((x) => x.toLowerCase() === v.toLowerCase())) { avisar("Esa opción ya existe."); return; }
    onChange([...lista, v]);
    setNueva("");
  };

  const quitar = (v) => {
    if (protegidas.includes(v)) return;
    if (!window.confirm(`¿Quitar "${v}" de la lista? Los movimientos antiguos que la usen no se borran.`)) return;
    onChange(lista.filter((x) => x !== v));
  };

  return (
    <Tarjeta titulo={titulo}>
      <div className="mb-3.5 flex flex-wrap gap-2">
        {lista.map((v) => (
          <span
            key={v}
            className={
              "inline-flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2 text-[12.5px] font-medium " +
              (protegidas.includes(v) ? "bg-laton-palido pr-3 text-laton-oscuro" : "bg-verde-suave text-verde-oscuro")
            }
          >
            {v}
            {protegidas.includes(v) ? (
              <em className="text-[8px] not-italic" title="Esta categoría la usan las cuotas y los viernes: no se puede quitar">●</em>
            ) : (
              <button className="px-1 opacity-60 hover:opacity-100" onClick={() => quitar(v)} aria-label={"Quitar " + v}>✕</button>
            )}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2.5">
        <input
          className="!w-auto min-w-[180px]"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && anadir()}
          placeholder="Nueva opción…"
        />
        <button className="btn-secundario" onClick={anadir}>Añadir</button>
      </div>
    </Tarjeta>
  );
}
