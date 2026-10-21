import { defineConfig } from 'eslint/config';

import type { EslintConfig } from './types.ts';

/**
 * Create a Fully Typed ESLint configuration.
 *
 * Combines multiple ESLint configurations into a single configuration array.
 * Accepts both individual ESLint configurations and arrays of configurations.
 *
 * @param config - One or more ESLint configurations or arrays of configurations.
 *
 * @returns An array of ESLint configurations.
 */
export function eslintConfig(...config: (EslintConfig | EslintConfig[])[]): EslintConfig[] {
  return defineConfig(...config);
}

export type { EslintConfig, RuleOptions } from './types.ts';
