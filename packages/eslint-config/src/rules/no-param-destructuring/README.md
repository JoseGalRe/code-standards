# `custom/no-param-destructuring`

Report object and array destructuring directly in function parameters. Destructure the argument inside the body
instead, keeping the parameter list focused on argument names and types. By default, also report direct inline
object type annotations and require a named type instead.

The rule checks function declarations, function expressions, and arrow functions. It ignores signatures without a body.

## Usage

The `custom()` configuration layer registers the `custom` plugin. Add this to a following override's `rules` object:

```ts
'custom/no-param-destructuring': ['error', {
  autoIncrementDefaultPropName: true,
  defaultPropName: 'input',
  ignoreArrowFunctions: true,
  ignoreCallbackExpressions: true,
  ignoreNonBlockStatement: false,
  ignoreTypes: false,
}],
```

See the [custom rules guide](../README.md#usage) for full setup.

## Examples

Invalid with the rule defaults:

```ts
function read({ id }: { id: string }) {
  return id;
}
```

Valid:

```ts
type ReadProps = { id: string };

function read(props: ReadProps) {
  const { id } = props;

  return id;
}
```

The fixer replaces the pattern with the configured argument name, retains its TypeScript annotation and parameter
default initializer, and inserts destructuring at the start of a block body, after any directive prologue.
It supports object and array patterns, nested bindings, aliases, rest elements, and defaults inside a pattern.
All destructured parameters in a function are fixed together, in their original order. Bindings use `const`, or
`let` when reassigned. Original literal contents, comments, and multiline text are preserved; formatting is left
to the surrounding lint rules.

An expression-bodied arrow such as `({ id }) => id` is reported by default but has **no autofix**.

### Inline parameter object types

With the default `ignoreTypes: false`, this is also invalid, even though the value parameter is not destructured:

```ts
function read(props: { id: string }) {
  return props.id;
}
```

For a named function declaration, the fixer extracts the annotation into a PascalCase alias derived from the function:

```ts
type ReadProps = { id: string };

function read(props: ReadProps) {
  return props.id;
}
```

Existing names are preserved: if `ReadProps` is already used, the generated name becomes `ReadProps2`, and so on.
Multiple inline annotations receive distinct names. Existing named types are accepted without requiring a rename.
Type extraction and value destructuring may require successive ESLint fix passes.

`ignoreTypes: true` allows inline object annotations but does not permit destructuring values in the parameter list.
Function exclusions such as `ignoreArrowFunctions` apply to both checks. Return annotations and function signatures
without a body are outside this check, as are inline objects nested in a non-literal annotation such as `Array<{ id: string }>`.

## Options

These are **rule defaults**, not necessarily the shared preset values.

- `autoIncrementDefaultPropName` (`boolean`, default `false`): generate `props`, `props2`, and so on for successive
  fixable patterns across the file in a lint pass, skipping names that would collide or shadow existing references.
- `defaultPropName` (`string`, default `'props'`): replacement parameter name. Use a valid, non-conflicting identifier;
  invalid or reserved identifiers are reported without an autofix. Unicode identifiers are supported.
- `ignoreArrowFunctions` (`boolean`, default `false`): ignore all arrow functions, both block- and expression-bodied.
- `ignoreCallbackExpressions` (`boolean`, default `false`): ignore functions whose immediate parent is a
  `CallExpression`, such as callbacks passed directly to `map` or `filter`. This is a syntactic check, not callback analysis.
- `ignoreNonBlockStatement` (`boolean`, default `false`): ignore functions whose bodies are not block statements,
  such as expression-bodied arrows.
- `ignoreTypes` (`boolean`, default `false`): allow direct inline object type annotations in parameters when `true`.
  This does not disable the value-destructuring check.

## Autofix boundaries

The value-destructuring fixer is not offered when:

- The body is not a block statement.
- The function is a generator: moving parameter evaluation into its body would defer it until iteration.
- A generated name would collide or shadow a binding/reference and auto increment is disabled.
- A destructured binding is read or assigned during parameter initialization, including another parameter's default initializer.
- A later parameter has a default initializer: moving destructuring past it could reorder getters or other side effects.
- A destructured binding has another declaration in the function body.
- Scope analysis encounters `eval`, whose binding observations cannot be resolved statically.
- The configured replacement name is not a valid non-reserved identifier.

When any destructured parameter is unsafe, the whole function's value-parameter rewrite is declined rather than
applying a partial fix. Independent type extraction can still be offered.

Type extraction is offered only for named function declarations directly in a program or block, including named
exports. It is declined for function-scoped generics, annotations referencing function-local bindings, anonymous
functions, function/arrow expressions, and unsupported declaration scopes. These cases are still reported; extract
the type manually at a scope where its dependencies are available. Existing comments and export modifiers are retained.

## Tests

[`no-param-destructuring-test.ts`](./no-param-destructuring-test.ts) covers each function form, object/array patterns,
TypeScript annotations, custom names and incrementing, option exclusions, callbacks, TSX, and unfixable expression bodies.

The same colocated suite covers default patterns, collisions, literal contents, directives, parameter dependencies,
type alias extraction, public option types, and multiple autofix passes. Each implementation must meet the configured
per-file 100% coverage thresholds.

See [test commands](../README.md#run-the-tests).
