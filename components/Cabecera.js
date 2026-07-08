// Cabecera de cada página: miga de pan pequeña + título grande
export default function Cabecera({ miga, titulo, ocultarAlImprimir = false }) {
  return (
    <header className={"mb-4 " + (ocultarAlImprimir ? "no-print" : "")}>
      <p className="cabecera-miga">{miga}</p>
      <h2 className="cabecera-titulo">{titulo}</h2>
    </header>
  );
}
