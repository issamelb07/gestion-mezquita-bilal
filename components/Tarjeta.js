import Khatam from "@/components/Khatam";

// Tarjeta blanca con título opcional (bloque básico de todas las páginas)
export default function Tarjeta({ titulo, brass = false, className = "", children }) {
  return (
    <section className={"tarjeta " + (brass ? "banda-brass " : "") + className}>
      {titulo && (
        <h3 className="titulo-tarjeta">
          <Khatam size={12} color={brass ? "#97741B" : "#C9A227"} /> {titulo}
        </h3>
      )}
      {children}
    </section>
  );
}
