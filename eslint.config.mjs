import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["tests/**/*.mjs"],
    rules: {
      "no-unused-vars": "error",
    },
  },
]);
