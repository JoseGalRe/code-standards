import { resolveRuleGroups } from './rule-groups.ts';

import type { RuleGroup } from './rule-groups-types.ts';
import type { Linter } from 'eslint';

const presetRules: Linter.RulesConfig = {
  'plugin/aws-bucket': ['error'],
  'plugin/aws-queue': ['error'],
  'plugin/awsome': ['error'],
  'plugin/general': ['error'],
};

const groups: Record<string, RuleGroup> = {
  aws: {
    defaultEnabled: false,
    prefixes: ['plugin/aws-'],
    whenDisabled: { 'plugin/extra': ['off'] },
    whenEnabled: { 'plugin/opt-in': ['warn'] },
  },
  tests: {
    defaultEnabled: true,
    whenDisabled: { 'plugin/test-rule': ['off'] },
  },
};

describe('utils: rule-groups', () => {
  it('should apply defaults when flags are omitted', () => {
    const result = resolveRuleGroups(groups, {}, presetRules);

    expect(result).toEqual({
      'plugin/aws-bucket': ['off'],
      'plugin/aws-queue': ['off'],
      'plugin/extra': ['off'],
    });
  });

  it('should not disable rules that only partially match a prefix', () => {
    const result = resolveRuleGroups(groups, {}, presetRules);

    expect(result).not.toHaveProperty('plugin/awsome');
    expect(result).not.toHaveProperty('plugin/general');
  });

  it('should apply whenEnabled and skip disabling when a flag is true', () => {
    const result = resolveRuleGroups(groups, { aws: true }, presetRules);

    expect(result).toEqual({ 'plugin/opt-in': ['warn'] });
  });

  it('should disable a default-enabled group when its flag is false', () => {
    const result = resolveRuleGroups(groups, { aws: true, tests: false }, presetRules);

    expect(result).toEqual({
      'plugin/opt-in': ['warn'],
      'plugin/test-rule': ['off'],
    });
  });
});
