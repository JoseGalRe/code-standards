# Custom ESLint rules

Local rules registered under the `custom` plugin namespace by the opt-in `custom()` configuration layer.

- [`custom/no-duplicate-imports`](./no-duplicate-imports/README.md): detect repeated imports and named re-exports.
- [`custom/no-inline-type-imports`](./no-inline-type-imports/README.md): separate inline type imports from value imports.
- [`custom/no-param-destructuring`](./no-param-destructuring/README.md): move value destructuring into the body and use named parameter object types.

## Usage

The `custom()` layer enables all three rules for TypeScript and TSX. Its canonical preset options live in
[`src/configs/custom.ts`](../configs/custom.ts). The rule READMEs describe each rule's own defaults, which can differ
from that preset.

In a consumer's `eslint.config.ts`, select the custom layer alongside a TypeScript parser configuration and
override only the options you need. Other configuration layers are chosen separately by the consumer:

```ts
import { custom } from '@josegalre/code-standards-eslint/custom';
import parser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser },
  },
  custom(),
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'custom/no-duplicate-imports': ['error', { considerQueryString: true }],
      'custom/no-inline-type-imports': 'error',
      'custom/no-param-destructuring': [
        'error',
        {
          defaultPropName: 'input',
          ignoreArrowFunctions: true,
          ignoreTypes: false,
        },
      ],
    },
  },
);
```

Use the `/custom` entry point to avoid loading unrelated optional plugins. The root still reexports all configuration
layers and requires their peers. The rule implementations are internal; do not rely on unexported implementation paths.

The rules report violations without an autofix when a supported safe transformation is unavailable.
Each rule README documents those boundaries; fix those cases manually rather than discarding bindings or metadata.

## Run the tests

Run these commands from the monorepo root, using the existing workspace dependencies:

```sh
# Only custom rule tests and their integration/regression cases.
vp run @josegalre/code-standards-eslint#test src/rules

# All package tests, including the existing JSON Schema utility tests.
vp run @josegalre/code-standards-eslint#test

# One rule's main test suite.
vp run @josegalre/code-standards-eslint#test src/rules/no-param-destructuring

# Watch all custom rule tests.
vp run @josegalre/code-standards-eslint#test:watch src/rules

# Coverage for the three rule implementations, including per-file 100% thresholds.
vp run @josegalre/code-standards-eslint#test:coverage src/rules --coverage.include='src/rules/no-*/*.ts'
```

`vite.config.ts` discovers both `*-test.ts` and `*.test.ts` files in `src`, runs in Node, and enables globals
for the existing utility tests. [`setup.ts`](../test/setup.ts) connects ESLint's `RuleTester` to the Vitest APIs exposed
by `vite-plus/test`. Without a global Vite+ installation, launch `vp` with `pnpm exec vp`.

## Test structure

Each rule has a colocated `*-test.ts` suite using ESLint `RuleTester` with `@typescript-eslint/parser`:

- `valid` cases assert that accepted code produces no reports.
- `invalid` cases assert message IDs, interpolated message data where applicable, and selected diagnostic locations.
- An exact `output` string checks a single autofix pass. `output: null` asserts that no fix is offered.
- Cases exercise rule defaults, configuration options, JavaScript and TypeScript syntax, and ignored contexts.

Regression tests live in each rule's own test file. They use the real `Linter` for multiple autofix passes,
stable output, and isolation between files. The duplicate-import rule's suite also covers integration with the other
two rules. All cases are normal tests: there are no expected failures, and reintroducing a defect fails the suite.

`vite.config.ts` requires 100% statements, branches, functions, and lines for each of the three rule implementations.
These thresholds do not apply to unrelated configuration or utility modules; the existing coverage exclusions are unchanged.

To add coverage, extend the corresponding rule's `valid` or `invalid` list. Use a regression test only for a
reproduced defect; never update an expected output simply to accept a lossy autofix.

## References

- [ESLint RuleTester](https://eslint.org/docs/latest/integrate/nodejs-api#ruletester)
- [Vitest test API](https://vitest.dev/api/test)
