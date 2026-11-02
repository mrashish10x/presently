import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Presently - Attendance Management",
    short_name: "Presently",
    description: "Student attendance management for colleges.",
    start_url: "/auth-redirect",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#115e59",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
