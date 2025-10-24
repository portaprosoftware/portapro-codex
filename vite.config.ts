import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // PWA temporarily disabled until proper icons are added to /public
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.png', 'apple-touch-icon.png', 'robots.txt'],
    //   manifest: {
    //     name: 'PortaPro Software',
    //     short_name: 'PortaPro',
    //     description: 'Powering Portable Sanitation',
    //     theme_color: '#ffffff',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     scope: '/',
    //     start_url: '/',
    //     icons: []
    //   }
    // })
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  dedupe: ["react", "react-dom"],

  optimizeDeps: {
    include: ["react", "react-dom"],
  },
}));
