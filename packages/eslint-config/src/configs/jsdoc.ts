import plugin from 'eslint-plugin-jsdoc';

import type { EslintConfig } from '../types.ts';

/**
 * Builds the `jsdoc` layer of the shared ESLint flat config.
 *
 * Registers `eslint-plugin-jsdoc` with the flat recommended TypeScript plugin
 * set and keeps three rules as warnings: `jsdoc/empty-tags`, `jsdoc/tag-lines`
 * with `any`, and `jsdoc/sort-tags`. The `sort-tags` sequence assigns every
 * repository tag its own group, so different tags require one blank line
 * between them while consecutive tags of the same name require none.
 *
 * `jsdoc/check-tag-names` is overridden to keep accepting the standard
 * `@requires` tag used to document library dependencies. Its `typed` check is
 * disabled because `eslint-plugin-jsdoc` reports `@requires` as redundant
 * outside ambient contexts before consulting `definedTags`, and that report
 * conflicts with the `sort-tags` fixer on the same comment block.
 *
 * @returns The ESLint configuration for JSDoc rules.
 */
export function jsdoc() {
  const { plugins, rules } = plugin.configs['flat/recommended-typescript'] || {};

  return {
    files: ['**/*.{ts,tsx}'],
    name: 'jsdoc',
    plugins,
    rules: {
      ...rules,
      'jsdoc/check-tag-names': ['warn', {
        typed: false,
      }],
      'jsdoc/empty-tags': ['warn'],
      /**
       * Disables the requirement for JSDoc comments on all code elements.
       * This must be enabled per repository as needed.
       */
      'jsdoc/require-jsdoc': ['off'],
      'jsdoc/sort-tags': ['warn', {
        alphabetizeExtras: false,
        linesBetween: 1,
        reportIntraTagGroupSpacing: true,
        reportTagGroupSpacing: true,
        tagSequence: [
          { tags: ['description'] },
          { tags: ['template'] },
          { tags: ['internal'] },
          { tags: ['param'] },
          { tags: ['requires'] },
          { tags: ['type'] },
          { tags: ['example'] },
          { tags: ['returns'] },
          { tags: ['throws'] },
          { tags: ['deprecated'] },
          { tags: ['default'] },
          { tags: ['see'] },
          { tags: ['variation'] },
          { tags: ['version'] },
        ],
      }],
      'jsdoc/tag-lines': ['warn', 'any', {
        applyToEndTag: false,
        endLines: 0,
        startLines: 1,
      }],
    },
  } as EslintConfig;
}
