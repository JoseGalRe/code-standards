import parser from '@typescript-eslint/parser';
import { Linter, RuleTester } from 'eslint';

import { custom } from '../../configs/custom.ts';
import { noInlineTypeImports } from '../no-inline-type-imports/no-inline-type-imports.ts';
import { noParamDestructuring } from '../no-param-destructuring/no-param-destructuring.ts';

import { noDuplicateImports } from './no-duplicate-imports.ts';

import type { RuleOptions } from '../../rules.ts';

type DuplicateImportOptions = NonNullable<Extract<
  NonNullable<RuleOptions['custom/no-duplicate-imports']>,
  readonly unknown[]
>[1]>;

const ruleTester = new RuleTester({ languageOptions: { parser } });

const rules = {
  'no-duplicate-imports': noDuplicateImports,
  'no-inline-type-imports': noInlineTypeImports,
  'no-param-destructuring': noParamDestructuring,
};

function createConfig(options: readonly [DuplicateImportOptions?] = []): Linter.Config {
  return {
    languageOptions: { parser },
    plugins: { custom: { rules } },
    rules: { 'custom/no-duplicate-imports': ['error', ...options] },
  };
}

ruleTester.run('custom/no-duplicate-imports', noDuplicateImports, {
  invalid: [
    {
      code: 'import first from "users";\nimport second from "users";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateImport' }],
      name: 'does not discard one of multiple default bindings',
      output: null,
    },
    {
      code: 'import type User from "users";\nimport type { Role } from "users";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateTypeImport' }],
      name: 'does not rewrite a default type binding as a named binding',
      output: null,
    },
    {
      code: 'import type { User } from "users";\nimport { User } from "users";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateImport' }],
      name: 'declines a merge with conflicting type and value local bindings',
      options: [{ preferInline: true }],
      output: null,
    },
    {
      code: 'import { User } from "users";\nimport { User } from "users";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateImport' }],
      name: 'deduplicates repeated identical local bindings',
      output: 'import { User } from "users";\n',
    },
    {
      code: 'import { a } from "users";\nimport { b } from "users";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateImport' }],
      name: 'still checks top-level imports when declared modules are ignored',
      options: [{ ignoreDeclareModules: true }],
      output: 'import { a, b } from "users";\n',
    },
    {
      code: 'export { a } from "users";\nexport { b } from "users";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateExport' }],
      name: 'still checks top-level exports when declared modules are ignored',
      options: [{ ignoreDeclareModules: true, includeExports: true }],
      output: null,
    },
    {
      code: 'import { a } from "users";\nimport { b } from "users";\nimport { c } from "users";',
      errors: [
        { data: { source: 'users' }, messageId: 'duplicateImport' },
        { data: { source: 'users' }, messageId: 'duplicateImport' },
      ],
      name: 'merges every named declaration in a single fix pass',
      output: 'import { a, b, c } from "users";\n\n',
    },
    {
      code: 'import type { User } from "users";\nimport type { Role } from "users";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateImport' }],
      name: 'keeps all-type groups erased when preferInline is enabled',
      options: [{ preferInline: true }],
      output: 'import type { User, Role } from "users";\n',
    },
    {
      code: 'import type { User } from "users";\nimport "setup";\nimport { createUser } from "users";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateImport' }],
      name: 'does not move a runtime import ahead of an intervening side-effect import',
      options: [{ preferInline: true }],
      output: '\nimport "setup";\nimport { type User, createUser } from "users";',
    },
    {
      code: 'import { a } from "users?raw";\nimport { b } from "users?raw";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateImport' }],
      name: 'preserves identical query strings when ignoring queries for detection',
      output: 'import { a, b } from "users?raw";\n',
    },
    {
      code: 'import { "user-name" as userName } from "users";\nimport { role } from "users";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateImport' }],
      name: 'preserves string-literal exported names',
      output: 'import { "user-name" as userName, role } from "users";\n',
    },
    {
      code: 'import { a /* keep */ } from "users";\nimport { b } from "users";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateImport' }],
      name: 'does not discard import comments',
      output: null,
    },
    {
      code: 'import first from "users" with { type: "json" };\nimport second from "users" with { type: "json" };',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateImport' }],
      name: 'does not discard import attributes',
      output: null,
    },
    {
      code: 'import "users";\nimport type { User } from "users";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateImport' }],
      name: 'does not erase an explicit side-effect import when merging with types',
      options: [{ preferInline: true }],
      output: null,
    },
    {
      code: 'import "users";\nimport "users";',
      errors: [{ data: { source: 'users' }, messageId: 'duplicateImport' }],
      name: 'merges repeated side-effect imports without adding a binding clause',
      output: 'import "users";\n',
    },
    {
      code: 'import { first } from \'./users\';\nimport { second } from \'./users\';',
      errors: [{ column: 1, data: { source: './users' }, line: 2, messageId: 'duplicateImport' }],
      name: 'merges named value imports',
      output: 'import { first, second } from \'./users\';\n',
    },
    {
      code: 'import type { User } from \'./users\';\nimport type { Role } from \'./users\';',
      errors: [{ data: { source: './users' }, messageId: 'duplicateTypeImport' }],
      name: 'merges dedicated type imports',
      output: 'import type { User, Role } from \'./users\';\n',
    },
    {
      code: 'import { User as LocalUser } from \'./users\';\nimport { Role as LocalRole } from \'./users\';',
      errors: [{ data: { source: './users' }, messageId: 'duplicateImport' }],
      name: 'preserves named import aliases',
      output: 'import { User as LocalUser, Role as LocalRole } from \'./users\';\n',
    },
    {
      code: 'import { User as FirstUser } from \'./users\';\nimport { User as SecondUser } from \'./users\';',
      errors: [{ data: { source: './users' }, messageId: 'duplicateImport' }],
      name: 'preserves distinct local aliases of the same exported name',
      output: 'import { User as FirstUser, User as SecondUser } from \'./users\';\n',
    },
    {
      code: 'import { first } from \'./users?raw\';\nimport { second } from \'./users?url\';',
      errors: [{ data: { source: './users' }, messageId: 'duplicateImport' }],
      name: 'reports normalized query duplicates without changing module semantics',
      output: null,
    },
    {
      code: 'import { first } from \'./users?raw\';\nimport { second } from \'./users?raw\';',
      errors: [{ data: { source: './users?raw' }, messageId: 'duplicateImport' }],
      name: 'merges identical query strings when they are considered',
      options: [{ considerQueryString: true }],
      output: 'import { first, second } from \'./users?raw\';\n',
    },
    {
      code: 'export { first } from \'./users\';\nexport { second } from \'./users\';',
      errors: [{ data: { source: './users' }, messageId: 'duplicateExport' }],
      name: 'reports duplicate named exports without an autofix',
      options: [{ includeExports: true }],
      output: null,
    },
    {
      code: 'export type { User } from \'./users\';\nexport type { Role } from \'./users\';',
      errors: [{ data: { source: './users' }, messageId: 'duplicateTypeExport' }],
      name: 'reports duplicate type exports without an autofix',
      options: [{ includeExports: true }],
      output: null,
    },
    {
      code: 'export { first } from \'./users\';\nexport { second } from \'./users\';\nexport { third } from \'./users\';',
      errors: [
        { data: { source: './users' }, line: 2, messageId: 'duplicateExport' },
        { data: { source: './users' }, line: 3, messageId: 'duplicateExport' },
      ],
      name: 'reports every export after the first declaration',
      options: [{ includeExports: true }],
      output: null,
    },
    {
      code: 'declare module "users" { import { first } from "source"; import { second } from "source"; }',
      errors: [{ data: { source: 'source' }, messageId: 'duplicateImport' }],
      name: 'checks ambient module imports by default',
      output: 'declare module "users" { import { first, second } from "source";  }',
    },
    {
      code: 'declare module "users" { export { first } from "source"; export { second } from "source"; }',
      errors: [{ data: { source: 'source' }, messageId: 'duplicateExport' }],
      name: 'checks ambient module exports by default',
      options: [{ includeExports: true }],
      output: null,
    },
  ],
  valid: [
    {
      code: 'declare module "a" { import { x } from "users"; } declare module "b" { import { y } from "users"; }',
      name: 'does not conflate imports in separate ambient module scopes',
    },
    {
      code: 'declare module "a" { export { x } from "users"; } declare module "b" { export { y } from "users"; }',
      name: 'does not conflate exports in separate ambient module scopes',
      options: [{ includeExports: true }],
    },
    { code: 'import { first } from \'./users\';', name: 'allows a single import' },
    {
      code: 'import { first } from \'./users\';\nimport { second } from \'./roles\';',
      name: 'allows different sources',
    },
    {
      code: 'import { createUser } from \'./users\';\nimport type { User } from \'./users\';',
      name: 'keeps value and type declarations in separate groups by default',
    },
    {
      code: 'import { createUser } from \'./users\';\nimport type { User } from \'./users\';',
      name: 'keeps value and type declarations separate with preferInline disabled explicitly',
      options: [{ preferInline: false }],
    },
    {
      code: 'import { first } from \'./users?raw\';\nimport { second } from \'./users?url\';',
      name: 'allows different query strings when they are considered',
      options: [{ considerQueryString: true }],
    },
    {
      code: 'declare module "users" { import { first } from "source"; import { second } from "source"; }',
      name: 'ignores ambient module imports when configured',
      options: [{ ignoreDeclareModules: true }],
    },
    {
      code: 'declare module "users" { export { first } from "source"; export { second } from "source"; }',
      name: 'ignores ambient module exports when configured',
      options: [{ ignoreDeclareModules: true, includeExports: true }],
    },
    {
      code: 'declare module "users" { namespace nested { import { a } from "source"; import { b } from "source"; } }',
      name: 'ignores imports nested inside an ambient module',
      options: [{ ignoreDeclareModules: true }],
    },
    {
      code: 'export { first } from \'./users\';\nexport type { User } from \'./users\';',
      name: 'keeps type and value exports in separate groups',
      options: [{ includeExports: true }],
    },
    { code: 'const first = 1; const second = 2; export { first, second };', name: 'ignores local exports' },
    {
      code: 'import { first } from \'./users\';\nexport { second } from \'./users\';',
      name: 'tracks imports and exports separately',
      options: [{ includeExports: true }],
    },
  ],
});

describe('no-duplicate-imports: integration', () => {
  it('registers the custom layer without an aggregate configuration', () => {
    expect(custom()).toMatchObject({
      name: 'custom',
      plugins: { custom: { rules } },
    });
  });

  it('applies compatible fixes from all three rules and reaches a stable result', () => {
    const code = [
      'import { createUser } from \'./users\';',
      'import { createRole } from \'./users\';',
      'import type { User } from \'./users\';',
      'import type { Role } from \'./users\';',
      'import { createSession, type Session } from \'./sessions\';',
      'function read({ id }: User) { return id; }',
    ].join('\n');

    const config: Linter.Config = {
      languageOptions: { parser },
      plugins: { custom: { rules } },
      rules: {
        'custom/no-duplicate-imports': ['error', { considerQueryString: true }],
        'custom/no-inline-type-imports': 'error',
        'custom/no-param-destructuring': 'error',
      },
    };

    const linter = new Linter();
    const result = linter.verifyAndFix(code, config);

    expect(result.messages).toEqual([]);

    expect(result.output).toBe(
      [
        'import { createUser, createRole } from \'./users\';',
        '',
        'import type { User, Role } from \'./users\';',
        '',
        'import { createSession } from \'./sessions\';',
        'import type { Session } from \'./sessions\';',
        'function read(props: User) {',
        'const { id } = props;',
        ' return id; }',
      ].join('\n'),
    );

    expect(linter.verifyAndFix(result.output, config)).toEqual({ fixed: false, messages: [], output: result.output });
  });

  it('does not carry duplicate tracking across files', () => {
    const config = createConfig();
    const linter = new Linter();
    const code = 'import { createUser } from \'./users\';';

    expect(linter.verify(code, config, 'first.js')).toEqual([]);
    expect(linter.verify(code, config, 'second.js')).toEqual([]);
  });

  it('preserves mixed import bindings across overlapping autofix passes', () => {
    const config: Linter.Config = {
      ...createConfig(),
      rules: {
        'custom/no-duplicate-imports': 'error',
        'custom/no-inline-type-imports': 'error',
      },
    };

    const code = [
      'import users, { createUser as create, type User as LocalUser } from "users";',
      'import { createRole } from "users";',
      'import type { Role } from "users";',
    ].join('\n');

    const linter = new Linter();
    const result = linter.verifyAndFix(code, config);

    expect(result.messages).toEqual([]);
    expect(result.output).toContain('import users, { createUser as create, createRole } from "users";');
    expect(result.output).toContain('import type { User as LocalUser, Role } from "users";');
    expect(linter.verifyAndFix(result.output, config)).toMatchObject({ fixed: false, messages: [] });
  });
});

describe('no-duplicate-imports: regressions', () => {
  it.each([
    { name: 'the default options', options: [] },
    { name: 'includeExports explicitly disabled', options: [{ includeExports: false }] },
  ] as const)('does not report exports with $name', ({ options }) => {
    const messages = new Linter().verify(
      'export { first } from \'./users\';\nexport { second } from \'./users\';',
      createConfig(options),
    );

    expect(messages).toEqual([]);
  });

  it('normalizes export query strings when considerQueryString is false', () => {
    const config = createConfig([{ considerQueryString: false, includeExports: true }]);
    const messages = new Linter().verify('export { first } from "users?raw";\nexport { second } from "users?url";', config);

    expect(messages).toMatchObject([{ messageId: 'duplicateExport' }]);
  });

  it.each([
    {
      code: 'import users from \'./users\';\nimport { createUser } from \'./users\';',
      name: 'a default import',
      options: [],
      output: 'import users, { createUser } from \'./users\';\n',
    },
    {
      code: 'import * as users from \'./users\';\nimport { createUser } from \'./users\';',
      name: 'a namespace import by declining an unsafe merge',
      options: [],
      output: 'import * as users from \'./users\';\nimport { createUser } from \'./users\';',
    },
    {
      code: 'import { createUser } from \'./users\';\nimport type { User } from \'./users\';',
      name: 'a type modifier when preferInline is enabled',
      options: [{ preferInline: true }],
      output: 'import { createUser, type User } from \'./users\';\n',
    },
    {
      code: 'import { type User } from \'./users\';\nimport { createUser } from \'./users\';',
      name: 'an existing inline type modifier',
      options: [],
      output: 'import { type User, createUser } from \'./users\';\n',
    },
  ] as const)('preserves $name', ({ code, options, output }) => {
    expect(new Linter().verifyAndFix(code, createConfig(options)).output).toBe(output);
  });
});
