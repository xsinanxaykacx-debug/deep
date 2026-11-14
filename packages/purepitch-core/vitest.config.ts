import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Do not let Vite walk up into the FM27 root package.json (which has a UTF-8 BOM).
  // This isolated package has no PostCSS pipeline.
  css: { postcss: { plugins: [] } },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    clearMocks: true
  }
});
