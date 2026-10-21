# Code Standards

Opinionated, composable linting standards for TypeScript projects. Choose the ESLint layers your project needs, install
their peers, and keep project-specific decisions in your own configuration.

**Explicit composition. Optional integrations. Typed configuration. Custom rules.**

[Quick start](#quick-start) · [Choosing layers](#choosing-layers) · [Custom rules](#custom-rules) ·
[Development](#development) · [Releases](#builds-and-releases)

## Packages

| Package                                                                  | Purpose                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [`@josegalre/code-standards-eslint`](./packages/eslint-config/README.md) | ESLint flat-config layers and local rules, distributed as ESM with TypeScript declarations. |

The repository root is a private workspace, not an installable configuration package.

## Quick start

### Requirements

- **Node.js 24.21.0 or newer.**
- **ESLint `^10.13.0`**, the required peer dependency.
- **pnpm 12.14.0 or newer** for workspace development and the commands below. Consumers can use another package manager.

### 1. Install the package and selected peers

In an existing TypeScript project:

```sh
pnpm add -D @josegalre/code-standards-eslint eslint @eslint/js \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  typescript globals
```

This installs the peers for the `setup()`, `javascript()`, and `typescript()` layers used below. The `custom()` layer needs
no additional plugin package. Check the [supported peer ranges](./packages/eslint-config/package.json) when selecting versions.

### 2. Create `eslint.config.ts`

```ts
import { eslintConfig } from '@josegalre/code-standards-eslint/core';
import { custom } from '@josegalre/code-standards-eslint/custom';
import { javascript } from '@josegalre/code-standards-eslint/javascript';
import { setup } from '@josegalre/code-standards-eslint/setup';
import { typescript } from '@josegalre/code-standards-eslint/typescript';

export default eslintConfig(setup(), javascript(), typescript(), custom(), {
  files: ['**/*.{ts,tsx}'],
  name: 'project-overrides',
  rules: {
    'no-console': 'warn',
  },
});
```

`eslintConfig()` combines only the entries you pass; it does not enable a preset implicitly. Later entries override
earlier ones, so keep project-specific adjustments last.

### 3. Run ESLint and TypeScript

```sh
pnpm exec eslint . --flag unstable_native_nodejs_ts_config
pnpm exec tsc --noEmit
```

The ESLint flag enables native loading of `eslint.config.ts`. With `eslint.config.mjs`, the same example works without
that flag.

Linting does not replace the TypeScript compiler. The JavaScript and TypeScript layers deliberately leave unused-symbol
checks to TypeScript; enable `noUnusedLocals` and `noUnusedParameters` in your `tsconfig.json` if you want those checks.

## Choosing layers

Use **`/core` plus individual layer subpaths** to keep installations selective. Plugin integrations are optional peers,
but a layer's peers must be installed before you import it.

> **Avoid the root import for partial installations.** Importing from `@josegalre/code-standards-eslint` eagerly loads
> every layer and requires all of their plugin peers, even if you only use one named export.

Available integrations cover:

- **Language and environment:** JavaScript rules, TypeScript, shared globals and ignores, and Node.js.
- **Code quality:** promises, regular expressions, security, SonarJS, Unicorn, Antfu, and additional focused plugins.
- **Style and documentation:** ESLint Stylistic, Perfectionist, and JSDoc.
- **React and testing:** React-specific checks, React Refresh, Vitest, and Testing Library.
- **Structured data:** JSON/JSONC and YAML.
- **Local conventions:** the three custom rules below.

See the [layer and peer dependency matrix](./packages/eslint-config/README.md#layers-and-their-peers) for exact subpaths
and installation requirements. The [workspace ESLint configuration](./eslint.config.ts) demonstrates the complete composition;
it is not a dependency-minimal starting point.

### Scope and defaults

- **TypeScript-first:** `javascript()` and `custom()` target `**/*.{ts,tsx}` by default, not `.js` or `.jsx`. Inspect the
  [layer definitions](./packages/eslint-config/src/configs) before adapting file scopes.
- **Shared globals:** `setup()` enables both browser and Node.js globals and adds common generated-directory ignores.
  Adjust that layer if your project needs stricter environment boundaries.
- **Repository-shaped overrides:** `overrides()` contains path-specific adjustments, including rules from other plugin
  layers. Use it with the corresponding integrations rather than as a standalone preset.
- **Public types:** `EslintConfig` and `RuleOptions` are available from `/types` and `/core`. See the
  [type contract](./packages/eslint-config/README.md#public-types) for third-party rule composition.

## Custom rules

The opt-in `custom()` layer registers these rules under the `custom` namespace for TypeScript and TSX:

| Rule                                                                                                   | Purpose                                                                                                 |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| [`custom/no-duplicate-imports`](./packages/eslint-config/src/rules/no-duplicate-imports/README.md)     | Detect duplicate imports and named re-exports; merge compatible declarations.                           |
| [`custom/no-inline-type-imports`](./packages/eslint-config/src/rules/no-inline-type-imports/README.md) | Move inline `type` specifiers into dedicated type imports.                                              |
| [`custom/no-param-destructuring`](./packages/eslint-config/src/rules/no-param-destructuring/README.md) | Move parameter destructuring into the function body and extract inline object types into named aliases. |

The layer supplies the rules, not a TypeScript parser; pair it with `typescript()` or configure a compatible parser
yourself. Some cases intentionally report without an autofix. Each rule's documentation explains its options and fix boundaries.

For preset options, rule defaults, and test conventions, read the [custom rules guide](./packages/eslint-config/src/rules/README.md).

## Development

### Set up the workspace

```sh
git clone https://github.com/JoseGalRe/code-standards.git
cd code-standards
pnpm install --frozen-lockfile
```

Run the following commands from the repository root. The workspace scripts use the pinned Vite+ toolchain; no global
`vp` installation is required. Development installs all plugin integrations so the complete package can be checked.

| Command              | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `pnpm typecheck`     | Run the packages' TypeScript compiler checks.              |
| `pnpm eslint:check`  | Check package source and scripts with ESLint.              |
| `pnpm test`          | Run the package test suites.                               |
| `pnpm test:coverage` | Run tests with coverage and enforce configured thresholds. |
| `pnpm fmt:check`     | Check workspace formatting, including Markdown.            |
| `pnpm build`         | Build the distributable library artifacts.                 |

ESLint remains the validator for these configurations and custom rules; the native Oxlint command is not a replacement.
Vite+ handles task orchestration, testing, formatting, and library packaging.

### Work on a custom rule

Keep each rule's implementation, `*-test.ts` suite, and README together in its own directory. Run one rule's tests with
the locally installed tool:

```sh
pnpm exec vp run @josegalre/code-standards-eslint#test src/rules/no-param-destructuring
```

Rule tests use ESLint's `RuleTester` and real-linter regression cases. Each of the three custom rule implementations has
per-file **100% statement, branch, function, and line coverage thresholds**. See the
[testing guide](./packages/eslint-config/src/rules/README.md#run-the-tests) for watch mode and focused coverage commands.

### Repository layout

```text
packages/eslint-config/
  src/configs/       Composable flat-config layers
  src/rules/         Custom rules, colocated tests, and rule documentation
  src/utils/         Internal utilities and their tests
  scripts/           ESLint rule-type generation
  vite.config.ts     Package build and test configuration
eslint.config.ts     Workspace composition of all ESLint layers
vite.config.ts       Shared formatting configuration
```

## Builds and releases

The ESLint package ships ESM `.js` files and `.d.ts` declarations with stable paths matching the source structure.
Plugins are not bundled, and builds emit no source maps or hashed chunks. The package's `prepack` hook rebuilds the
library before a tarball is created; building alone does not publish anything.

See [Build and package](./packages/eslint-config/README.md#build-and-package) for the distinction between building the
library and creating a package-manager tarball.

Pushing a `v*` tag triggers the [publish workflow](./.github/workflows/publish.yml), which checks the package version,
runs type checking, tests, and the build, then publishes to npm using trusted publishing (OIDC).
The tag must match the `version` in the [package manifest](./packages/eslint-config/package.json), prefixed with `v`.

## License

MIT.
