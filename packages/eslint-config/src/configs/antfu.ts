import plugin from 'eslint-plugin-antfu';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `antfu` layer of the shared ESLint flat config.
 *
 * Enables the `eslint-plugin-antfu` chaining and list-newline rules for
 * TypeScript and TSX files.
 *
 * @returns The ESLint configuration for Antfu rules.
 */
export function antfu() {
  return {
    files: ['**/*.{ts,tsx}'],
    name: 'antfu',
    plugins: {
      antfu: plugin,
    },
    rules: {
      'antfu/consistent-chaining': ['error'],
      'antfu/consistent-list-newline': ['error', {
        JSXOpeningElement: false,
      }],
    },
  } as EslintConfig;
}
