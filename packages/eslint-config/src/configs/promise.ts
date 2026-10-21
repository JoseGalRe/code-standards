import plugin from 'eslint-plugin-promise';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `promise` layer of the shared ESLint flat config.
 *
 * Applies the `eslint-plugin-promise` flat recommended rules for TypeScript
 * and TSX files.
 *
 * @returns The ESLint configuration for the promise plugin.
 */
export function promise() {
  const recommended = plugin?.configs?.['flat/recommended'] || {};

  return {
    files: ['**/*.{ts,tsx}'],
    name: 'promise',
    plugins: {
      ...recommended.plugins,
    },
    rules: {
      ...recommended?.rules,
    },
  } as EslintConfig;
}
