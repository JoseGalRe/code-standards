import type { RuleGroup, RuleGroupFlags } from './rule-groups-types.ts';
import type { Linter } from 'eslint';

/**
 * Resolves the rules contributed by every group.
 *
 * Disabled groups contribute `off` entries, so the result must be merged after the upstream presets.
 *
 * @param groups - Groups keyed by flag name.
 * @param flags - Flags provided by the consumer.
 * @param presetRules - Rules of the upstream preset; only its keys are read, to expand group prefixes.
 *
 * @returns Rules to merge after the upstream presets.
 */
export function resolveRuleGroups(
  groups: Readonly<Record<string, RuleGroup>>,
  flags: RuleGroupFlags,
  presetRules: Readonly<Record<string, unknown>>,
): Linter.RulesConfig {
  const presetRuleNames = Object.keys(presetRules);
  const rules: Linter.RulesConfig = {};

  for (const [name, group] of Object.entries(groups)) {
    if (flags[name] ?? group.defaultEnabled) {
      Object.assign(rules, group.whenEnabled);
      continue;
    }

    const prefixes = group.prefixes ?? [];

    for (const rule of presetRuleNames) {
      if (prefixes.some((prefix) => rule.startsWith(prefix))) {
        rules[rule] = ['off'];
      }
    }

    Object.assign(rules, group.whenDisabled);
  }

  return rules;
}
