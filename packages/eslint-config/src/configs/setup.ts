import { globalIgnores } from 'eslint/config';
import globals from 'globals';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the setup layer of the shared ESLint flat config.
 *
 * Declares the global ignore patterns first and then the shared language
 * options: ECMAScript 2022, browser, Node, and ES2021 globals, and the module
 * parser configuration.
 *
 * @returns The ESLint configuration for the setup layer.
 */
export function setup() {
  return [
    globalIgnores([
      '**/.git',
      '**/.vscode',
      '**/coverage',
      '**/dist',
      '**/node_modules',
      '**/pnpm-lock.*',
      '**/rules.ts',
    ], 'ignores'),
    {
      languageOptions: {
        ecmaVersion: 2022,
        globals: {
          ...globals.browser,
          ...globals.es2021,
          ...globals.node,
          document: 'readonly',
          navigator: 'readonly',
          window: 'readonly',
        },
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
          ecmaVersion: 2022,
          sourceType: 'module',
        },
        sourceType: 'module',
      },
      name: 'setup',
    },
  ] as EslintConfig[];
}
