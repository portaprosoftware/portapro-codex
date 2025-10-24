import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      
      // Prevent static imports of heavy libraries
      "no-restricted-imports": ["error", {
        "paths": [
          {
            "name": "jspdf",
            "message": "❌ Use loadPdfLibs() from @/lib/loaders/pdf instead"
          },
          {
            "name": "jspdf-autotable",
            "message": "❌ Use loadPdfLibs() from @/lib/loaders/pdf instead"
          },
          {
            "name": "html2canvas",
            "message": "❌ Use loadPdfLibs() from @/lib/loaders/pdf instead"
          },
          {
            "name": "mapbox-gl",
            "message": "❌ Use loadMapboxLibs() from @/lib/loaders/map instead"
          },
          {
            "name": "recharts",
            "message": "❌ Use loadChartsLibs() from @/lib/loaders/charts instead"
          }
        ]
      }]
    },
  }
);
