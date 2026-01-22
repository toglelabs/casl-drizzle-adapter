/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // Separate integration tests that use testcontainers
    include: process.env["INTEGRATION"]
      ? ["tests/integration/**/*.test.ts"]
      : ["tests/**/*.test.ts"],
    exclude: process.env["INTEGRATION"]
      ? ["tests/adapter.test.ts"]
      : ["tests/integration/**/*.test.ts"],
  },
});
