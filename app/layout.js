// ============================================================
// layout.js — estructura común: fuentes, barra lateral y datos
// ============================================================

import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Guardian from "@/components/Guardian";
import { DatosProvider } from "@/lib/datos";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Asociación Mezquita Bilal — Gestión",
  description: "Sistema de gestión: cuentas, cuotas, donaciones, inventario, limpieza y tareas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Fuentes del proyecto: Marcellus (títulos) e IBM Plex Sans (texto).
            Se cargan desde el navegador; si no hay conexión, se usan las de reserva. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Marcellus&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Sin sesión, el Guardián muestra el login y nada más se monta:
            ni la barra lateral, ni las páginas, ni la carga de datos. */}
        <AuthProvider>
          <Guardian>
            <DatosProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="mx-auto w-full max-w-[1060px] flex-1 px-4 pb-16 pt-6 md:px-8">
                  {children}
                </main>
              </div>
            </DatosProvider>
          </Guardian>
        </AuthProvider>
      </body>
    </html>
  );
}
