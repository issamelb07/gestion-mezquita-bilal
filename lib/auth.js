"use client";

// ============================================================
// auth.js — sesión de usuario con Supabase Auth
//
// Mantiene la sesión al día (incluso entre pestañas), y ofrece
// iniciarSesion() y cerrarSesion() con mensajes de error en
// castellano. Los usuarios los crea el administrador en el
// panel de Supabase: Authentication → Users → Add user.
// ============================================================

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";

const Ctx = createContext(null);

// Traducción de los errores más comunes de Supabase Auth
const traducirError = (mensaje) => {
  const m = (mensaje || "").toLowerCase();
  if (m.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (m.includes("email not confirmed")) return "El correo aún no está confirmado. Pide al administrador que lo confirme en Supabase.";
  if (m.includes("too many requests") || m.includes("rate limit")) return "Demasiados intentos. Espera un minuto y vuelve a probar.";
  if (m.includes("network") || m.includes("fetch")) return "No hay conexión con el servidor. Comprueba tu internet.";
  return "No se pudo iniciar sesión: " + mensaje;
};

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(undefined); // undefined = comprobando
  const [errorConfig, setErrorConfig] = useState(null);

  useEffect(() => {
    let suscripcion;
    try {
      const sb = getSupabase();
      // Sesión actual (persistida por Supabase en el navegador)
      sb.auth.getSession().then(({ data }) => setSesion(data.session ?? null));
      // Cambios de sesión: login, logout, renovación del token…
      const { data } = sb.auth.onAuthStateChange((_evento, s) => setSesion(s ?? null));
      suscripcion = data.subscription;
    } catch (e) {
      // Faltan las variables de entorno de Supabase
      setErrorConfig(e?.message || "Error de configuración.");
      setSesion(null);
    }
    return () => suscripcion?.unsubscribe();
  }, []);

  const iniciarSesion = useCallback(async (email, password) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw new Error(traducirError(error.message));
  }, []);

  const cerrarSesion = useCallback(async () => {
    await getSupabase().auth.signOut();
  }, []);

  return (
    <Ctx.Provider value={{ sesion, errorConfig, iniciarSesion, cerrarSesion }}>
      {children}
    </Ctx.Provider>
  );
}

/** Hook de sesión: { sesion, errorConfig, iniciarSesion, cerrarSesion } */
export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
