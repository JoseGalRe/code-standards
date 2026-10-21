import plugin from 'eslint-plugin-sonarjs';

import type { EslintConfig } from '../types.ts';
import type { Linter } from 'eslint';

/**
 * Disables SonarJS rules that target server-side/backend concerns
 * (SQL injection, XXE, cookie/session security, TLS/cipher strength,
 * CSRF, hardcoded secrets, file-system permissions, HTTP security
 * headers, etc.).
 *
 * These rules assume a Node.js/server runtime and produce false
 * positives and are expensive to compute in a frontend/browser context,
 * so they are disabled.
 */
const disabledBackendRules: Linter.RulesConfig = {
  'sonarjs/content-length': ['off'],
  'sonarjs/content-security-policy': ['off'],
  'sonarjs/cookie-no-httponly': ['off'],
  'sonarjs/cors': ['off'],
  'sonarjs/csrf': ['off'],
  'sonarjs/disabled-auto-escaping': ['off'],
  'sonarjs/encryption-secure-mode': ['off'],
  'sonarjs/hardcoded-secret-signatures': ['off'],
  'sonarjs/hashing': ['off'],
  'sonarjs/insecure-cookie': ['off'],
  'sonarjs/insecure-jwt-token': ['off'],
  'sonarjs/no-clear-text-protocols': ['off'],
  'sonarjs/no-hardcoded-ip': ['off'],
  'sonarjs/no-hardcoded-passwords': ['off'],
  'sonarjs/no-hardcoded-secrets': ['off'],
  'sonarjs/no-internal-api-use': ['off'],
  'sonarjs/no-mime-sniff': ['off'],
  'sonarjs/no-os-command-from-path': ['off'],
  'sonarjs/no-referrer-policy': ['off'],
  'sonarjs/no-session-cookies-on-static-assets': ['off'],
  'sonarjs/no-weak-cipher': ['off'],
  'sonarjs/production-debug': ['off'],
  'sonarjs/pseudo-random': ['off'],
  'sonarjs/publicly-writable-directories': ['off'],
  'sonarjs/session-regeneration': ['off'],
  'sonarjs/sql-queries': ['off'],
  'sonarjs/strict-transport-security': ['off'],
  'sonarjs/unverified-certificate': ['off'],
  'sonarjs/unverified-hostname': ['off'],
  'sonarjs/weak-ssl': ['off'],
  'sonarjs/x-powered-by': ['off'],
  'sonarjs/xml-parser-xxe': ['off'],
};

/**
 * Builds the `sonarjs` layer of the shared ESLint flat config.
 *
 * Applies the `eslint-plugin-sonarjs` recommended rules and disables rules
 * that target backend runtimes, AWS, or other layers with better coverage.
 *
 * @returns The ESLint configuration for the sonarjs plugin.
 */
export function sonar() {
  const disabledAwsRules = {} as Record<string, string[]>;

  const { rules } = (plugin?.configs?.recommended || {}) as EslintConfig;
  const ruleKeys = Object.keys(rules || {});

  for (const rule of ruleKeys) {
    if (rule.startsWith('sonarjs/aws-')) {
      disabledAwsRules[rule] = ['off'];
    }
  }

  return {
    files: ['**/*.{ts,tsx}'],
    name: 'sonarjs',
    plugins: {
      sonarjs: plugin,
    },
    rules: {
      ...rules,
      /**
       * The `sonarjs/block-scoped-var` rule is disabled because
       * the eslint core `block-scoped-var` rule provides better support for block scoping.
       */
      'sonarjs/block-scoped-var': ['off'],
      'sonarjs/cognitive-complexity': ['error', 64],
      /**
       * The `sonarjs/concise-regex` rule is disabled because
       * the `eslint-plugin-regexp` jointly cover its character-class, shorthand, quantifier, and flag simplifications.
       */
      'sonarjs/concise-regex': ['off'],
      /**
       * The `sonarjs/constructor-for-side-effects` rule is disabled because
       * the eslint core `no-new` rule rejects every unused `new` expression.
       */
      'sonarjs/constructor-for-side-effects': ['off'],
      /**
       * The `sonarjs/duplicates-in-character-class` rule is disabled because
       * `regexp/no-dupe-characters-character-class` provides equivalent regex-specific detection.
       */
      'sonarjs/duplicates-in-character-class': ['off'],
      /**
       * The `sonarjs/generator-without-yield` rule is disabled because
       * the eslint core `require-yield` rule provides equivalent generator detection.
       */
      'sonarjs/generator-without-yield': ['off'],
      /**
       * The `sonarjs/no-control-regex` can be disabled because
       * the eslint core `no-control-regex` rule provides better support for linting regular expressions.
       */
      'sonarjs/no-control-regex': ['off'],
      /**
       * The `sonarjs/no-dead-store` rule is disabled because
       * the eslint core `no-useless-assignment` rule provides better support for detecting unused variables.
       */
      'sonarjs/no-dead-store': ['off'],
      /**
       * The `sonarjs/no-delete-var` rule is disabled because
       * the eslint core `no-delete-var` rule provides better support for variable deletion.
       */
      'sonarjs/no-delete-var': ['off'],
      /**
       * The `sonarjs/no-empty-character-class` can be disabled because
       * the `regexp/no-empty-character-class` rule provides better support for linting regular expressions.
       */
      'sonarjs/no-empty-character-class': ['off'],
      /**
       * The `sonarjs/no-empty-group` rule is disabled because
       * `regexp/no-empty-group` provides equivalent regex-specific detection.
       */
      'sonarjs/no-empty-group': ['off'],
      /**
       * The `sonarjs/no-fallthrough` rule is disabled because
       * the eslint core `no-fallthrough` rule provides better support for fallthrough cases.
       */
      'sonarjs/no-fallthrough': ['off'],
      /**
       * The `sonarjs/no-globals-shadowing` rule is disabled because
       * the `@typescript-eslint/no-shadow` rule provides better support for variable shadowing in TypeScript codebases.
       */
      'sonarjs/no-globals-shadowing': ['off'],
      /**
       * The `sonarjs/no-invalid-regexp` can be disabled because
       * the `regexp/no-invalid-regexp` rule provides better support for linting regular expressions.
       */
      'sonarjs/no-invalid-regexp': ['off'],
      /**
       * The `sonarjs/no-labels` can be disabled because
       * the eslint core `no-labels` rule provides better support for label usage.
       */
      'sonarjs/no-labels': ['off'],
      /**
       * The `sonarjs/no-misleading-character-class` rule is disabled because
       * `regexp/no-misleading-unicode-character` covers the same cases and quantified multi-code-point characters.
       */
      'sonarjs/no-misleading-character-class': ['off'],
      'sonarjs/no-nested-conditional': ['off'],
      'sonarjs/no-nested-functions': ['off'],
      /**
       * The `sonarjs/no-redundant-jump` rule is disabled because `no-useless-return`
       * and `unicorn/no-useless-continue` jointly cover its final bare `return` and `continue` cases.
       */
      'sonarjs/no-redundant-jump': ['off'],
      /**
       * The `sonarjs/no-regex-spaces` can be disabled because
       * the eslint core `no-regex-spaces` rule provides better support for linting regular expressions.
       */
      'sonarjs/no-regex-spaces': ['off'],
      /**
       * The `sonarjs/no-unenclosed-multiline-block` rule is disabled because
       * the eslint core `curly` rule requires braces for every control statement.
       */
      'sonarjs/no-unenclosed-multiline-block': ['off'],
      /**
       * The `sonarjs/no-unused-vars` can be disabled because
       * typescript has `noUnusedLocals` and `noUnusedParameters` compiler options
       * which can be used to enforce the same rule.
       */
      'sonarjs/no-unused-vars': ['off'],
      /**
       * The `sonarjs/no-same-line-conditional` rule is disabled because
       * the eslint core `no-unexpected-multiline` rule provides better support for same line conditionals.
       */
      'sonarjs/no-useless-catch': ['off'],
      /**
       * The `sonarjs/prefer-default-last` rule is disabled because
       * the eslint core `default-case-last` rule provides equivalent switch-case detection.
       */
      'sonarjs/prefer-default-last': ['off'],
      /**
       * The `sonarjs/slow-regex` rule is disabled because
       * `regexp/no-super-linear-backtracking` provides equivalent exponential-backtracking analysis.
       */
      'sonarjs/slow-regex': ['off'],
      /**
       * This rule is disabled because the use of TODO tags is common in our codebase
       * and we do not want to enforce their removal.
       */
      'sonarjs/todo-tag': ['off'],
      /**
       * The `sonarjs/unused-import` can be disabled because
       * typescript has `noUnusedLocals` and `noUnusedParameters` compiler options
       * which can be used to enforce the same rule.
       */
      'sonarjs/unused-import': ['off'],
      /**
       * The `sonarjs/updated-loop-counter` rule is disabled because
       * it is a deprecated rule.
       */
      'sonarjs/updated-loop-counter': ['off'],
      /**
       * All AWS rules are disabled because they are not applicable to our codebase.
       */
      ...disabledAwsRules,
      ...disabledBackendRules,
    },
  } as EslintConfig;
}
