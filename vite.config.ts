import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, isPreview }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    // Auto-registers server/middleware/* (the password gate) — only active
    // on build/preview, not plain `vite dev`. Local dev is trusted; the
    // gate matters for the deployed URL.
    ...(command === "build" || isPreview ? [nitro({ preset: "vercel", serverDir: "./server" })] : []),
    viteReact(),
  ],
}));
