// ============================================================
// GET /api/demo — devuelve un juego de datos de ejemplo
// Lo usa el botón "Cargar datos de ejemplo" de Ajustes para
// que cualquiera pueda probar la aplicación llena de datos.
// ============================================================

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const anio = new Date().getFullYear();
    const f = (mes, dia) => `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    // La base de datos exige UUIDs: los generamos en el servidor
    const u = () => crypto.randomUUID();
    const s1 = u(), s2 = u(), s3 = u(), s4 = u();

    const socios = [
      { id: s1, codigo: "S001", nombre: "Ahmed El Amrani", dni: "12345678Z", telefono: "600 111 222", email: "ahmed@example.com", direccion: "Calle Feria, 12", ciudad: "Sevilla", codigoPostal: "41003", fechaNacimiento: "1975-04-12", alta: `${anio - 1}-01-10`, fechaBaja: "", cargo: "Presidente", cuota: 10, estado: "Activo", notas: "" },
      { id: s2, codigo: "S002", nombre: "Youssef Benali", dni: "87654321X", telefono: "600 333 444", email: "youssef@example.com", direccion: "Av. de la Paz, 4", ciudad: "Sevilla", codigoPostal: "41013", fechaNacimiento: "1982-09-03", alta: `${anio - 1}-02-15`, fechaBaja: "", cargo: "Tesorero", cuota: 10, estado: "Activo", notas: "" },
      { id: s3, codigo: "S003", nombre: "Karim Ziani", dni: "X1234567L", telefono: "600 555 666", email: "", direccion: "Calle Sol, 8", ciudad: "Sevilla", codigoPostal: "41002", fechaNacimiento: "1990-01-25", alta: `${anio - 1}-03-01`, fechaBaja: "", cargo: "Socio", cuota: 10, estado: "Activo", notas: "" },
      { id: s4, codigo: "S004", nombre: "Mohamed Tazi", dni: "11111111H", telefono: "600 777 888", email: "", direccion: "", ciudad: "Sevilla", codigoPostal: "", fechaNacimiento: "", alta: f(1, 20), fechaBaja: "", cargo: "Socio", cuota: 10, estado: "Activo", notas: "" },
    ];

    const movimientos = [
      // Cuotas de enero y febrero
      { id: u(), fecha: f(1, 5), tipo: "Ingreso", categoria: "Cuota de socio", concepto: "Cuota de enero", socioId: s1, importe: 10, pago: "Caja", responsable: "Tesorero", notas: "Ejemplo" },
      { id: u(), fecha: f(1, 5), tipo: "Ingreso", categoria: "Cuota de socio", concepto: "Cuota de enero", socioId: s2, importe: 10, pago: "Caja", responsable: "Tesorero", notas: "Ejemplo" },
      { id: u(), fecha: f(2, 3), tipo: "Ingreso", categoria: "Cuota de socio", concepto: "Cuota de febrero", socioId: s1, importe: 10, pago: "Banco", responsable: "Tesorero", notas: "Ejemplo" },
      // Donaciones de viernes (primer viernes de cada mes aproximado)
      { id: u(), fecha: f(1, 2), tipo: "Ingreso", categoria: "Donación viernes", concepto: "Colecta del viernes", socioId: "", importe: 85, pago: "Caja", responsable: "Tesorero", notas: "Ejemplo" },
      { id: u(), fecha: f(2, 6), tipo: "Ingreso", categoria: "Donación viernes", concepto: "Colecta del viernes", socioId: "", importe: 110, pago: "Caja", responsable: "Tesorero", notas: "Ejemplo" },
      { id: u(), fecha: f(3, 6), tipo: "Ingreso", categoria: "Donación viernes", concepto: "Colecta del viernes", socioId: "", importe: 95, pago: "Caja", responsable: "Tesorero", notas: "Ejemplo" },
      // Gastos
      { id: u(), fecha: f(1, 10), tipo: "Gasto", categoria: "Alquiler", concepto: "Alquiler del local", socioId: "", importe: 400, pago: "Banco", responsable: "Presidente", notas: "Ejemplo" },
      { id: u(), fecha: f(1, 15), tipo: "Gasto", categoria: "Electricidad", concepto: "Factura de la luz", socioId: "", importe: 60, pago: "Banco", responsable: "Tesorero", notas: "Ejemplo" },
      { id: u(), fecha: f(2, 12), tipo: "Gasto", categoria: "Productos de limpieza", concepto: "Lejía y jabón", socioId: "", importe: 35, pago: "Caja", responsable: "Encargado", notas: "Ejemplo" },
      // Donativo puntual y traspaso de la caja al banco
      { id: u(), fecha: f(3, 15), tipo: "Ingreso", categoria: "Donativo puntual", concepto: "Donativo de una familia", socioId: "", importe: 200, pago: "Caja", responsable: "Presidente", notas: "Ejemplo" },
      { id: u(), fecha: f(3, 17), tipo: "Traspaso", origen: "Caja", destino: "Banco", categoria: "Traspaso interno", concepto: "Ingreso de la colecta en el banco", socioId: "", importe: 250, pago: "", responsable: "", notas: "Ejemplo" },
    ];

    const inventario = [
      { id: u(), articulo: "Alfombras de oración", categoria: "Sala", cantidad: 20, minimo: 5, ubicacion: "Sala de oración", revision: f(3, 1) },
      { id: u(), articulo: "Coranes", categoria: "Biblioteca", cantidad: 30, minimo: 10, ubicacion: "Estantería de la entrada", revision: f(3, 1) },
      { id: u(), articulo: "Jabón para wudú", categoria: "Limpieza", cantidad: 1, minimo: 4, ubicacion: "Aseos", revision: f(3, 1) },
    ];

    const limpieza = [
      { id: u(), semana: f(3, 2), zona: "Sala de oración", responsable: "Hassan", estado: "Hecho", obs: "" },
      { id: u(), semana: f(3, 9), zona: "Aseos / Wudú", responsable: "Karim", estado: "Pendiente", obs: "" },
    ];

    const tareas = [
      { id: u(), tarea: "Revisar el contrato de alquiler", responsable: "Presidente", prioridad: "Alta", fechaLimite: f(2, 15), estado: "Pendiente", notas: "" },
      { id: u(), tarea: "Organizar clases de fin de semana", responsable: "Secretario", prioridad: "Media", fechaLimite: f(6, 20), estado: "En curso", notas: "" },
    ];

    return NextResponse.json({
      config: { anio, saldoIniCaja: 500, saldoIniBanco: 2000 },
      movimientos, socios, inventario, limpieza, tareas,
    });
  } catch (e) {
    // Manejo de errores del servidor: nunca devolvemos un error sin formato
    return NextResponse.json(
      { ok: false, error: "No se pudieron generar los datos de ejemplo." },
      { status: 500 }
    );
  }
}
