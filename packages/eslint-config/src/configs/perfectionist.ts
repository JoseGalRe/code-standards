import plugin from 'eslint-plugin-perfectionist';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `perfectionist` layer of the shared ESLint flat config.
 *
 * Enables alphabetical sorting for named exports, named imports, and exports,
 * and configures import groups with the repository internal path patterns.
 *
 * @returns The ESLint configuration for the perfectionist plugin.
 */
export function perfectionist() {
  const { rules } = plugin?.configs['recommended-alphabetical'] || {};

  return {
    files: ['**/*.{ts,tsx}'],
    name: 'perfectionist',
    plugins: {
      perfectionist: plugin,
    },
    rules: {
      ...rules,
      'perfectionist/sort-exports': ['error', {
        order: 'asc',
        type: 'natural',
      }],
      'perfectionist/sort-imports': ['error', {
        customGroups: [
          {
            elementNamePattern: ['^react$'],
            groupName: 'react',
            selector: 'type',
          },
          {
            elementNamePattern: ['^react$'],
            groupName: 'react',
          },
        ],
        groups: [
          'builtin',
          'react',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'type',
        ],
        newlinesBetween: 1,
      }],
      'perfectionist/sort-interfaces': ['error', {
        groups: ['index-signature', 'unknown'],
        order: 'asc',
        type: 'natural',
      }],
      'perfectionist/sort-jsx-props': ['error', {
        order: 'asc',
        type: 'natural',
      }],
      /**
       * Disables sorting for modules.
       */
      'perfectionist/sort-modules': ['off'],
      'perfectionist/sort-named-exports': ['error', {
        order: 'asc',
        type: 'natural',
      }],
      'perfectionist/sort-named-imports': ['error', {
        order: 'asc',
        type: 'natural',
      }],
      'perfectionist/sort-object-types': ['error', {
        groups: ['index-signature', 'unknown'],
        order: 'asc',
        type: 'natural',
      }],
      'perfectionist/sort-objects': ['error', {
        order: 'asc',
        type: 'natural',
      }],
      'perfectionist/sort-union-types': ['error', {
        order: 'asc',
        type: 'natural',
      }],
    },
  } as EslintConfig;
}
