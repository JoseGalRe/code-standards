import plugin from '@stylistic/eslint-plugin';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `style` layer of the shared ESLint flat config.
 *
 * Configures `@stylistic/eslint-plugin` as the style authority with 2-space
 * indentation, single quotes, semicolons, 1TBS braces, JSX spacing, and the
 * 128-column limit.
 *
 * @returns The ESLint configuration for the stylistic plugin.
 */
export function stylistic() {
  const config = plugin.configs.customize({
    indent: 2,
    jsx: true,
    pluginName: 'style',
    quoteProps: 'consistent',
    quotes: 'single',
    semi: true,
  });

  return {
    files: ['**/*.{ts,tsx,json}'],
    name: 'style',
    plugins: {
      style: plugin,
    },
    rules: {
      ...config.rules,
      'style/arrow-parens': ['error', 'always'],
      'style/brace-style': ['error', '1tbs'],
      'style/jsx-closing-bracket-location': ['error', {
        nonEmpty: 'after-props',
        selfClosing: 'tag-aligned',
      }],
      'style/jsx-newline': ['error'],
      'style/max-len': ['error', {
        code: 128,
        /**
         * Allow i18n strings in t function, to be longer than the max length.
         * This is useful for translations that may not fit within the max length.
         */
        ignorePattern: String.raw`t\(['"].*['"]\)|(^\s+|^\s+i18nKey=)['"].*['"]`,
        ignoreTemplateLiterals: true,
        tabWidth: 2,
      }],
      'style/member-delimiter-style': ['error', {
        multiline: {
          delimiter: 'semi',
        },
      }],
      'style/multiline-ternary': ['off'],
      'style/padding-line-between-statements': ['error', {
        blankLine: 'always',
        next: ['*'],
        prev: [
          'const',
          'for',
          'function',
          'if',
          'let',
          'multiline-const',
          'multiline-expression',
          'multiline-let',
          'switch',
          'try',
          'while',
        ],
      }, {
        blankLine: 'always',
        next: [
          'const',
          'for',
          'function',
          'if',
          'let',
          'multiline-const',
          'multiline-expression',
          'multiline-let',
          'switch',
          'try',
          'while',
        ],
        prev: ['*'],
      }, {
        blankLine: 'any',
        next: ['const', 'let'],
        prev: ['const', 'let'],
      }, {
        blankLine: 'always',
        next: ['return'],
        prev: ['*'],
      }],
    },
  } as EslintConfig;
}
