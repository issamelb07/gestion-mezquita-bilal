// ============================================================
// GET /api/health — comprobación de que el servidor responde
// Útil para monitorizar el despliegue en Vercel.
// ============================================================

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    servicio: "gestion-mezquita-bilal",
    version: "1.0.0",
    fecha: new Date().toISOString(),
  });
}
