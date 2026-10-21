# @josegalre/code-standards-eslint

Composable ESLint flat-config layers, distributed as ESM JavaScript with TypeScript declarations.

## Installation and optional integrations

ESLint is the required peer. Plugin packages are optional peers: install only those needed by the layers you select.
The supported peer versions are declared in [`package.json`](./package.json).

For example, with Vite+:

```sh
vp add -D @josegalre/code-standards-eslint eslint @eslint/js
```

Any package manager can install the package; consumers do not need Vite+. Vite+ is only this repository's development toolchain.

Use independent subpaths for partial installations:

```ts
import { eslintConfig } from '@josegalre/code-standards-eslint/core';
import { javascript } from '@josegalre/code-standards-eslint/javascript';

export default eslintConfig(javascript());
```

`eslintConfig` only combines the layers you supply. It does not enable a preset implicitly.
Pass an empty array (`eslintConfig([])`) when no layers are needed; ESLint requires at least one argument.

### Root entry point

The root entry point retains all existing named exports:

```ts
import { eslintConfig, javascript } from '@josegalre/code-standards-eslint';
```

**The root eagerly loads every layer and therefore needs every layer's plugin peers.** It is retained for existing
imports, not for dependency isolation. Use `/core` and per-layer subpaths when installing only selected peers.

### Layers and their peers

All layers are named exports from their corresponding subpath. ESLint is required in addition to the peers below.

| Subpath                      | Additional peers                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `/core`, `/custom`, `/types` | None                                                                                                                                           |
| `/antfu`                     | `eslint-plugin-antfu`                                                                                                                          |
| `/javascript`                | `@eslint/js`                                                                                                                                   |
| `/jsdoc`                     | `eslint-plugin-jsdoc`                                                                                                                          |
| `/jsonc`                     | `eslint-plugin-jsonc`                                                                                                                          |
| `/node`                      | `eslint-plugin-n`                                                                                                                              |
| `/others`                    | `@e18e/eslint-plugin`, `eslint-plugin-de-morgan`, `eslint-plugin-zod`                                                                          |
| `/overrides`                 | No imports; compose with the plugin layers whose rules are overridden                                                                          |
| `/perfectionist`             | `eslint-plugin-perfectionist`                                                                                                                  |
| `/promise`                   | `eslint-plugin-promise`                                                                                                                        |
| `/react`                     | `@eslint-react/eslint-plugin`, `eslint-plugin-react-doctor`, `eslint-plugin-react-refresh`, `eslint-plugin-react-you-might-not-need-an-effect` |
| `/regexp`                    | `eslint-plugin-regexp`                                                                                                                         |
| `/security`                  | `eslint-plugin-security`                                                                                                                       |
| `/setup`                     | `globals`                                                                                                                                      |
| `/sonar`                     | `eslint-plugin-sonarjs`                                                                                                                        |
| `/stylistic`                 | `@stylistic/eslint-plugin`                                                                                                                     |
| `/testing`                   | `@vitest/eslint-plugin`, `eslint-plugin-testing-library`                                                                                       |
| `/typescript`                | `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`                                                                                |
| `/unicorn`                   | `eslint-plugin-unicorn`                                                                                                                        |
| `/yml`                       | `eslint-plugin-yml`                                                                                                                            |

Integrations can have their own peer requirements, such as TypeScript. Respect those packages' peer ranges too.
The local development installation deliberately includes all plugins to test the complete export surface.

### Custom rules with TypeScript

The custom layer itself imports no external plugin. Select a TypeScript parser when linting TypeScript syntax:

```ts
import { eslintConfig } from '@josegalre/code-standards-eslint/core';
import { custom } from '@josegalre/code-standards-eslint/custom';
import parser from '@typescript-eslint/parser';

export default eslintConfig(
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser },
  },
  custom(),
);
```

The layer provides three rules:

- `custom/no-duplicate-imports`: merges compatible duplicate imports without dropping bindings or type modifiers.
- `custom/no-inline-type-imports`: separates inline `type` specifiers into dedicated type imports.
- `custom/no-param-destructuring`: moves value destructuring into the body and, with the default `ignoreTypes: false`,
  extracts direct inline object annotations into names such as `ReadProps` for `function read`.

Override their options in a following config object. The repository's `src/rules` directory contains the detailed
contributor documentation and colocated rule tests; those source files are not included in the tarball.

### Public types

```ts
import type { EslintConfig, RuleOptions } from '@josegalre/code-standards-eslint/types';
```

These types are also exported from `/core` and the root. Published declarations retain the typed ESLint rule options.
The ESLint rule map remains open for third-party rules while validating known options. The generated Vitest
`valid-title` options expose `mustMatch` and `mustNotMatch` explicitly alongside the boolean flags.

`Linter.RulesConfig` is a type alias, not a mergeable interface. Do not redeclare it through module augmentation;
compose additional typed rules with `EslintConfig` and an intersection instead. Keep one instance of this package
in each TypeScript program, since distinct installations can introduce duplicate alias declarations.
This avoids requiring `exactOptionalPropertyTypes` in consumers: an interface extending both the open rule map
and the optional known rules would fail when that compiler option is disabled.

## Development

Run from the workspace root after restoring dependencies. Without a global Vite+ installation, use `pnpm exec vp`
in place of `vp` to launch the pinned workspace tool.

```sh
vp run -r typecheck
vp run -r eslint:check
vp run -r test
vp run -r test:coverage
vp fmt --check
vp run -r build
```

Tests, formatting, task orchestration, and library packaging use Vite+. ESLint remains the canonical validator for
the shared ESLint configurations and custom rules; the native Oxlint command is not a replacement for those checks.
Type checking continues to use the configured TypeScript compiler through `vp run typecheck`.

The package's `vite.config.ts` owns its `pack` and `test` settings. Formatting settings are shared in the workspace-root
`vite.config.ts`. The custom rule implementations retain their per-file 100% coverage thresholds.

The workspace pins Vite's alias to the core shipped with Vite+. That wrapper uses the Vite+ release number while
embedding Vite 8.3.4. The workspace therefore has version-specific peer exceptions for the pinned Vitest, Mocker,
and Vite React plugin versions, not blanket peer suppression. `strictPeerDependencies` stays enabled. See the
[upstream limitation](https://github.com/voidzero-dev/vite-plus/issues/2806). This development-only configuration
does not affect the dependencies of consumers of the tarball.

## Build and package

`vp pack` builds the library; `vp pm pack` creates the distributable package-manager tarball. They are different operations.

```sh
vp run @josegalre/code-standards-eslint#build
vp pm pack --filter @josegalre/code-standards-eslint --pack-destination ./artifacts
```

The `prepack` hook rebuilds the library before creating a tarball. Only `dist` and package metadata/documentation are
published: source files, tests, development tooling, and plugins are not bundled into the package.
The build emits only `.js` and `.d.ts`, preserving the source directory structure (for example,
`dist/configs/promise.js`). Output names are stable, without hashed chunks, source maps, or debug annotations.
No publishing command runs automatically.

## Toolchain references

- [Vite+ library packaging](https://viteplus.dev/guide/pack)
- [Vite+ tests](https://viteplus.dev/guide/test)
- [Vite+ task runner](https://viteplus.dev/guide/run)
