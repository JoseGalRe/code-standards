import plugin from 'eslint-plugin-n';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `node` layer of the shared ESLint flat config.
 *
 * Applies the `eslint-plugin-n` flat recommended rules for TypeScript files
 * and disables rules covered by TypeScript or other layers.
 *
 * @returns The ESLint configuration for Node.js files.
 */
export function node() {
  const { plugins, rules } = plugin?.configs?.['flat/recommended'] || {};

  return {
    files: ['**/*.ts'],
    name: 'node',
    plugins,
    rules: {
      ...rules,
      'n/handle-callback-err': ['error', '^(err|error)$'],
      /**
       * The `n/no-exports-assign` rule is disabled because
       * `unicorn/prefer-module` rejects every global `exports` reference in the same TypeScript scope.
       */
      'n/no-exports-assign': ['off'],
      /**
       * The `n/no-extraneous-import` rule is disabled because
       * TypeScript automatically catches missing or undeclared dependencies during type-checking,
       * making this AST-based rule redundant and slow.
       */
      'n/no-extraneous-import': ['off'],
      'n/no-missing-import': ['error', {
        allowModules: ['fpm-database-entities-sdk', 'smart-suite-backend-utilities-sdk'],
        ignoreTypeImport: true,
        resolverConfig: {
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          mainFiles: ['index.ts', 'index.js', 'index.d.ts'],
          modules: ['./node_modules', './src'],
        },
      }],
      /**
       * The `n/no-new-require` rule is disabled because
       * `unicorn/prefer-module` rejects every global `require` reference, including `new require()`.
       */
      'n/no-new-require': ['off'],
      'n/no-path-concat': ['error'],
      /**
       * The `n/no-unpublished-import` rule is disabled because
       * this project does not follow a direct Node.js execution model.
       *
       * This rule produces false positives in such setups and is better enforced
       * at build or packaging time, not via ESLint.
       */
      'n/no-unpublished-import': ['off'],
      'n/no-unsupported-features/node-builtins': ['error', {
        allowExperimental: true,
      }],
      'n/process-exit-as-throw': ['error'],
    },
  } as EslintConfig;
}
