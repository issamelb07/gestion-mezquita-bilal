/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // Paleta propia del proyecto (verde esmeralda, latón, arena)
      colors: {
        verde: { DEFAULT: "#14614B", oscuro: "#0B3A2D", suave: "#E3EEE9" },
        laton: { DEFAULT: "#C9A227", oscuro: "#97741B", palido: "#F6EED8" },
        arena: "#F3EFE3",
        barro: "#B4452F",
        tinta: "#22302A",
        linea: "#E3DCC8",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
