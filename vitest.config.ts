import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/lib/utils.ts",
        "src/lib/challenge-colors.ts",
        "src/lib/validations.ts",
        "src/lib/session.ts",
        "src/lib/dal.ts",
        "src/app/actions/auth.ts",
        "src/app/actions/checkin.ts",
        "src/app/actions/moderation.ts",
        "src/app/actions/profile.ts",
        "src/app/actions/social.ts",
        "src/app/actions/challenges.ts",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
