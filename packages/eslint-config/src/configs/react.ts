import plugin from '@eslint-react/eslint-plugin';
import doctor from 'eslint-plugin-react-doctor';
import refresh from 'eslint-plugin-react-refresh';
import youMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect';

import { resolveRuleGroups } from '../utils/rule-groups/index.ts';

import type { EslintConfig } from '../types.ts';
import type { RuleGroup, RuleGroupFlags } from '../utils/rule-groups/rule-groups-types.ts';
import type { Linter } from 'eslint';

/**
 * Optional rule groups of the `react` layer.
 *
 * Library groups only matter when the project uses that library, so they are
 * disabled by default. Feature groups describe the runtime the project targets.
 */
export type ReactConfigInclude = {
  /**
   * `react-doctor` Base UI rules.
   *
   * @default false
   */
  baseUI?: boolean;
  /**
   * React Compiler support: lets `@eslint-react` skip rules made redundant by the
   * compiler (`compilationMode: 'infer'`).
   *
   * @default false
   */
  compiler?: boolean;
  /**
   * `react-doctor` Ink (terminal UI) rules.
   *
   * @default false
   */
  ink?: boolean;
  /**
   * `react-doctor` Jotai rules.
   *
   * @default false
   */
  jotai?: boolean;
  /**
   * Rule that flags full `lodash` imports.
   *
   * @default false
   */
  lodash?: boolean;
  /**
   * `react-doctor` MobX rules.
   *
   * @default false
   */
  mobx?: boolean;
  /**
   * Rule that flags `moment` usage.
   *
   * @default false
   */
  moment?: boolean;
  /**
   * `react-doctor` Motion (Framer Motion) rules.
   *
   * @default false
   */
  motion?: boolean;
  /**
   * `react-doctor` Preact preset.
   *
   * @default false
   */
  preact?: boolean;
  /**
   * `react-doctor` React Three Fiber rules.
   *
   * @default false
   */
  r3f?: boolean;
  /**
   * `react-doctor` Radix UI rules.
   *
   * @default false
   */
  radix?: boolean;
  /**
   * React 19 rules. When disabled, React 19-only APIs and migrations are not
   * suggested; when enabled, React 18 ref-cleanup warnings are dropped.
   *
   * @default false
   */
  react19?: boolean;
  /**
   * `react-doctor` React Aria rules.
   *
   * @default false
   */
  reactAria?: boolean;
  /**
   * `react-doctor` react-markdown rules.
   *
   * @default false
   */
  reactMarkdown?: boolean;
  /**
   * `react-doctor` React Native and Expo preset.
   *
   * @default false
   */
  reactNative?: boolean;
  /**
   * `react-doctor` React Router rules (routing, loaders, navigation, search params).
   * Framework-mode server rules also require {@link ReactConfigInclude.ssr}.
   *
   * @default false, or `true` when `reactRouterV8` is enabled
   */
  reactRouter?: boolean;
  /**
   * `react-doctor` React Router v8 rules (removed imports, future flags, and meta fields).
   * Implies {@link ReactConfigInclude.reactRouter} unless it is explicitly `false`.
   *
   * @default false
   */
  reactRouterV8?: boolean;
  /**
   * `react-doctor` Redux rules.
   *
   * @default false
   */
  redux?: boolean;
  /**
   * `eslint-plugin-react-refresh` rules for Vite HMR.
   *
   * @default true
   */
  refresh?: boolean;
  /**
   * `react-doctor` Remotion rules.
   *
   * @default false
   */
  remotion?: boolean;
  /**
   * React Server Components and Server Functions rules.
   *
   * @default false
   */
  server?: boolean;
  /**
   * `react-doctor` shadcn/ui rules.
   *
   * @default false
   */
  shadcn?: boolean;
  /**
   * Server rendering and hydration rules, including React Router framework-mode
   * middleware and session rules when {@link ReactConfigInclude.reactRouter} is enabled.
   *
   * @default false
   */
  ssr?: boolean;
  /**
   * `react-doctor` styled-components rules.
   *
   * @default false
   */
  styledComponents?: boolean;
  /**
   * `react-doctor` TanStack Form preset.
   *
   * @default false
   */
  tanstackForm?: boolean;
  /**
   * `react-doctor` TanStack Query preset.
   *
   * @default false
   */
  tanstackQuery?: boolean;
  /**
   * `react-doctor` TanStack Start preset.
   *
   * @default false
   */
  tanstackStart?: boolean;
  /**
   * `react-doctor` TanStack Table preset.
   *
   * @default false
   */
  tanstackTable?: boolean;
  /**
   * `react-doctor` TanStack Virtual preset.
   *
   * @default false
   */
  tanstackVirtual?: boolean;
  /**
   * `react-doctor` three.js rules.
   *
   * @default false
   */
  three?: boolean;
  /**
   * `react-doctor` Valtio rules.
   *
   * @default false
   */
  valtio?: boolean;
  /**
   * `react-doctor` WebGL rules.
   *
   * @default false
   */
  webgl?: boolean;
  /**
   * `eslint-plugin-react-you-might-not-need-an-effect` rules. When disabled, the
   * equivalent `react-doctor` rules are used instead.
   *
   * @default true
   */
  youMightNotNeedAnEffect?: boolean;
  /**
   * `react-doctor` Zod rules. Off by default because `eslint-plugin-zod` is more comprehensive.
   *
   * @default false
   */
  zod?: boolean;
  /**
   * `react-doctor` Zustand rules.
   *
   * @default false
   */
  zustand?: boolean;
};

export type ReactConfig = {
  include?: ReactConfigInclude;
};

type RuleGroupName = Exclude<keyof ReactConfigInclude, 'refresh' | 'youMightNotNeedAnEffect'>;

/**
 * Optional rule groups.
 *
 * Library groups are disabled by prefix so react-doctor does not flag code under a premise
 * that does not apply to the project.
 *
 * @see {@link https://www.react.doctor/docs/rules} for the full rule catalog by group.
 */
const ruleGroups = {
  baseUI: {
    defaultEnabled: false,
    prefixes: ['react-doctor/base-ui-'],
  },
  /**
   * Only affects `settings['react-x'].compilationMode`. `react-doctor/react-compiler-no-manual-memoization`
   * is retired upstream (its `create` is a no-op), so it is not toggled here.
   */
  compiler: {
    defaultEnabled: false,
  },
  ink: {
    defaultEnabled: false,
    prefixes: ['react-doctor/ink-'],
  },
  jotai: {
    defaultEnabled: false,
    prefixes: ['react-doctor/jotai-'],
  },
  lodash: {
    defaultEnabled: false,
    whenDisabled: {
      'react-doctor/no-full-lodash-import': ['off'],
    },
  },
  mobx: {
    defaultEnabled: false,
    prefixes: ['react-doctor/mobx-'],
  },
  moment: {
    defaultEnabled: false,
    whenDisabled: {
      'react-doctor/no-moment': ['off'],
    },
  },
  motion: {
    defaultEnabled: false,
    prefixes: ['react-doctor/motion-'],
    whenDisabled: {
      'react-doctor/no-conflicting-spring-options': ['off'],
      'react-doctor/no-static-motion-config-never': ['off'],
      'react-doctor/use-lazy-motion': ['off'],
    },
  },
  preact: {
    defaultEnabled: false,
    whenEnabled: doctor?.configs?.preact?.rules,
  },
  r3f: {
    defaultEnabled: false,
    prefixes: ['react-doctor/r3f-'],
  },
  radix: {
    defaultEnabled: false,
    prefixes: ['react-doctor/radix-'],
  },
  react19: {
    defaultEnabled: false,
    whenDisabled: {
      '@eslint-react/dom-no-use-form-state': ['off'],
      '@eslint-react/no-context-provider': ['off'],
      '@eslint-react/no-forward-ref': ['off'],
      '@eslint-react/no-use-context': ['off'],
      'react-doctor/no-default-props': ['off'],
      'react-doctor/no-react19-deprecated-apis': ['off'],
      'react-doctor/prefer-use-effect-event': ['off'],
    },
    whenEnabled: {
      /**
       * Ref callback cleanup is supported natively since React 19.
       */
      'react-doctor/no-ref-callback-cleanup-before-react-19': ['off'],
    },
  },
  reactAria: {
    defaultEnabled: false,
    prefixes: ['react-doctor/react-aria-'],
  },
  reactMarkdown: {
    defaultEnabled: false,
    prefixes: ['react-doctor/react-markdown-'],
  },
  reactNative: {
    defaultEnabled: false,
    whenEnabled: doctor?.configs?.['react-native']?.rules,
  },
  /**
   * Covers every `react-router-*` rule, so v8 and framework-mode server rules are also off when disabled.
   */
  reactRouter: {
    defaultEnabled: false,
    prefixes: ['react-doctor/react-router-'],
  },
  reactRouterV8: {
    defaultEnabled: false,
    prefixes: ['react-doctor/react-router-v8-'],
  },
  redux: {
    defaultEnabled: false,
    prefixes: ['react-doctor/redux-'],
  },
  remotion: {
    defaultEnabled: false,
    prefixes: ['react-doctor/remotion-'],
  },
  server: {
    defaultEnabled: false,
    prefixes: ['react-doctor/server-'],
    whenDisabled: {
      '@eslint-react/rsc-function-definition': ['off'],
    },
  },
  shadcn: {
    defaultEnabled: false,
    prefixes: ['react-doctor/shadcn-'],
  },
  ssr: {
    defaultEnabled: false,
    whenDisabled: {
      'react-doctor/no-hydration-branch-on-browser-global': ['off'],
      'react-doctor/no-impure-call-at-module-scope': ['off'],
      'react-doctor/no-locale-format-in-render': ['off'],
      'react-doctor/no-match-media-in-state-initializer': ['off'],
      'react-doctor/no-unguarded-browser-global-at-module-scope': ['off'],
      'react-doctor/no-unguarded-browser-global-in-render-or-hook-init': ['off'],
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
    },
    whenEnabled: {
      'react-doctor/no-impure-call-at-module-scope': ['warn'],
    },
  },
  styledComponents: {
    defaultEnabled: false,
    prefixes: ['react-doctor/styled-components-'],
  },
  tanstackForm: {
    defaultEnabled: false,
    prefixes: ['react-doctor/tanstack-form-'],
  },
  tanstackQuery: {
    defaultEnabled: false,
    whenEnabled: doctor?.configs?.['tanstack-query']?.rules,
  },
  tanstackStart: {
    defaultEnabled: false,
    whenEnabled: doctor?.configs?.['tanstack-start']?.rules,
  },
  tanstackTable: {
    defaultEnabled: false,
    prefixes: ['react-doctor/tanstack-table-'],
  },
  tanstackVirtual: {
    defaultEnabled: false,
    prefixes: ['react-doctor/tanstack-virtual-'],
  },
  three: {
    defaultEnabled: false,
    prefixes: ['react-doctor/three-'],
  },
  valtio: {
    defaultEnabled: false,
    prefixes: ['react-doctor/valtio-'],
  },
  webgl: {
    defaultEnabled: false,
    prefixes: ['react-doctor/webgl-'],
  },
  zod: {
    defaultEnabled: false,
    prefixes: ['react-doctor/zod-'],
  },
  zustand: {
    defaultEnabled: false,
    prefixes: ['react-doctor/zustand-'],
  },
} as const satisfies Record<RuleGroupName, RuleGroup>;

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
  'react-doctor/no-array-index-as-key': ['off'],
  'react-doctor/no-async-effect-callback': ['off'],
  'react-doctor/no-create-ref-in-function-component': ['off'],
  'react-doctor/no-danger-with-children': ['off'],
  'react-doctor/no-deprecated-keyboard-event-keycode-which': ['off'],
  'react-doctor/no-did-mount-set-state': ['off'],
  'react-doctor/no-did-update-set-state': ['off'],
  'react-doctor/no-direct-mutation-state': ['off'],
  'react-doctor/no-eager-new-in-use-state-initializer': ['off'],
  'react-doctor/no-eval': ['off'],
  'react-doctor/no-find-dom-node': ['off'],
  'react-doctor/no-flush-sync': ['off'],
  'react-doctor/no-is-mounted': ['off'],
  'react-doctor/no-json-parse-stringify-clone': ['off'],
  'react-doctor/no-legacy-class-lifecycles': ['off'],
  'react-doctor/no-mutable-in-deps': ['off'],
  'react-doctor/no-namespace': ['off'],
  'react-doctor/no-nested-component-definition': ['off'],
  'react-doctor/no-render-return-value': ['off'],
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
 * `react-doctor` clones of `eslint-plugin-react-you-might-not-need-an-effect` rules.
 *
 * Disabled only while that plugin is enabled, so the checks keep running when it is not.
 */
const reactDoctorYouMightNotNeedAnEffectRules: Linter.RulesConfig = {
  'react-doctor/no-adjust-state-on-prop-change': ['off'],
  'react-doctor/no-chain-state-updates': ['off'],
  'react-doctor/no-derived-state': ['off'],
  'react-doctor/no-event-handler': ['off'],
  'react-doctor/no-initialize-state': ['off'],
  'react-doctor/no-pass-data-to-parent': ['off'],
  'react-doctor/no-pass-live-state-to-parent': ['off'],
  'react-doctor/no-reset-all-state-on-prop-change': ['off'],
};

/**
 * Normalizes consumer flags before resolving {@link ruleGroups}.
 *
 * @param include - Flags provided by the consumer.
 *
 * @returns Flags where `reactRouterV8` implies `reactRouter` unless it is explicitly set.
 */
function toRuleGroupFlags(include: ReactConfigInclude): RuleGroupFlags {
  return {
    ...include,
    reactRouter: include.reactRouter ?? include.reactRouterV8,
  };
}

/**
 * Builds the `react` layer of the shared ESLint flat config.
 *
 * Combines the `@eslint-react`, React refresh, React Doctor, and
 * `react-you-might-not-need-an-effect` recommended rules, then disables
 * duplicated rules and every optional group not enabled through `include`.
 * Defaults target a React 18 client-rendered SPA built with Vite.
 *
 * @param props - Optional configuration for the React ESLint rules.
 *
 * @returns The ESLint configuration for React rules.
 */
export function react(props: ReactConfig = {}) {
  const include = props.include ?? {};

  const isRefreshEnabled = include.refresh ?? true;
  const isYouMightNotNeedAnEffectEnabled = include.youMightNotNeedAnEffect ?? true;

  const recommendedTypescript = plugin?.configs?.['recommended-typescript'] || {};
  const recommendedRefresh = isRefreshEnabled ? refresh?.configs?.vite : undefined;
  const recommendedDoctor = doctor?.configs?.recommended || {};

  const recommendedYouMightNotNeedAnEffect = isYouMightNotNeedAnEffectEnabled
    ? youMightNotNeedAnEffect?.configs?.recommended
    : undefined;

  return {
    files: ['**/*.{ts,tsx}'],
    name: 'react',
    plugins: {
      ...recommendedTypescript?.plugins,
      ...recommendedRefresh?.plugins,
      ...recommendedYouMightNotNeedAnEffect?.plugins,
      ...recommendedDoctor?.plugins,
    },
    rules: {
      ...recommendedTypescript?.rules,
      ...recommendedRefresh?.rules,
      ...recommendedYouMightNotNeedAnEffect?.rules,
      ...recommendedDoctor?.rules,
      ...reactDoctorDisabledDuplicatedRules,
      ...(isYouMightNotNeedAnEffectEnabled && reactDoctorYouMightNotNeedAnEffectRules),
      ...resolveRuleGroups(ruleGroups, toRuleGroupFlags(include), recommendedDoctor?.rules ?? {}),
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
      /**
       * Opt-in upstream. Complements `@eslint-react/set-state-in-effect`, which misses a state setter
       * passed as an argument to a helper called synchronously inside an effect (e.g. `apply(setCount, value)`).
       */
      'react-doctor/forwarded-set-state-in-effect': ['warn'],
    },
    settings: {
      /**
       * `react-doctor` presets set `portedRuleMode: 'curated'`, which makes rules ported from other
       * plugins (`alt-text`, `anchor-is-valid`, `jsx-key`, etc.) skip noisy contexts.
       */
      ...recommendedDoctor?.settings,
      'react': {
        pragma: 'React',
        version: 'detect',
      },
      'react-x': {
        version: 'detect',
        ...(include.compiler && { compilationMode: 'infer' }),
      },
    },
  } as EslintConfig;
}
