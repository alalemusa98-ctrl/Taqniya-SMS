import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DB_NAME: 'taqniya_sms_test',
      DATABASE_URL: 'mysql://root:12255@localhost:3306/taqniya_sms_test',
    },
  },
});
