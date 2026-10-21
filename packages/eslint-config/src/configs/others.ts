import e18e from '@e18e/eslint-plugin';
import deMorgan from 'eslint-plugin-de-morgan';
import zod from 'eslint-plugin-zod';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `others` layer of the shared ESLint flat config.
 *
 * Combines the recommended rules of `@e18e/eslint-plugin`,
 * `eslint-plugin-de-morgan`, and `eslint-plugin-zod`, with documented
 * relaxations where another layer is more comprehensive.
 *
 * @returns The ESLint configuration for other miscellaneous rules.
 */
export function others() {
  const deMorganConfig = deMorgan?.configs?.recommended || {};
  const e18eConfig = e18e?.configs?.recommended || {};
  const zodConfig = zod?.configs?.recommended || {};

  return {
    files: ['**/*.{ts,tsx}'],
    name: 'others',
    plugins: {
      ...e18eConfig?.plugins,
      ...deMorganConfig?.plugins,
      ...zodConfig?.plugins,
    },
    rules: {
      ...e18eConfig?.rules,
      ...deMorganConfig?.rules,
      ...zodConfig?.rules,
      /**
       * The `e18e/prefer-array-some` can be disabled because
       * the `unicorn/prefer-array-some` rule from eslint-plugin-unicorn
       * provides more comprehensive analysis.
       */
      'e18e/prefer-array-some': ['off'],
      /**
       * The `e18e/prefer-date-now` can be disabled because
       * the `unicorn/prefer-date-now` rule from eslint-plugin-unicorn
       * provides more comprehensive analysis.
       */
      'e18e/prefer-date-now': ['off'],
      /**
       * The `e18e/prefer-includes` can be disabled because
       * the `unicorn/prefer-includes` rule from eslint-plugin-unicorn
       * provides more comprehensive analysis.
       */
      'e18e/prefer-includes': ['off'],
      /**
       * The `e18e/prefer-regex-test` rule is disabled because
       * the `regexp/prefer-regexp-test` provides more comprehensive analysis.
       */
      'e18e/prefer-regex-test': ['off'],
      /**
       * Disabled because hoisting every static regex can reduce readability
       * without a meaningful performance benefit. Prefer reusing regexes in
       * hot paths when profiling justifies it, rather than enforcing it globally.
       */
      'e18e/prefer-static-regex': ['off'],
    },
  } as EslintConfig;
}
