"use client";

// ============================================================
// calculos.js — todos los números del sistema en un solo sitio
// (saldos, cuotas, deuda, series para los gráficos)
// ============================================================

import { useMemo } from "react";
import { MESES_CORTO, mesDe, anioDe } from "@/lib/util";

export function useCalculos(datos) {
  return useMemo(() => {
    const { config, movimientos, socios } = datos;
    const anio = Number(config.anio);

    const delAnio = movimientos.filter((m) => anioDe(m.fecha) === anio);
    const ing = delAnio.filter((m) => m.tipo === "Ingreso");
    const gas = delAnio.filter((m) => m.tipo === "Gasto");
    const suma = (arr) => arr.reduce((s, m) => s + Number(m.importe || 0), 0);

    // Saldo total histórico (los traspasos no lo alteran)
    const saldoTotal =
      Number(config.saldoIniCaja) + Number(config.saldoIniBanco) +
      suma(movimientos.filter((m) => m.tipo === "Ingreso")) -
      suma(movimientos.filter((m) => m.tipo === "Gasto"));

    // Saldo por cuenta: un traspaso sale de una cuenta y entra en la otra
    const netoCuenta = (cuenta) =>
      suma(movimientos.filter((m) => m.tipo === "Ingreso" && m.pago === cuenta)) -
      suma(movimientos.filter((m) => m.tipo === "Gasto" && m.pago === cuenta)) -
      suma(movimientos.filter((m) => m.tipo === "Traspaso" && m.origen === cuenta)) +
      suma(movimientos.filter((m) => m.tipo === "Traspaso" && m.destino === cuenta));
    const saldoCaja = Number(config.saldoIniCaja) + netoCuenta("Caja");
    const saldoBanco = Number(config.saldoIniBanco) + netoCuenta("Banco");

    // Serie mensual para el gráfico del panel
    const porMes = Array.from({ length: 12 }, (_, i) => ({
      mes: MESES_CORTO[i],
      Ingresos: suma(ing.filter((m) => mesDe(m.fecha) === i + 1)),
      Gastos: suma(gas.filter((m) => mesDe(m.fecha) === i + 1)),
    }));

    // Meses que ya han pasado del año activo (para calcular deuda de cuotas)
    const ahora = new Date();
    const mesesTranscurridos =
      anio < ahora.getFullYear() ? 12 : anio > ahora.getFullYear() ? 0 : ahora.getMonth() + 1;

    const activos = socios.filter((s) => s.estado === "Activo");

    // Estado de cuotas de cada socio
    const cuotasPorSocio = socios.map((s) => {
      const pagos = new Set(
        delAnio
          .filter((m) => m.categoria === "Cuota de socio" && m.socioId === s.id)
          .map((m) => mesDe(m.fecha))
      );
      const pagadas = pagos.size;
      const pendientes = s.estado === "Activo" ? Math.max(0, mesesTranscurridos - pagadas) : 0;
      return {
        socio: s,
        pagos,
        pagadas,
        pendientes,
        deuda: pendientes * Number(s.cuota || config.cuotaMes),
      };
    });
    const deudaTotal = cuotasPorSocio.reduce((s, c) => s + c.deuda, 0);

    return {
      anio, delAnio, ing, gas, suma,
      saldoTotal, saldoCaja, saldoBanco,
      porMes, mesesTranscurridos, activos, cuotasPorSocio, deudaTotal,
    };
  }, [datos]);
}
