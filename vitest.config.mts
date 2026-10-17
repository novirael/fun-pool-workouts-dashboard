import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The family lives in Poland: run date logic in the same zone (worker processes inherit it).
process.env.TZ = 'Europe/Warsaw';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${root}/` },
      // `server-only` throws outside the React server bundler; it's a no-op in tests.
      { find: /^server-only$/, replacement: `${root}/tests/server-only.ts` },
    ],
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
    testTimeout: 20_000,
  },
});
