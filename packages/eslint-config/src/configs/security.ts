import plugin from 'eslint-plugin-security';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `security` layer of the shared ESLint flat config.
 *
 * Applies the `eslint-plugin-security` recommended rules and disables noisy or
 * duplicated detections.
 *
 * @returns The ESLint configuration for the security plugin.
 */
export function security() {
  return {
    files: ['**/*.{ts,tsx}'],
    name: 'security',
    plugins: {
      security: plugin,
    },
    rules: {
      ...plugin?.configs?.recommended?.rules,
      /**
       * The `security/detect-eval-with-expression` rule is disabled because
       * the eslint core `no-eval` rule rejects every direct `eval` call, not only non-literal arguments.
       */
      'security/detect-eval-with-expression': ['off'],
      /**
       * The `security/detect-new-buffer` rule is disabled because
       * `unicorn/no-new-buffer` rejects every `new Buffer` call, not only calls with non-literal arguments.
       */
      'security/detect-new-buffer': ['off'],
      /**
       * This rule is disabled because it can lead to false positives and is not always applicable in our codebase.
       * so, keep this rule disabled.
       *
       * @see https://github.com/eslint-community/eslint-plugin-security/issues/21
       */
      'security/detect-object-injection': ['off'],
    },
  } as EslintConfig;
}
