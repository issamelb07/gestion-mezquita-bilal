// Estrella de ocho puntas (jatam), el motivo geométrico de la marca
export default function Khatam({ size = 13, color = "#C9A227" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g fill={color}>
        <rect x="7" y="7" width="10" height="10" />
        <rect x="7" y="7" width="10" height="10" transform="rotate(45 12 12)" />
      </g>
    </svg>
  );
}
