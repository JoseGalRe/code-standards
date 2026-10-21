import plugin from 'eslint-plugin-jsonc';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `jsonc` layer of the shared ESLint flat config.
 *
 * Applies the `eslint-plugin-jsonc` recommended JSON rules plus formatting
 * rules, and returns a second entry that allows comments in `tsconfig.json`
 * and `tsconfig.*.json` files.
 *
 * @returns The ESLint configuration for JSONC files.
 */
export function jsonc() {
  const [plugins, config, linter] = plugin.configs['flat/recommended-with-json'] || [];

  return [
    {
      ...config,
      ...plugins,
      name: 'jsonc',
      rules: {
        ...config?.rules,
        ...linter?.rules,
        'jsonc/array-bracket-spacing': ['error', 'never'],
        'jsonc/comma-style': ['error', 'last'],
        'jsonc/indent': ['error', 2],
        'jsonc/key-spacing': ['error', {
          afterColon: true,
          beforeColon: false,
        }],
        'jsonc/object-curly-newline': ['error', {
          consistent: true,
          multiline: true,
        }],
        'jsonc/object-curly-spacing': ['error', 'always'],
        'jsonc/object-property-newline': ['error', {
          allowMultiplePropertiesPerLine: true,
        }],
      },
    },
    {
      files: [
        '**/tsconfig.json',
        '**/tsconfig.*.json',
      ],
      name: 'jsonc/tsconfig',
      rules: {
        'jsonc/no-comments': ['off'],
      },
    },
  ] as EslintConfig[];
}
