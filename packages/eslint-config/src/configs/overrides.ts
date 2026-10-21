import type { EslintConfig } from '../types.ts';

/**
 * Builds the override layer of the shared ESLint flat config.
 *
 * Returns path-scoped entries for locales, plugins and scripts, constants and
 * theme files, `package.json`, and `msal-env.ts`.
 *
 * @returns The ESLint configuration for override rules.
 */
export function overrides() {
  return [
    {
      files: ['**/{plugins,scripts}/**', '**/vite.ts', '**/vite.config.ts', '**/vitest.config.ts'],
      name: 'plugins-scripts-rules',
      rules: {
        'no-console': ['error', {
          allow: ['warn', 'error', 'info'],
        }],
        /**
         * This rule is disabled because our code use dynamic imports in our plugins and scripts.
         */
        'security/detect-non-literal-fs-filename': ['off'],
        /**
         * This rule is disabled because our code use non-literal regular expressions in our plugins and scripts.
         */
        'security/detect-non-literal-regexp': ['off'],
        'sonarjs/no-os-command-from-path': ['off'],
        'sonarjs/os-command': ['off'],
      },
    },
    {
      files: ['**/package.json'],
      name: 'package-json',
      rules: {
        'jsonc/sort-array-values': [
          'error',
          {
            order: { type: 'asc' },
            pathPattern: '^files$',
          },
        ],
        'jsonc/sort-keys': [
          'error',
          {
            order: [
              'publisher',
              'name',
              'displayName',
              'type',
              'version',
              'private',
              'packageManager',
              'description',
              'author',
              'contributors',
              'license',
              'funding',
              'homepage',
              'repository',
              'bugs',
              'keywords',
              'categories',
              'sideEffects',
              'imports',
              'exports',
              'main',
              'module',
              'unpkg',
              'jsdelivr',
              'types',
              'typesVersions',
              'bin',
              'icon',
              'files',
              'engines',
              'activationEvents',
              'contributes',
              'scripts',
              'peerDependencies',
              'peerDependenciesMeta',
              'dependencies',
              'optionalDependencies',
              'devDependencies',
              'overrides',
              'resolutions',
            ],
            pathPattern: '^$',
          },
          {
            order: { type: 'asc' },
            pathPattern: '^(?:dev|peer|optional|bundled)?dependencies(Meta)?$',
          },
          {
            order: { type: 'asc' },
            pathPattern: '^(?:resolutions|overrides|pnpm.overrides)$',
          },
          {
            order: [
              'types',
              'import',
              'require',
              'default',
            ],
            pathPattern: '^exports.*$',
          },
        ],
      },
    },
  ] as EslintConfig[];
}
