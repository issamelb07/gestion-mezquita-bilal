"use client";

// ============================================================
// PantallaLogin — inicio de sesión con el estilo de la casa
// ============================================================

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import Khatam from "@/components/Khatam";
import Campo from "@/components/Campo";
import { DEFAULT_DATA } from "@/lib/util";

export default function PantallaLogin() {
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [entrando, setEntrando] = useState(false);

  const entrar = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      setError("Escribe el correo y la contraseña.");
      return;
    }
    setError("");
    setEntrando(true);
    try {
      await iniciarSesion(email.trim(), password);
      // Al entrar, el guardián muestra la aplicación automáticamente
    } catch (err) {
      setError(err.message);
      setEntrando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-arena p-4">
      <div className="w-full max-w-sm">
        {/* Cabecera con la marca */}
        <div className="flex flex-col items-center gap-2 rounded-t-2xl bg-gradient-to-b from-verde-oscuro to-[#0E4A39] px-6 pb-5 pt-7 text-center">
          <Khatam size={34} color="#E2C88A" />
          <h1 className="font-display text-xl leading-tight text-[#F5EFDD]">
            {DEFAULT_DATA.config.nombre}
          </h1>
          <p className="text-[11.5px] tracking-wide text-[#E2C88A]/85">Libro de gestión · acceso privado</p>
        </div>

        {/* Formulario */}
        <form onSubmit={entrar} className="rounded-b-2xl border border-t-0 border-linea bg-white p-6">
          <div className="mb-4 flex flex-col gap-3.5">
            <Campo etiqueta="Correo electrónico">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tesorero@mezquitabilal.org"
                autoComplete="email"
                autoFocus
              />
            </Campo>
            <Campo etiqueta="Contraseña">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Campo>
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-[#F7E3DE] px-3 py-2 text-[12.5px] text-barro">{error}</p>
          )}

          <button type="submit" className="btn-primario w-full" disabled={entrando}>
            {entrando ? "Entrando…" : "Entrar"}
          </button>

          <p className="nota mb-0 mt-4 text-center">
            El acceso lo gestiona la junta. Si no tienes usuario o has olvidado la
            contraseña, habla con el administrador.
          </p>
        </form>
      </div>
    </div>
  );
}
