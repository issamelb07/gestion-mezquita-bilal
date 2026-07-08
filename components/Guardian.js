"use client";

// ============================================================
// Guardian — el portero de la aplicación
//
// Sin sesión iniciada, NINGUNA página se muestra: en cualquier
// dirección aparece la pantalla de inicio de sesión. Con sesión,
// la aplicación funciona con normalidad. Mientras se comprueba,
// una pantalla de espera breve evita parpadeos.
// ============================================================

import { useAuth } from "@/lib/auth";
import PantallaLogin from "@/components/PantallaLogin";
import Khatam from "@/components/Khatam";

export default function Guardian({ children }) {
  const { sesion, errorConfig } = useAuth();

  // Faltan las claves de Supabase: instrucciones en lugar de un error críptico
  if (errorConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-arena p-6">
        <div className="max-w-lg rounded-xl border border-linea bg-white p-6">
          <h2 className="mb-2 font-display text-xl text-verde-oscuro">Falta configurar la conexión</h2>
          <p className="mb-3 text-[13px] leading-relaxed text-[#55645C]">{errorConfig}</p>
          <p className="text-[13px] leading-relaxed text-[#55645C]">
            Copia <b>.env.example</b> como <b>.env.local</b>, pon la URL y la clave anon de
            Supabase (Settings → API) y reinicia la aplicación.
          </p>
        </div>
      </div>
    );
  }

  // Comprobando si hay sesión guardada
  if (sesion === undefined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-arena">
        <Khatam size={28} color="#B8892E" />
        <p className="font-display text-verde-oscuro">Comprobando acceso…</p>
      </div>
    );
  }

  // Sin sesión: pantalla de login en cualquier dirección
  if (!sesion) return <PantallaLogin />;

  // Con sesión: la aplicación completa
  return children;
}
