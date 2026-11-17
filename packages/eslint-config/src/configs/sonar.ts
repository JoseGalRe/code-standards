import plugin from 'eslint-plugin-sonarjs';

import { resolveRuleGroups } from '../utils/rule-groups/index.ts';

import type { EslintConfig } from '../types.ts';
import type { RuleGroup } from '../utils/rule-groups/rule-groups-types.ts';

/**
 * Optional rule groups of the `sonarjs` layer.
 *
 * Runtime and library groups only matter when the project targets that runtime
 * or uses that library, so they are disabled by default.
 */
export type SonarConfigInclude = {
  /**
   * Angular sanitization rules.
   *
   * @default false
   */
  angular?: boolean;
  /**
   * AWS CDK infrastructure rules (`sonarjs/aws-*`).
   *
   * @default false
   */
  aws?: boolean;
  /**
   * Chai assertion rules.
   *
   * @default false
   */
  chai?: boolean;
  /**
   * Cypress assertion rules.
   *
   * @default false
   */
  cypress?: boolean;
  /**
   * jQuery rules that prefer native APIs.
   *
   * @default false
   */
  jquery?: boolean;
  /**
   * Lodash and Underscore.js rules (modular imports, `memoize` keys, debounced functions in render).
   *
   * @default false
   */
  lodash?: boolean;
  /**
   * Mocha timeout rules.
   *
   * @default false
   */
  mocha?: boolean;
  /**
   * Node.js runtime security rules: crypto, TLS, OS commands, file system, and clear-text protocols.
   *
   * @default false
   */
  node?: boolean;
  /**
   * Playwright wait rules.
   *
   * @default false
   */
  playwright?: boolean;
  /**
   * React rules (leaked renders, state setters, list keys, read-only props).
   *
   * @default false
   */
  react?: boolean;
  /**
   * Hard-coded credentials, secrets, and IP addresses.
   *
   * @default false
   */
  secrets?: boolean;
  /**
   * HTTP server security rules: headers, cookies, sessions, CORS, CSRF, uploads, SQL, XXE, and template engines.
   *
   * @default false
   */
  server?: boolean;
  /**
   * Testing Library query rules.
   *
   * @default false
   */
  testingLibrary?: boolean;
  /**
   * Framework-agnostic test rules (assertions, skipped and exclusive tests, titles, hooks).
   *
   * @default true
   */
  tests?: boolean;
  /**
   * Vitest mocking rules.
   *
   * @default false
   */
  vitest?: boolean;
  /**
   * Vue rules (mixins, class components, reactive state in `updated`).
   *
   * @default false
   */
  vue?: boolean;
};

export type SonarConfig = {
  include?: SonarConfigInclude;
};

/**
 * Optional rule groups keyed by {@link SonarConfigInclude} flag.
 *
 * Grouping follows the `requiredDependency` and `scope` metadata that SonarJS ships with each rule.
 * The ESLint plugin does not enforce that metadata, so every rule runs unless it is disabled here.
 *
 * @see {@link https://sonarsource.github.io/rspec/#/rspec?lang=javascript} for the full rule catalog.
 */
const ruleGroups = {
  angular: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/no-angular-bypass-sanitization': ['off'],
    },
  },
  aws: {
    defaultEnabled: false,
    prefixes: ['sonarjs/aws-'],
  },
  chai: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/chai-determinate-assertion': ['off'],
    },
  },
  cypress: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/prefer-cypress-should': ['off'],
    },
  },
  jquery: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/prefer-native-jquery-alternative': ['off'],
    },
  },
  lodash: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/memoize-cache-key': ['off'],
      'sonarjs/no-debounce-throttle-in-render': ['off'],
      'sonarjs/no-default-utility-imports': ['off'],
    },
  },
  mocha: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/disabled-timeout': ['off'],
    },
  },
  node: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/encryption-secure-mode': ['off'],
      'sonarjs/file-permissions': ['off'],
      'sonarjs/hashing': ['off'],
      'sonarjs/insecure-jwt-token': ['off'],
      'sonarjs/no-clear-text-protocols': ['off'],
      'sonarjs/no-os-command-from-path': ['off'],
      'sonarjs/no-weak-cipher': ['off'],
      'sonarjs/no-weak-keys': ['off'],
      'sonarjs/pseudo-random': ['off'],
      'sonarjs/publicly-writable-directories': ['off'],
      'sonarjs/unverified-certificate': ['off'],
      'sonarjs/unverified-hostname': ['off'],
      'sonarjs/weak-ssl': ['off'],
    },
  },
  /**
   * `no-networkidle-wait` is off in the upstream recommended preset.
   */
  playwright: {
    defaultEnabled: false,
    whenEnabled: {
      'sonarjs/no-networkidle-wait': ['error'],
    },
  },
  react: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/jsx-no-leaked-render': ['off'],
      'sonarjs/no-hook-setter-in-body': ['off'],
      'sonarjs/no-uniq-key': ['off'],
      'sonarjs/no-useless-react-setstate': ['off'],
      'sonarjs/prefer-read-only-props': ['off'],
    },
  },
  secrets: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/hardcoded-secret-signatures': ['off'],
      'sonarjs/no-hardcoded-ip': ['off'],
      'sonarjs/no-hardcoded-passwords': ['off'],
      'sonarjs/no-hardcoded-secrets': ['off'],
    },
  },
  server: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/content-length': ['off'],
      'sonarjs/content-security-policy': ['off'],
      'sonarjs/cookie-no-httponly': ['off'],
      'sonarjs/cors': ['off'],
      'sonarjs/csrf': ['off'],
      'sonarjs/disabled-auto-escaping': ['off'],
      'sonarjs/dynamically-constructed-templates': ['off'],
      'sonarjs/file-uploads': ['off'],
      'sonarjs/insecure-cookie': ['off'],
      'sonarjs/no-mime-sniff': ['off'],
      'sonarjs/no-referrer-policy': ['off'],
      'sonarjs/no-session-cookies-on-static-assets': ['off'],
      'sonarjs/production-debug': ['off'],
      'sonarjs/session-regeneration': ['off'],
      'sonarjs/sql-queries': ['off'],
      'sonarjs/strict-transport-security': ['off'],
      'sonarjs/x-powered-by': ['off'],
      'sonarjs/xml-parser-xxe': ['off'],
    },
  },
  testingLibrary: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/testing-library-prefer-query-by-disappearance': ['off'],
      'sonarjs/testing-library-query-assertion': ['off'],
    },
  },
  tests: {
    defaultEnabled: true,
    whenDisabled: {
      'sonarjs/assertions-in-test-cases': ['off'],
      'sonarjs/assertions-in-tests': ['off'],
      'sonarjs/async-test-assertions': ['off'],
      'sonarjs/explicit-test-skip': ['off'],
      'sonarjs/hooks-before-test-cases': ['off'],
      'sonarjs/inverted-assertion-arguments': ['off'],
      'sonarjs/no-code-after-done': ['off'],
      'sonarjs/no-debug-commands-in-ui-tests': ['off'],
      'sonarjs/no-duplicate-parameterized-test-case': ['off'],
      'sonarjs/no-duplicate-test-title': ['off'],
      'sonarjs/no-empty-parameterized-test-dataset': ['off'],
      'sonarjs/no-empty-test-file': ['off'],
      'sonarjs/no-empty-test-title': ['off'],
      'sonarjs/no-exclusive-tests': ['off'],
      'sonarjs/no-fixed-wait-in-tests': ['off'],
      'sonarjs/no-forced-browser-interaction': ['off'],
      'sonarjs/no-incompatible-assertion-types': ['off'],
      'sonarjs/no-incomplete-assertions': ['off'],
      'sonarjs/no-interpolation-in-inline-snapshots': ['off'],
      'sonarjs/no-same-argument-assert': ['off'],
      'sonarjs/no-skipped-tests': ['off'],
      'sonarjs/no-trivial-assertions': ['off'],
      'sonarjs/parameterized-tests': ['off'],
      'sonarjs/prefer-specific-assertions': ['off'],
      'sonarjs/stable-tests': ['off'],
      'sonarjs/synchronous-exception-assertions': ['off'],
      'sonarjs/synchronous-suite-callback': ['off'],
      'sonarjs/test-check-exception': ['off'],
    },
  },
  vitest: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/vitest-mock-at-module-scope': ['off'],
    },
  },
  vue: {
    defaultEnabled: false,
    whenDisabled: {
      'sonarjs/no-mutate-reactive-state-in-updated-hook': ['off'],
      'sonarjs/no-vue-class-component': ['off'],
      'sonarjs/no-vue-mixins': ['off'],
    },
  },
} as const satisfies Record<keyof SonarConfigInclude, RuleGroup>;

/**
 * Builds the `sonarjs` layer of the shared ESLint flat config.
 *
 * Applies the `eslint-plugin-sonarjs` recommended rules, disables rules covered
 * by other layers, and disables every optional group not enabled through `include`.
 *
 * @param props - Optional configuration for the SonarJS ESLint rules.
 *
 * @returns The ESLint configuration for the sonarjs plugin.
 */
export function sonar(props: SonarConfig = {}) {
  const include = props.include ?? {};
  const { rules } = (plugin?.configs?.recommended || {}) as EslintConfig;

  return {
    files: ['**/*.{ts,tsx}'],
    name: 'sonarjs',
    plugins: {
      sonarjs: plugin,
    },
    rules: {
      ...rules,
      ...resolveRuleGroups(ruleGroups, include, rules ?? {}),
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
    },
  } as EslintConfig;
}
