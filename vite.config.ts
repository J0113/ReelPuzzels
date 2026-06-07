import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static-site build: `vite build` emits a self-contained /dist.
// `base: "./"` keeps asset paths relative so it works under any subpath host
// (GitHub Pages project sites, S3 prefixes, etc.).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
