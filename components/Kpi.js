// Indicador pequeño: etiqueta arriba, número grande abajo
export default function Kpi({ titulo, valor, tono = "verde" }) {
  const color =
    tono === "rojo" ? "text-barro" : tono === "brass" ? "text-laton-oscuro" : "text-verde";
  return (
    <div className="kpi">
      <span className="mb-1 block text-[11.5px] text-[#6E7A72]">{titulo}</span>
      <strong className={"text-[19px] font-semibold tracking-tight " + color}>{valor}</strong>
    </div>
  );
}
