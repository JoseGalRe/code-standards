import plugin from '@eslint-react/eslint-plugin';
import doctor from 'eslint-plugin-react-doctor';
import refresh from 'eslint-plugin-react-refresh';
import youMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect';

import type { EslintConfig } from '../types.ts';
import type { ESLint, Linter } from 'eslint';

/**
 * Rule-group prefixes for libraries not used in this project (Jotai, MobX, remotion, three.js, etc).
 *
 * Disabling by prefix avoids react-doctor flagging every rule under a group whose entire premise doesn't apply here.
 *
 * @see {@link https://www.react.doctor/docs/rules} for the full rule catalog by group.
 */
const reactDoctorUnusedGroups = [
  'react-doctor/base-ui',
  'react-doctor/ink',
  'react-doctor/jotai',
  'react-doctor/mobx',
  'react-doctor/motion',
  'react-doctor/r3f',
  'react-doctor/radix',
  'react-doctor/react-aria',
  'react-doctor/react-markdown',
  'react-doctor/react-router-v8', // this project uses react-router v7 due to React 18, thus we don't need the v8 rules
  'react-doctor/redux',
  'react-doctor/remotion',
  'react-doctor/server',
  'react-doctor/shadcn',
  'react-doctor/styled-components',
  'react-doctor/three',
  'react-doctor/val',
  'react-doctor/webgl',
  'react-doctor/zod', // zod has a more comprehensive plugin, thus we don't need react-doctor's zod rules
];

/**
 * Disabled rules that are duplicated by other ESLint plugins.
 */
const reactDoctorDisabledDuplicatedRules: Linter.RulesConfig = {
  /**
   * Disable rules that are cloned from `@eslint-react` plugin
   */
  'react-doctor/button-has-type': ['off'],
  /**
   * Disabled rules that are cloned from eslint-plugin-unicorn
   */
  'react-doctor/effect-remove-listener-inline-handler': ['off'],
  'react-doctor/exhaustive-deps': ['off'],
  /**
   * Disabled rules covered by Oxlint (correctness)
   */
  'react-doctor/forward-ref-uses-ref': ['off'],
  'react-doctor/iframe-missing-sandbox': ['off'],
  'react-doctor/js-min-max-loop': ['off'],
  'react-doctor/jsx-key': ['off'],
  'react-doctor/jsx-max-depth': ['off'],
  'react-doctor/jsx-no-comment-textnodes': ['off'],
  'react-doctor/jsx-no-duplicate-props': ['off'],
  'react-doctor/jsx-no-jsx-as-prop': ['off'],
  'react-doctor/jsx-no-new-array-as-prop': ['off'],
  'react-doctor/jsx-no-new-function-as-prop': ['off'],
  'react-doctor/jsx-no-new-object-as-prop': ['off'],
  'react-doctor/jsx-no-script-url': ['off'],
  'react-doctor/jsx-no-target-blank': ['off'],
  /**
   * Disabled rules that are cloned from eslint core rules
   */
  'react-doctor/jsx-no-undef': ['off'],
  'react-doctor/jsx-props-no-spread-multi': ['off'],
  /**
   * Disable rules that are cloned from eslint-plugin-react-you-might-not-need-an-effect
   */
  'react-doctor/no-adjust-state-on-prop-change': ['off'],
  'react-doctor/no-array-index-as-key': ['off'],
  'react-doctor/no-async-effect-callback': ['off'],
  'react-doctor/no-chain-state-updates': ['off'],
  'react-doctor/no-children-prop': ['off'],
  'react-doctor/no-create-ref-in-function-component': ['off'],
  'react-doctor/no-danger-with-children': ['off'],
  'react-doctor/no-deprecated-keyboard-event-keycode-which': ['off'],
  'react-doctor/no-derived-state': ['off'],
  'react-doctor/no-did-mount-set-state': ['off'],
  'react-doctor/no-did-update-set-state': ['off'],
  'react-doctor/no-direct-mutation-state': ['off'],
  'react-doctor/no-eager-new-in-use-state-initializer': ['off'],
  'react-doctor/no-eval': ['off'],

  'react-doctor/no-event-handler': ['off'],
  'react-doctor/no-find-dom-node': ['off'],
  'react-doctor/no-flush-sync': ['off'],
  'react-doctor/no-initialize-state': ['off'],
  'react-doctor/no-is-mounted': ['off'],
  'react-doctor/no-json-parse-stringify-clone': ['off'],
  'react-doctor/no-legacy-class-lifecycles': ['off'],
  'react-doctor/no-mutable-in-deps': ['off'],

  'react-doctor/no-namespace': ['off'],
  'react-doctor/no-nested-component-definition': ['off'],
  'react-doctor/no-pass-data-to-parent': ['off'],
  'react-doctor/no-pass-live-state-to-parent': ['off'],
  'react-doctor/no-render-return-value': ['off'],
  'react-doctor/no-reset-all-state-on-prop-change': ['off'],

  'react-doctor/no-set-state-in-render': ['off'],

  'react-doctor/no-string-refs': ['off'],
  'react-doctor/no-this-in-sfc': ['off'],

  'react-doctor/no-transition-all': ['off'],
  'react-doctor/no-unknown-property': ['off'],
  'react-doctor/no-unsafe': ['off'],
  'react-doctor/no-unstable-nested-components': ['off'],
  'react-doctor/no-will-update-set-state': ['off'],
  /**
   * Disabled rules that are cloned from react-refresh
   */
  'react-doctor/only-export-components': ['off'],
  'react-doctor/prefer-module-scope-pure-function': ['off'],
  'react-doctor/rerender-lazy-state-init': ['off'],
  'react-doctor/rules-of-hooks': ['off'],
  'react-doctor/style-prop-object': ['off'],
  'react-doctor/void-dom-elements-no-children': ['off'],
};

/**
 * Disabled rules that are not applicable to this project
 */
const reactDoctorNoApplicableRules: Linter.RulesConfig = {
  /**
   * Disable specific React 19 rules
   */
  'react-doctor/activity-wraps-effect-heavy-subtree': ['off'],
  'react-doctor/no-chain-state-updates': ['off'],
  /**
   * Disable specific motion rules
   */
  'react-doctor/no-conflicting-spring-options': ['off'],
  'react-doctor/no-default-props': ['off'],
  /**
   * Disable lodash and moment rules since they are not used in this project
   */
  'react-doctor/no-full-lodash-import': ['off'],
  /**
   * Disable specific SSR rules
   *
   * These rules are not applicable to SPA
   */
  'react-doctor/no-hydration-branch-on-browser-global': ['off'],

  'react-doctor/no-impure-call-at-module-scope': ['off'],
  'react-doctor/no-locale-format-in-render': ['off'],
  'react-doctor/no-match-media-in-state-initializer': ['off'],
  'react-doctor/no-moment': ['off'],
  'react-doctor/no-react19-deprecated-apis': ['off'],
  'react-doctor/no-static-motion-config-never': ['off'],
  'react-doctor/no-unguarded-browser-global-at-module-scope': ['off'],
  'react-doctor/no-unguarded-browser-global-in-render-or-hook-init': ['off'],
  'react-doctor/prefer-use-effect-event': ['off'],
  'react-doctor/react-compiler-no-manual-memoization': ['off'],
  /**
   * Disable specific React Router SSR rules
   *
   * These rules are not applicable
   */
  'react-doctor/react-router-csp-nonce-consistency': ['off'],

  'react-doctor/react-router-guard-aborted-handle-error': ['off'],
  'react-doctor/react-router-no-catch-middleware-next': ['off'],
  'react-doctor/react-router-no-client-module-in-server-render': ['off'],
  'react-doctor/react-router-no-middleware-response-body-consumption': ['off'],
  'react-doctor/react-router-no-multiple-middleware-next': ['off'],
  'react-doctor/react-router-no-route-module-environment-suffix': ['off'],
  'react-doctor/react-router-no-session-mutation-in-loader': ['off'],

  'react-doctor/react-router-no-static-cookie-expires': ['off'],
  'react-doctor/react-router-server-middleware-return-response': ['off'],
  'react-doctor/react-router-session-mutation-requires-commit': ['off'],

  'react-doctor/rendering-hydration-mismatch-time': ['off'],
  'react-doctor/use-lazy-motion': ['off'],
};

/**
 * Disabled rules that are not applicable to this project
 *
 * These rules are designed for React 19, but this project is using React 18, so we disable them for now.
 */
const eslintReactNoApplicableRules: Linter.RulesConfig = {
  '@eslint-react/dom-no-use-form-state': ['off'],
  '@eslint-react/no-context-provider': ['off'],
  '@eslint-react/no-forward-ref': ['off'],
  '@eslint-react/no-use-context': ['off'],
  '@eslint-react/rsc-function-definition': ['off'],
};

function disabledReactDoctorUnusedGroups(rules: Linter.RulesConfig): Linter.RulesConfig {
  const ruleKeys = Object.keys(rules || {});
  const disabledRules: Record<string, Linter.RuleEntry> = {};

  for (const rule of ruleKeys) {
    if (reactDoctorUnusedGroups.some((group) => rule.startsWith(group))) {
      disabledRules[rule] = ['off'];
    }
  }

  return disabledRules;
}

/**
 * Builds the `react` layer of the shared ESLint flat config.
 *
 * Combines the `@eslint-react`, React refresh, React Doctor, and
 * `react-you-might-not-need-an-effect` recommended rules, then disables
 * duplicated, React 19, and SSR rules that do not apply to this React 18 SPA.
 *
 * @returns The ESLint configuration for React rules.
 */
export function react() {
  const recommendedTypescript = plugin?.configs?.['recommended-typescript'] || {};
  const recommendedRefresh = refresh?.configs?.vite || {};
  const recommendedYouMightNotNeedAnEffect = youMightNotNeedAnEffect?.configs?.recommended || {};
  const recommendedDoctor = doctor?.configs?.recommended || {};

  return {
    files: ['**/*.{ts,tsx}'],
    name: 'react',
    plugins: {
      ...recommendedTypescript?.plugins,
      ...recommendedRefresh?.plugins,
      ...recommendedYouMightNotNeedAnEffect?.plugins,
      ...recommendedDoctor?.plugins,
    } as ESLint.Plugin,
    rules: {
      ...recommendedTypescript?.rules,
      ...recommendedRefresh?.rules,
      ...recommendedYouMightNotNeedAnEffect?.rules,
      ...recommendedDoctor?.rules,
      ...reactDoctorDisabledDuplicatedRules,
      ...reactDoctorNoApplicableRules,
      ...eslintReactNoApplicableRules,
      ...disabledReactDoctorUnusedGroups(recommendedDoctor?.rules),
      '@eslint-react/dom-no-missing-button-type': ['error'],
      '@eslint-react/dom-no-missing-iframe-sandbox': ['error'],
      '@eslint-react/dom-no-string-style-prop': ['error'],
      '@eslint-react/dom-no-unknown-property': ['error'],
      '@eslint-react/dom-no-unsafe-target-blank': ['error'],
      /**
       * The `react-doctor/circular-dependency` rule is disabled
       * because is very expensive to run and our ci/cd has a oxlint step that already checks for circular dependencies,
       * so this rule is redundant and unnecessary
       */
      'react-doctor/circular-dependency': ['off'],
    } as Linter.Config['rules'],
    settings: {
      react: {
        pragma: 'React',
        version: 'detect',
      },
    } as Linter.Config['settings'],
  } as EslintConfig;
}
