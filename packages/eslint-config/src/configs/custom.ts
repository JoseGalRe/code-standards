import { noDuplicateImports, noInlineTypeImports, noParamDestructuring } from '../rules/index.ts';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the layer of the shared ESLint flat config.
 *
 * Registers the local rules as the `custom` plugin and enables them with the
 * repository options.
 *
 * @returns The ESLint configuration for the custom rules.
 */
export function custom() {
  return {
    files: ['**/*.{ts,tsx}'],
    name: 'custom',
    plugins: {
      custom: {
        rules: {
          'no-duplicate-imports': noDuplicateImports,
          'no-inline-type-imports': noInlineTypeImports,
          'no-param-destructuring': noParamDestructuring,
        },
      },
    },
    rules: {
      'custom/no-duplicate-imports': ['error', {
        considerQueryString: true,
        ignoreDeclareModules: true,
        includeExports: true,
        preferInline: false,
      }],
      'custom/no-inline-type-imports': ['error'],
      'custom/no-param-destructuring': ['error', {
        autoIncrementDefaultPropName: true,
        ignoreArrowFunctions: true,
        ignoreCallbackExpressions: true,
      }],
    },
  } as EslintConfig;
}
