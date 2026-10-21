import parser from '@typescript-eslint/parser';
import { Linter, RuleTester } from 'eslint';

import { noInlineTypeImports } from './no-inline-type-imports.ts';

const ruleTester = new RuleTester({ languageOptions: { parser } });

ruleTester.run('custom/no-inline-type-imports', noInlineTypeImports, {
  invalid: [
    {
      code: 'import users, { createUser as create, type User as LocalUser } from "users";',
      errors: [{ data: { values: 'LocalUser' }, messageId: 'noInline' }],
      name: 'preserves default imports and aliases in both groups',
      output: 'import users, { createUser as create } from "users";\nimport type { User as LocalUser } from "users";',
    },
    {
      code: 'import { type "user-name" as UserName, type Role } from "users";',
      errors: [{ data: { values: 'UserName, Role' }, messageId: 'noInline' }],
      name: 'preserves string-literal type names without an empty runtime import',
      output: 'import type { "user-name" as UserName, Role } from "users";',
    },
    {
      code: 'import { createUser, type /* keep */ User } from "users";',
      errors: [{ data: { values: 'User' }, messageId: 'noInline' }],
      name: 'reports inline types without discarding comments',
      output: null,
    },
    {
      code: 'import data, { type Data } from "data" with { type: "json" };',
      errors: [{ data: { values: 'Data' }, messageId: 'noInline' }],
      name: 'reports inline types without discarding import attributes',
      output: null,
    },
    {
      code: 'import { createUser, type User } from \'./users\';',
      errors: [{ column: 1, data: { values: 'User' }, line: 1, messageId: 'noInline' }],
      name: 'separates an inline type from named value imports',
      output: 'import { createUser } from \'./users\';\nimport type { User } from \'./users\';',
    },
    {
      code: 'import { type User, createUser, type Role, createRole } from \'./users\';',
      errors: [{ data: { values: 'User, Role' }, messageId: 'noInline' }],
      name: 'preserves the order of multiple types and values',
      output: 'import { createUser, createRole } from \'./users\';\nimport type { User, Role } from \'./users\';',
    },
    {
      code: 'import { createUser, type User } from "./users";',
      errors: [{ data: { values: 'User' }, messageId: 'noInline' }],
      name: 'preserves the module quote style',
      output: 'import { createUser } from "./users";\nimport type { User } from "./users";',
    },
    {
      code: 'import {\n  type User,\n  createUser,\n} from \'./users\';',
      errors: [{ data: { values: 'User' }, messageId: 'noInline' }],
      name: 'handles multiline declarations',
      output: 'import { createUser } from \'./users\';\nimport type { User } from \'./users\';',
    },
  ],
  valid: [
    { code: 'import { createUser } from \'./users\';', name: 'allows named value imports' },
    { code: 'import type { User, Role } from \'./users\';', name: 'allows a dedicated type import' },
    {
      code: 'import { createUser } from \'./users\';\nimport type { User } from \'./users\';',
      name: 'allows separate value and type declarations from the same source',
    },
    { code: 'import users from \'./users\';', name: 'allows default value imports' },
    { code: 'import * as users from \'./users\';', name: 'allows namespace value imports' },
    { code: 'import \'./setup\';', name: 'allows side-effect imports' },
    { code: 'import type User from \'./users\';', name: 'allows default type imports' },
    { code: 'import type * as Users from \'./users\';', name: 'allows namespace type imports' },
    { code: 'export type { User } from \'./users\';', name: 'does not check re-exports' },
    { code: 'type User = import(\'./users\').User;', name: 'does not check import type expressions' },
  ],
});

describe('no-inline-type-imports: regressions', () => {
  it.each([
    {
      code: 'import users, { type User } from \'./users\';',
      name: 'a default value import',
      output: 'import users from \'./users\';\nimport type { User } from \'./users\';',
    },
    {
      code: 'import { createUser as create, type User } from \'./users\';',
      name: 'a named value alias',
      output: 'import { createUser as create } from \'./users\';\nimport type { User } from \'./users\';',
    },
    {
      code: 'import { createUser, type User as LocalUser } from \'./users\';',
      name: 'a named type alias',
      output: 'import { createUser } from \'./users\';\nimport type { User as LocalUser } from \'./users\';',
    },
    {
      code: 'import { type User } from \'./users\';',
      name: 'type-only imports without adding a runtime import',
      output: 'import type { User } from \'./users\';',
    },
  ])('preserves $name', ({ code, output }) => {
    const result = new Linter().verifyAndFix(code, {
      languageOptions: { parser },
      plugins: { custom: { rules: { 'no-inline-type-imports': noInlineTypeImports } } },
      rules: { 'custom/no-inline-type-imports': 'error' },
    });

    expect(result.output).toBe(output);
  });
});
