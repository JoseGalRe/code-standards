import { defineConfig } from 'vite-plus';

const exclude = ['**/node_modules/**', '**/build/**', '**/dist/**', '**/.{git,cache,output,temp}/**'];

export default defineConfig({
  pack: {
    clean: true,
    deps: {
      neverBundle: true,
    },
    dts: {
      sourcemap: false,
    },
    entry: {
      'configs/*': ['src/configs/*.ts', '!src/configs/index.ts', '!src/configs/*{.,-}test.ts'],
      'core': 'src/core.ts',
      'index': 'src/index.ts',
    },
    fixedExtension: false,
    format: ['esm'],
    inputOptions: {
      experimental: {
        attachDebugInfo: 'none',
      },
    },
    platform: 'node',
    root: 'src',
    sourcemap: false,
    target: 'node24',
    unbundle: true,
  },
  test: {
    coverage: {
      exclude: [...exclude, '**/{*-test,*-types,index}.{js,ts,jsx,tsx}', '**/*.json'],
      thresholds: {
        'src/rules/no-*/no-*.ts': {
          branches: 100,
          functions: 100,
          lines: 100,
          perFile: true,
          statements: 100,
        },
      },
    },
    environment: 'node',
    globals: true,
    include: ['src/**/*{.,-}test.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
