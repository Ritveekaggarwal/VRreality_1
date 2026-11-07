import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    // Tunnels give a phone HTTPS access to this dev server (see README).
    allowedHosts: [".trycloudflare.com", ".ngrok-free.app"],
    // The browser only ever calls its own origin, in dev and in production.
    // Nothing needs to change when your IP address does.
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
    },
  },
});
