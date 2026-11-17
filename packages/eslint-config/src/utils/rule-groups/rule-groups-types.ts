import type { Linter } from 'eslint';

/**
 * Set of rules toggled together by a single boolean flag.
 */
export type RuleGroup = {
  /**
   * Default state when the flag is omitted.
   */
  readonly defaultEnabled: boolean;
  /**
   * Rule-id prefixes, including the plugin namespace (e.g. `sonarjs/aws-`), turned off when the group is disabled.
   * Only rules present in the preset passed to {@link resolveRuleGroups} are expanded.
   */
  readonly prefixes?: readonly string[];
  /**
   * Rules applied when the group is disabled.
   */
  readonly whenDisabled?: Linter.RulesConfig;
  /**
   * Rules applied when the group is enabled.
   */
  readonly whenEnabled?: Linter.RulesConfig;
};

/**
 * Consumer flags keyed by group name. `undefined` falls back to {@link RuleGroup.defaultEnabled}.
 */
export type RuleGroupFlags = Readonly<Record<string, boolean | undefined>>;
