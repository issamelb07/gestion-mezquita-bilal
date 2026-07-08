/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Las fuentes se cargan con <link> desde el navegador (ver app/layout.js).
  // Desactivamos la optimización en build para que compile igual de bien
  // con o sin conexión a Google Fonts.
  optimizeFonts: false,
};

export default nextConfig;
