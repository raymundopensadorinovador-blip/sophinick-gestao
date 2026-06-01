import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Soph & Nick Gestão",
    short_name: "Soph & Nick",
    description:
      "Gestão de atendimentos, clientes, serviços, financeiro e criações autorais do Soph & Nick Atelier.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F4EADF",
    theme_color: "#7D3F46",
    orientation: "portrait",
    icons: [
      {
        src: "/logo-sophinick.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-sophinick.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-sophinick.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}