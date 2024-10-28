import { defineConfig } from 'astro/config';
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";
import tailwind from "@astrojs/tailwind";
import svelte from "@astrojs/svelte";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: process.env.USE_NODE === "true" ? node({
    mode: "standalone"
  }) : cloudflare({
    runtime: {
      mode: "local"
    }
  }),
  integrations: [tailwind(), svelte()],
  vite: {
    optimizeDeps: {
      exclude: ["oslo"]
    },
    define: {
      "process.env.TURSO_DB_URL": JSON.stringify(process.env.TURSO_DB_URL),
      "process.env.TURSO_DB_AUTH_TOKEN": JSON.stringify(process.env.TURSO_DB_AUTH_TOKEN),
      "process.env.SSE_AUTH_TOKEN": JSON.stringify(process.env.SSE_AUTH_TOKEN),
      "process.env.USE_NODE": JSON.stringify(process.env.USE_NODE),
    }
  }
});