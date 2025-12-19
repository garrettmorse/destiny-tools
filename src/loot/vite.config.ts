import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    base: process.env.NODE_ENV === "development" ? "" : "/loot",
    build: {
      outDir: "./dist/loot",
      emptyOutDir: true,
    },
    server: {
      port: process.env.NODE_ENV === "development" ? 5173 : 8080,
    },
    define:
      process.env.NODE_ENV === "development"
        ? {
            global: {
              BNET: "https://bungie.net",
              SERVICE_URL: "http://localhost:8080",
              BASE_PATH: "",
              CLIENT_ID: 51225,
            },
          }
        : {
            global: {
              BNET: "https://bungie.net",
              SERVICE_URL: "",
              BASE_PATH: "/loot",
              CLIENT_ID: 49718,
            },
          },
    plugins: [react(), tailwindcss(), basicSsl()],
  };
});
