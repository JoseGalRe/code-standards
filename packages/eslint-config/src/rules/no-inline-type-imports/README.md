# `custom/no-inline-type-imports`

Require inline `type` specifiers in import declarations to move into a dedicated `import type` declaration.
This separates type dependencies from value dependencies in source code.

## Usage

The rule has no options. With the plugin registered by the `custom()` configuration layer, use:

```ts
'custom/no-inline-type-imports': 'error',
```

See the [custom rules guide](../README.md#usage) for full setup.

## Examples

Invalid:

```ts
import { createUser, type User, type Role } from './users';
```

Valid, and the autofix result:

```ts
import { createUser } from './users';
import type { User, Role } from './users';
```

The rule leaves dedicated type imports, ordinary value imports, side-effect imports, re-exports, and
`import('./users').User` type expressions alone. For supported mixed named imports, the fixer preserves
the module's quote style and the relative order within each group. Default value imports, aliases, and string-literal
imported names are retained. A declaration containing only inline types becomes a single `import type` declaration,
without an empty value import.

## Autofix boundaries

Declarations containing import attributes or comments inside the declaration are reported without an autofix.
This avoids silently dropping metadata or comment attachments while rebuilding the import statements.

## Tests

[`no-inline-type-imports-test.ts`](./no-inline-type-imports-test.ts) covers accepted import forms, one or several
inline types, multiline declarations, diagnostic data, exact fixes, and quote preservation.

The same colocated suite includes regressions for default imports, aliases, and type-only output.
Each implementation must meet the configured per-file 100% coverage thresholds.

See [test commands](../README.md#run-the-tests).
