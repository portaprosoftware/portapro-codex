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
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    sourcemap: false,
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI framework (Radix)
          'ui-primitives': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
          
          // Auth
          'clerk': ['@clerk/clerk-react'],
          
          // Data & Query
          'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
          
          // Note: PDF, maps, charts are dynamically imported - no manual chunk needed
        },
      },
    },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', '@clerk/clerk-react'],
    exclude: [
      // Heavy libraries that MUST be dynamically imported
      'jspdf',
      'jspdf-autotable',
      'html2canvas',
      'mapbox-gl',
      'recharts',
    ],
  },

  dedupe: ['react', 'react-dom'],
}));
