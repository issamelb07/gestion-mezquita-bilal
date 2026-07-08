"use client";

// ============================================================
// Sidebar.js — navegación lateral (y menú plegable en el móvil)
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Khatam from "@/components/Khatam";
import { useDatos } from "@/lib/datos";
import { useAuth } from "@/lib/auth";
import { DEFAULT_DATA } from "@/lib/util";

const SECCIONES = [
  ["/", "Panel", "◈"],
  ["/registro", "Registro", "✎"],
  ["/socios", "Socios", "👥"],
  ["/cuotas", "Cuotas", "🧾"],
  ["/viernes", "Viernes", "☪"],
  ["/tesoreria", "Tesorería", "€"],
  ["/inventario", "Inventario", "▦"],
  ["/limpieza", "Limpieza", "✦"],
  ["/tareas", "Tareas", "☑"],
  ["/documentos", "Documentos", "🗂"],
  ["/informe", "Informe", "🖨"],
  ["/ajustes", "Ajustes", "⚙"],
];

function BandaGeometrica() {
  return (
    <svg className="block h-[22px] w-full opacity-90" viewBox="0 0 240 24" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <g key={i} transform={`translate(${i * 24 + 12} 12)`} fill="none" stroke="rgba(226,200,138,.55)" strokeWidth="1">
          <rect x="-6" y="-6" width="12" height="12" />
          <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" />
        </g>
      ))}
    </svg>
  );
}

export default function Sidebar() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const { datos } = useDatos();
  const { sesion, cerrarSesion } = useAuth();
  const nombre = datos?.config?.nombre || DEFAULT_DATA.config.nombre;
  const anio = datos?.config?.anio || new Date().getFullYear();

  return (
    <>
      {/* Botón de menú solo visible en el móvil */}
      <button
        className="no-print fixed right-3 top-3 z-30 rounded-lg bg-verde-oscuro px-3 py-2 text-lg text-laton-palido md:hidden"
        onClick={() => setAbierto(!abierto)}
        aria-label="Abrir menú"
      >
        ☰
      </button>

      <aside
        className={
          "no-print fixed z-20 flex h-screen w-[250px] flex-col bg-gradient-to-b from-verde-oscuro to-[#0E4A39] text-[#EDE7D4] transition-transform md:sticky md:top-0 md:w-[232px] md:translate-x-0 " +
          (abierto ? "translate-x-0 shadow-2xl" : "-translate-x-full")
        }
      >
        <div className="flex items-center gap-2.5 px-4 pb-3 pt-5">
          <Khatam size={26} color="#E2C88A" />
          <div>
            <h1 className="font-display text-[16px] leading-tight text-[#F5EFDD]">{nombre}</h1>
            <span className="text-[11px] tracking-wide text-[#E2C88A]/85">Libro de gestión · {anio}</span>
          </div>
        </div>
        <BandaGeometrica />
        <nav className="flex flex-col gap-0.5 overflow-y-auto p-2.5">
          {SECCIONES.map(([href, nombre, icono]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setAbierto(false)}
              className={
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-colors " +
                (ruta === href
                  ? "bg-laton/15 text-[#F2E7C8] shadow-[inset_3px_0_0_#C9A227]"
                  : "text-[#F0EBDA]/80 hover:bg-white/5")
              }
            >
              <span className="w-[18px] text-center opacity-90">{icono}</span>
              {nombre}
            </Link>
          ))}
        </nav>
        {/* Usuario conectado y cierre de sesión */}
        <div className="mt-auto border-t border-white/10 px-4 pb-4 pt-3">
          <p className="mb-2 truncate text-[11px] text-[#EDE7D4]/70" title={sesion?.user?.email}>
            👤 {sesion?.user?.email || "—"}
          </p>
          <button
            onClick={cerrarSesion}
            className="w-full rounded-lg border border-[#E2C88A]/40 px-3 py-1.5 text-[12px] font-semibold text-[#F2E7C8] transition-colors hover:bg-white/10"
          >
            Cerrar sesión
          </button>
          <p className="mt-3 text-[10px] leading-relaxed text-[#EDE7D4]/45">
            Los datos se guardan en la nube de la asociación.
          </p>
        </div>
      </aside>
    </>
  );
}
