// Campo de formulario: etiqueta + control + mensaje de error opcional
export default function Campo({ etiqueta, error, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="etiqueta-campo">{etiqueta}</span>
      {children}
      {error && <em className="text-[11.5px] not-italic text-barro">{error}</em>}
    </label>
  );
}
