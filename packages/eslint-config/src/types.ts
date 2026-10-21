import type { RuleOptions } from './rules.ts';
import type { Linter } from 'eslint';
import type { defineConfig } from 'eslint/config';

declare module 'eslint' {
  namespace Linter {
    type RulesConfig = Record<string, Linter.RuleEntry> & RuleOptions;
  }
}

export type EslintConfig = {
  rules?: Linter.Config['rules'];
} & Exclude<Parameters<typeof defineConfig>[number], unknown[]>;

export type { RuleOptions } from './rules.ts';
