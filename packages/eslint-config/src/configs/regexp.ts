import plugin from 'eslint-plugin-regexp';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `regexp` layer of the shared ESLint flat config.
 *
 * Applies the `eslint-plugin-regexp` flat recommended rules and promotes
 * `regexp/prefer-regexp-test`.
 *
 * @returns The ESLint configuration for the regexp plugin.
 */
export function regexp() {
  const eslintRegexp = plugin?.configs?.['flat/recommended'] || {};

  return {
    ...eslintRegexp,
    files: ['**/*.{ts,tsx}'],
    name: 'regexp',
    rules: {
      ...eslintRegexp?.rules,
      'regexp/prefer-regexp-test': ['error'],
    },
  } as EslintConfig;
}
