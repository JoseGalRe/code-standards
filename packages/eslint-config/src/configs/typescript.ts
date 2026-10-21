import plugin from '@typescript-eslint/eslint-plugin';

import type { EslintConfig } from '../types.ts';
import type { Linter } from 'eslint';

/**
 * Builds the `typescript` layer of the shared ESLint flat config.
 *
 * Extends the `@typescript-eslint` flat recommended entries with the
 * repository type-only import, naming, and shadowing rules, and disables rules
 * covered by the TypeScript compiler.
 *
 * @returns The ESLint configuration for the TypeScript rules.
 */
export function typescript() {
  const [base, config, linter] = (plugin?.configs?.['flat/recommended'] || []) as Linter.Config[];
  const parserOptions = base?.languageOptions?.parserOptions || {};

  return {
    ...base,
    files: config?.files,
    languageOptions: {
      ...base?.languageOptions,
      parserOptions: {
        ...parserOptions,
        // projectService: true,
        // warnOnUnsupportedTypeScriptVersion: false,
        // project: [
        //   './tsconfig.json',
        // ],
      },
    },
    name: 'typescript',
    rules: {
      ...config?.rules,
      ...linter?.rules,
      '@typescript-eslint/adjacent-overload-signatures': ['error'],
      '@typescript-eslint/ban-ts-comment': ['error', {
        'ts-expect-error': 'allow-with-description',
      }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        fixStyle: 'separate-type-imports',
        prefer: 'type-imports',
      }],
      // '@typescript-eslint/dot-notation': ['error'],
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/no-dupe-class-members': ['error'],
      '@typescript-eslint/no-empty-object-type': ['error', {
        allowInterfaces: 'always',
      }],
      // '@typescript-eslint/no-floating-promises': ['error'],
      // '@typescript-eslint/no-for-in-array': ['error'],
      // '@typescript-eslint/no-implied-eval': ['error'],
      '@typescript-eslint/no-import-type-side-effects': ['error'],
      // '@typescript-eslint/no-misused-promises': ['error'],
      '@typescript-eslint/no-namespace': ['error', {
        allowDeclarations: true,
      }],
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': ['error'],
      // '@typescript-eslint/no-unsafe-argument': ['error'],
      // '@typescript-eslint/no-unsafe-assignment': ['error'],
      // '@typescript-eslint/no-unsafe-call': ['error'],
      // '@typescript-eslint/no-unsafe-member-access': ['error'],
      // '@typescript-eslint/no-unsafe-return': ['error'],
      '@typescript-eslint/no-redeclare': ['error', {
        builtinGlobals: false,
      }],
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/no-unused-expressions': ['error', {
        allowShortCircuit: true,
        allowTaggedTemplates: true,
        allowTernary: true,
      }],
      /**
       * The `@typescript-eslint/no-unused-vars` can be disabled because
       * typescript has `noUnusedLocals` and `noUnusedParameters` compiler options
       * which can be used to enforce the same rule.
       */
      '@typescript-eslint/no-unused-vars': ['off'],
      '@typescript-eslint/no-use-before-define': ['error', {
        classes: false,
        functions: false,
        typedefs: false,
        variables: true,
      }],
      // 'dot-notation': ['off'],
      // 'no-implied-eval': ['off'],
      'no-use-before-define': ['off'],
      // '@typescript-eslint/promise-function-async': ['error'],
      // '@typescript-eslint/restrict-plus-operands': ['error'],
      // '@typescript-eslint/restrict-template-expressions': ['error'],
      // '@typescript-eslint/return-await': ['error'],
      // '@typescript-eslint/strict-boolean-expressions': ['error'],
      // '@typescript-eslint/switch-exhaustiveness-check': ['error'],
      // '@typescript-eslint/unbound-method': ['error'],
    },
  } as EslintConfig;
}
