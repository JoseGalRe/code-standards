import plugin from 'eslint-plugin-unicorn';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `unicorn` layer of the shared ESLint flat config.
 *
 * Applies the `eslint-plugin-unicorn` recommended rules with documented
 * relaxations for loops, null usage, side effects, and naming conventions.
 *
 * @returns The ESLint configuration for the unicorn plugin.
 */
export function unicorn() {
  const { plugins, rules } = plugin?.configs?.recommended || {};

  return {
    files: ['**/*.{ts,tsx}'],
    name: 'unicorn',
    plugins,
    rules: {
      ...rules,
      /**
       * Keep the rule enabled with custom ignore patterns
       */
      'unicorn/consistent-boolean-name': ['error', {
        checkArguments: 'never',
        ignore: [
          'checked',
          'enabled',
          'open',
        ],
      }],
      /**
       * Allow up to five nested calls.
       * A limit of three is too restrictive for the functional composition
       * patterns commonly used in this codebase.
       */
      'unicorn/max-nested-calls': ['error', {
        max: 5,
      }],
      /**
       * Keep the rule enabled while allowing abbreviations that are widely
       * recognized and consistently used throughout the codebase.
       */
      'unicorn/name-replacements': ['error', {
        ignore: [
          'acc',
          /arg/i,
          /attr/i,
          /config/i,
          /ctx/i,
          /db/i,
          /def/i,
          /dev/i,
          /dir/i,
          /dist/i,
          /doc/i,
          /env/i,
          /fn/i,
          /lib/i,
          /num/i,
          /obj/i,
          /param/i,
          /pkg/i,
          /prev/i,
          /prod/i,
          /prop/i,
          /ref/i,
          /src/i,
          /util/i,
        ],
      }],
      /**
       * The `unicorn/no-abusive-eslint-disable` rule is disabled because
       * `@eslint-community/eslint-comments/no-unlimited-disable` covers the same unlimited directives.
       */
      'unicorn/no-abusive-eslint-disable': ['off'],
      /**
       * Allow `Array.prototype.reduce()` when it is the clearest way
       * to accumulate or transform collections into a single value.
       */
      'unicorn/no-array-reduce': ['off'],
      /**
       * Disable the rule that enforces asterisks at the beginning of documentation comments.
       * This project does not require a strict asterisk prefix style for JSDoc comments.
       */
      'unicorn/no-asterisk-prefix-in-documentation-comments': ['off'],
      /**
       * Allow `break` in nested loops.
       * Early exits are often simpler and more readable than introducing
       * additional state or control-flow indirection.
       */
      'unicorn/no-break-in-nested-loop': ['off'],
      /**
       * Allow classic `for` loops.
       * They remain the clearest choice for index-based iteration and some
       * performance-sensitive code paths.
       */
      'unicorn/no-for-loop': ['off'],
      /**
       * Allow `null` when it explicitly represents the intentional absence
       * of a value.
       */
      'unicorn/no-null': ['off'],
      /**
       * Allow explicit process termination in CLI entrypoints and other
       * Node.js programs where exit codes are part of the public behavior.
       */
      'unicorn/no-process-exit': ['off'],
      /**
       * Allow `this` outside classes.
       * Some supported patterns intentionally rely on non-class receivers.
       */
      'unicorn/no-this-outside-of-class': ['off'],
      /**
       * Allow assignments to top-level bindings from within functions.
       * This is occasionally useful for controlled initialization and module state.
       */
      'unicorn/no-top-level-assignment-in-function': ['off'],
      /**
       * Allow modules whose purpose is to perform initialization, registration,
       * or other intentional side effects when imported.
       */
      'unicorn/no-top-level-side-effects': ['off'],
      /**
       * Allow explicit `undefined` when it improves readability or communicates
       * intent more clearly than omission.
       */
      'unicorn/no-useless-undefined': ['off'],
      /**
       * Disabled because it conflicts with the preferred numeric API style
       * used throughout this project.
       */
      'unicorn/prefer-global-number-constants': ['off'],
      /**
       * Allow non-minimal ternaries when the expanded form improves readability
       * or works better with developer tooling.
       *
       * For example, some i18next expressions are not correctly recognized by
       * the VS Code extension when written as minimal ternaries.
       */
      'unicorn/prefer-minimal-ternary': ['off'],
      /**
       * The `unicorn/prefer-regexp-test` rule is disabled because
       * the `regexp/prefer-regexp-test` provides more comprehensive analysis.
       */
      'unicorn/prefer-regexp-test': ['off'],
      /**
       * Allow `atob()` and `btoa()` when they provide the simplest integration
       * with existing APIs or string-based Base64 workflows.
       */
      'unicorn/prefer-uint8array-base64': ['off'],
    },
  } as EslintConfig;
}
