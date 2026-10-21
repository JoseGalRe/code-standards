import plugin from 'eslint-plugin-yml';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `yml` layer of the shared ESLint flat config.
 *
 * Applies the `eslint-plugin-yml` flat standard rules, requires single quotes
 * and sorted keys, and ignores pipeline and Docker Compose files.
 *
 * @returns The ESLint configuration for YAML files.
 */
export function yml() {
  const [plugins, config, linter] = plugin?.configs?.['flat/standard'] || [];

  return {
    ...config,
    ...plugins,
    ignores: [
      '**/azure-pipelines.yml',
      '**/docker-compose.yml',
    ],
    name: 'yml',
    rules: {
      ...config?.rules,
      ...linter?.rules,
      'yml/quotes': ['error', {
        avoidEscape: true,
        prefer: 'single',
      }],
      'yml/sort-keys': ['error', {
        order: {
          type: 'asc',
        },
        pathPattern: '.*',
      }],
    },
  } as EslintConfig;
}
