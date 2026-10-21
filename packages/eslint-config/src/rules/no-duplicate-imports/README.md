# `custom/no-duplicate-imports`

Detect repeated import declarations from the same module. Dedicated `import type` declarations and value imports
belong to separate groups by default. Named re-exports are tracked separately from imports, and type exports
separately from value exports.

## Usage

The `custom()` configuration layer registers the `custom` plugin. Add this to a following override's `rules` object:

```ts
'custom/no-duplicate-imports': ['error', {
  considerQueryString: true,
  ignoreDeclareModules: true,
  includeExports: true,
  preferInline: false,
}],
```

See the [custom rules guide](../README.md#usage) for full setup.

## Examples

Invalid:

```ts
import { createUser } from './users';
import { deleteUser } from './users';
```

Valid, and the autofix result for these named imports:

```ts
import { createUser, deleteUser } from './users';
```

Valid with the rule defaults:

```ts
import { createUser } from './users';
import type { User } from './users';
```

Duplicate dedicated type imports are merged into a single `import type` statement. Default value imports, named
import aliases, string-literal exported names, and inline `type` modifiers are preserved when a merge is safe.
Duplicate named re-exports produce reports but have no autofix.

## Options

These are **rule defaults**, not necessarily the shared preset values.

- `considerQueryString` (`boolean`, default `false`): include the query string in import identity when `true`.
  With `false`, `./users?raw` and `./users?url` count as the same source for both imports and named re-exports.
  Different query strings are reported without an autofix; identical query strings are preserved when merging.
  Use `true` to allow imports whose queries select different module behavior.
- `ignoreDeclareModules` (`boolean`, default `false`): skip imports and named re-exports inside an ancestor
  `declare module`, including nested namespaces.
- `includeExports` (`boolean`, default `false`): enable duplicate named re-export checks.
- `preferInline` (`boolean`, default `false`): group dedicated type imports with value imports when `true`.
  Merged type specifiers retain their `type` modifier; groups containing only dedicated type declarations remain
  `import type`. Keep `false` when using `custom/no-inline-type-imports`, since the two styles conflict.

## Autofix boundaries

Duplicates are checked within their declaration scope, not across separate ambient modules. Fixes merge the
whole duplicate group in one pass and keep the replacement at the first runtime import, if present, so merging
type and value declarations does not move a runtime dependency ahead of intervening imports.

The rule reports without fixing groups containing namespace imports, multiple default bindings, default type
imports, import attributes, comments inside declarations, or different full module specifiers (including query strings).
It also declines a merge that would turn an explicit side-effect import into an erasable type-only declaration.

Only named re-exports are visited; `export *` declarations are outside the current check. An import and a re-export
from the same source do not count as duplicates of each other.

## Tests

[`no-duplicate-imports-test.ts`](./no-duplicate-imports-test.ts) covers diagnostics, named import fixes, aliases,
dedicated type imports, query handling, ambient modules, and named re-exports.

The same colocated suite includes regressions for option handling and binding preservation, plus integration tests
with the other custom rules. Each implementation must meet the configured per-file 100% coverage thresholds.

See [test commands](../README.md#run-the-tests).
