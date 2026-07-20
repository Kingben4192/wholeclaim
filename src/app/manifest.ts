import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WholeClaim — The Insurance Claim Workspace",
    short_name: "WholeClaim",
    description:
      "Every document. Every deadline. Every detail. Turn scattered claim evidence into an organized, deadline-tracked file.",
    start_url: "/claim",
    scope: "/",
    display: "standalone",
    background_color: "#F2F1EC",
    theme_color: "#1E4B3C",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
