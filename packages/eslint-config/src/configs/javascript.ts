import plugin from '@eslint/js';

import type { EslintConfig } from '../types.ts';

const { NODE_ENV = 'production' } = process.env;

const isProduction = NODE_ENV === 'production';

/**
 * Builds the `javascript` layer of the shared ESLint flat config.
 *
 * Applies the core `@eslint/js` recommended rules plus curated best practices.
 * `no-console` is an error in production and a warning otherwise, and rules
 * covered by a more specific layer are disabled here.
 *
 * @returns The ESLint configuration for JavaScript files.
 */
export function javascript() {
  return {
    files: ['**/*.{ts,tsx}'],
    name: 'javascript',
    plugins: {
      js: plugin,
    },
    rules: {
      ...plugin.configs.recommended.rules,
      'accessor-pairs': ['error', {
        enforceForClassMembers: true,
        setWithoutGet: true,
      }],
      'array-callback-return': ['error'],
      'block-scoped-var': ['error'],
      'curly': ['error', 'all'],
      'default-case-last': ['error'],
      'dot-notation': ['error', {
        allowKeywords: true,
      }],
      'eqeqeq': ['error'],
      'new-cap': ['error', {
        capIsNew: false,
        newIsCap: true,
        properties: true,
      }],
      'no-alert': ['error'],
      'no-caller': ['error'],
      'no-console': [isProduction ? 'error' : 'warn'],
      /**
       * The `no-duplicate-imports` rule is disabled because
       * our `custom/no-duplicates` rule provides better support for detecting duplicate imports.
       */
      'no-duplicate-imports': ['off'],
      'no-empty': ['error', {
        allowEmptyCatch: true,
      }],
      /**
       * The `no-empty-character-class` can be disabled because
       * the `regexp/no-empty-character-class` rule provides better support for linting regular expressions.
       */
      'no-empty-character-class': ['off'],
      'no-eval': ['error'],
      'no-extend-native': ['error'],
      'no-extra-bind': ['error'],
      'no-implied-eval': ['error'],
      /**
       * The `no-invalid-regexp` can be disabled because
       * the `regexp/no-invalid-regexp` rule provides better support for linting regular expressions.
       */
      'no-invalid-regexp': ['off'],
      'no-iterator': ['error'],
      'no-lone-blocks': ['error'],
      'no-multi-str': ['error'],
      'no-new': ['error'],
      'no-new-func': ['error'],
      'no-octal-escape': ['error'],
      'no-proto': ['error'],
      'no-self-compare': ['error'],
      'no-sequences': ['error'],
      'no-template-curly-in-string': ['error'],
      'no-throw-literal': ['error'],
      'no-undef-init': ['error'],
      'no-unmodified-loop-condition': ['error'],
      'no-unneeded-ternary': ['error', {
        defaultAssignment: false,
      }],
      'no-unreachable-loop': ['error'],
      'no-unused-expressions': ['error', {
        allowShortCircuit: true,
        allowTernary: true,
        enforceForJSX: false,
      }],
      /**
       * The `no-unused-vars` can be disabled because
       * typescript has `noUnusedLocals` and `noUnusedParameters` compiler options
       * which can be used to enforce the same rule.
       */
      'no-unused-vars': ['off'],
      /**
       * The `no-useless-backreference` can be disabled because
       * the `regexp/no-useless-backreference` rule provides better support for linting regular expressions.
       */
      'no-useless-backreference': ['off'],
      'no-useless-call': ['error'],
      'no-useless-computed-key': ['error'],
      'no-useless-constructor': ['error'],
      'no-useless-rename': ['error'],
      'no-useless-return': ['error'],
      'object-shorthand': ['error', 'always', {
        avoidQuotes: true,
        ignoreConstructors: false,
      }],
      'one-var': ['error', {
        initialized: 'never',
      }],
      'prefer-arrow-callback': ['error', {
        allowNamedFunctions: false,
        allowUnboundThis: true,
      }],
      'prefer-const': ['error', {
        destructuring: 'all',
        ignoreReadBeforeAssign: true,
      }],
      'prefer-exponentiation-operator': ['error'],
      'prefer-promise-reject-errors': ['error'],
      'prefer-regex-literals': ['error', {
        disallowRedundantWrapping: true,
      }],
      'prefer-rest-params': ['error'],
      'prefer-spread': ['error'],
      'prefer-template': ['error'],
      'require-await': ['error'],
      'symbol-description': ['error'],
      'unicode-bom': ['error', 'never'],
      'use-isnan': ['error', {
        enforceForIndexOf: true,
        enforceForSwitchCase: true,
      }],
      'valid-typeof': ['error', {
        requireStringLiterals: true,
      }],
      'yoda': ['error', 'never'],
    },
  } as EslintConfig;
}
