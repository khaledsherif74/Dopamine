import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const api = env.VITE_API_BASE_URL || "http://localhost:5000";

  return {
    base: "/admin/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": { target: api, changeOrigin: true },
        "/uploads": { target: api, changeOrigin: true },
        "/socket.io": { target: api, changeOrigin: true, ws: true },
      },
    },
  };
});
