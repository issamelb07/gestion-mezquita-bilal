// ============================================================
// util.js — constantes y funciones de ayuda compartidas
// ============================================================

export const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
export const MESES_CORTO = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];

// Estas dos categorías las usa la lógica de cuotas y viernes: no se pueden borrar
export const CAT_ESPECIALES = ["Cuota de socio", "Donación viernes"];

export const DEFAULT_DATA = {
  config: {
    nombre: process.env.NEXT_PUBLIC_NOMBRE_ASOCIACION || "Asociación Mezquita Bilal",
    anio: new Date().getFullYear(),
    cuotaMes: 10,
    saldoIniCaja: 0,
    saldoIniBanco: 0,
    catIngreso: ["Cuota de socio", "Donación viernes", "Donativo puntual", "Evento/Campaña", "Otros ingresos"],
    catGasto: ["Alquiler", "Electricidad", "Agua", "Productos de limpieza", "Mantenimiento", "Personal/Imam", "Eventos", "Otros gastos"],
    zonas: ["Sala de oración", "Aseos / Wudú", "Entrada", "Cocina", "Sala de mujeres", "Exterior"],
  },
  movimientos: [],
  socios: [],
  inventario: [],
  limpieza: [],
  tareas: [],
  documentos: [],
};

/** Identificador único (UUID v4) para cada fila; la base de datos lo exige */
export const uid = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Reserva para navegadores muy antiguos: UUID v4 generado a mano
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

/** Formatea un número como euros: 1234.5 -> "1.234,50 €" */
export const eur = (n) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(n) || 0);

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' */
export const fFecha = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

/** Date -> 'YYYY-MM-DD' respetando la zona horaria local */
export const isoDe = (date) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
};

/** Fecha de hoy en formato ISO 'YYYY-MM-DD' */
export const hoyISO = () => isoDe(new Date());

export const mesDe = (iso) => Number(iso.slice(5, 7));
export const anioDe = (iso) => Number(iso.slice(0, 4));

/** Devuelve todos los viernes de un año como objetos Date */
export const viernesDelAnio = (anio) => {
  const out = [];
  const d = new Date(anio, 0, 1);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  while (d.getFullYear() === anio) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
};

/** Valida un DNI (12345678Z) o NIE (X1234567L) español comprobando la letra.
    Un valor vacío se considera válido (el dato puede llegar más tarde). */
export const validarDNI = (valor) => {
  if (!valor || !valor.trim()) return true;
  const s = valor.toUpperCase().replace(/[\s.-]/g, "");
  const m = s.match(/^([XYZ])?(\d{7,8})([A-Z])$/);
  if (!m) return false;
  const num = (m[1] ? { X: "0", Y: "1", Z: "2" }[m[1]] : "") + m[2];
  return "TRWAGMYFPDXBNJZSQVHLCKE"[Number(num) % 23] === m[3];
};

/** Años completos transcurridos desde una fecha ISO (antigüedad, edad) */
export const aniosDesde = (iso) => {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return null;
  const hoy = new Date();
  let a = hoy.getFullYear() - d.getFullYear();
  if (hoy.getMonth() < d.getMonth() || (hoy.getMonth() === d.getMonth() && hoy.getDate() < d.getDate())) a--;
  return a;
};

/** Cargos posibles dentro de la asociación */
export const CARGOS = ["Socio", "Presidente", "Vicepresidente", "Secretario", "Tesorero", "Vocal", "Imam"];

/** Categorías disponibles para los documentos de la asociación */
export const CATEGORIAS_DOC = ["Acta", "Estatutos", "Seguro", "Factura", "Contrato", "Certificado", "Subvención", "Correspondencia", "Otro"];

/** Tamaño de archivo legible: 1536 -> "1,5 KB" */
export const fmtTamano = (bytes) => {
  const n = Number(bytes) || 0;
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toLocaleString("es-ES", { maximumFractionDigits: 1 }) + " KB";
  return (n / (1024 * 1024)).toLocaleString("es-ES", { maximumFractionDigits: 1 }) + " MB";
};
