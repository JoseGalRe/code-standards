import vitest from '@vitest/eslint-plugin';
import testingLibrary from 'eslint-plugin-testing-library';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `testing` layer of the shared ESLint flat config.
 *
 * Applies the Vitest and Testing Library recommended rules to test files and
 * `setup.ts`, and disables rules that do not apply to test-only code.
 *
 * @returns The ESLint configuration for the testing layer.
 */
export function testing() {
  const { globals } = vitest.environments.env || {};

  return {
    files: ['**/*{.,-}test.{ts,tsx}', '**/setup.ts'],
    languageOptions: {
      globals,
    },
    name: 'testing',
    plugins: {
      ...vitest.configs.recommended.plugins,
      ...testingLibrary.configs?.['flat/react']?.plugins,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      ...testingLibrary.configs?.['flat/react']?.rules,
      /**
       * This rule (@eslint-react/static-components) is disabled because
       * components defined within tests are intended for behavior verification
       * rather than production performance optimization.
       */
      '@eslint-react/static-components': ['off'],
      '@typescript-eslint/consistent-type-imports': ['off'],
      /**
       * For Testing, This rule is not needed as we are not exporting components.
       * so, we turn it off.
       */
      'react-doctor/no-multi-comp': ['off'],
      /**
       * For Testing, This rule is not needed as we are not exporting components.
       * so, we turn it off.
       */
      'react-doctor/no-multi-component-file': ['off'],
      /**
       * For Testing, This rule is not needed due to the fact that we are using unstable data and columns in our tests.
       * so, we turn it off.
       */
      'react-doctor/tanstack-table-no-unstable-data-or-columns': ['off'],
      /**
       * For Testing, This rule is not needed as we are not exporting components.
       * so, we turn it off.
       */
      'react-refresh/only-export-components': ['off'],
      /**
       * Test harness components use effects to drive the component under test into a specific
       * state, such as seeding table state, applying a custom column order or forcing a filter.
       * Reacting to props from an effect is the purpose of the harness rather than an
       * architectural smell, so we turn these off.
       */
      'react-you-might-not-need-an-effect/no-event-handler': ['off'],
      /**
       * Test harness components often need to pass data to their parent components for the purpose of
       * setting up the test environment or verifying the behavior of the component under test. This is
       * a common pattern in testing and is not necessarily a code smell.
       */
      'react-you-might-not-need-an-effect/no-pass-data-to-parent': ['off'],
      'testing-library/no-node-access': ['error', {
        allowContainerFirstChild: true,
      }],
      /**
       * For Testing, This rule is not needed
       * we are intentionally mocking global objects in our tests.
       */
      'unicorn/no-global-object-property-assignment': ['off'],
      /**
       * Rewriting HTML assignments would change the exact DOM fixtures exercised by these tests,
       * so we turn this rule off.
       */
      'unicorn/prefer-dom-node-html-methods': ['off'],
      'vitest/consistent-test-it': ['error', {
        fn: 'it',
        withinDescribe: 'it',
      }],
      'vitest/prefer-hooks-in-order': ['error'],
      'vitest/prefer-lowercase-title': ['error'],
    },
    settings: {
      vitest: {
        vitestImports: ['vite-plus/test'],
      },
    },
  } as EslintConfig;
}
