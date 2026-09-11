import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  base: "/examples/",
  plugins: [react(), vue()],
  worker: { format: "es" },
});
