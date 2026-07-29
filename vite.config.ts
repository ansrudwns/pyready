import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/pyready/",
  plugins: [react()],
  build: {
    outDir: "dist",
  },
});
