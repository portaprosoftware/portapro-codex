import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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

      // ✅ This ensures ANY import from '@/integrations/supabase/client'
      // resolves to your env-based client instead.
      "@/integrations/supabase/client":
        path.resolve(__dirname, "./src/lib/supabaseClient.ts"),
    },
  },

  dedupe: ["react", "react-dom"],

  optimizeDeps: {
    include: ["react", "react-dom"],
  },
}));
