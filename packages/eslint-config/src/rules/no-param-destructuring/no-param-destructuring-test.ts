import parser from '@typescript-eslint/parser';
import { Linter, RuleTester } from 'eslint';

import { noParamDestructuring } from './no-param-destructuring.ts';

import type { RuleOptions } from '../../rules.ts';

type ParamOptions = NonNullable<Extract<NonNullable<RuleOptions['custom/no-param-destructuring']>, readonly unknown[]>[1]>;

const ruleTester = new RuleTester({ languageOptions: { parser } });

function createConfig(options: readonly [ParamOptions?] = []): Linter.Config {
  return {
    languageOptions: { parser },
    plugins: { custom: { rules: { 'no-param-destructuring': noParamDestructuring } } },
    rules: { 'custom/no-param-destructuring': ['error', ...options] },
  };
}

ruleTester.run('custom/no-param-destructuring: inline types', noParamDestructuring, {
  invalid: [
    {
      code: 'class Reader { constructor(public props: { id: string }) {} }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'reports inline types in TypeScript parameter properties without an unsafe extraction',
      output: null,
    },
    {
      code: 'function read(props: { id: string }) { return props.id; }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'extracts an inline object type into a function-derived PascalCase alias by default',
      output: 'type ReadProps = { id: string };\n\nfunction read(props: ReadProps) { return props.id; }',
    },
    {
      code: 'export function read(props: { id: string }) { return props.id; }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'extracts the alias before an exported function declaration',
      options: [{ ignoreTypes: false }],
      output: 'type ReadProps = { id: string };\n\nexport function read(props: ReadProps) { return props.id; }',
    },
    {
      code: '/** Read an item. */\nfunction read(props: { id: string }) { return props.id; }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'preserves documentation attached to the original function',
      output: 'type ReadProps = { id: string };\n\n/** Read an item. */\nfunction read(props: ReadProps) { return props.id; }',
    },
    {
      code: 'export default function read(props: { id: string }) { return props.id; }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'extracts types from a named default export without changing its export',
      output: 'type ReadProps = { id: string };\n\nexport default function read(props: ReadProps) { return props.id; }',
    },
    {
      code: 'export default function (props: { id: string }) { return props.id; }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'does not invent a type name for an anonymous declaration',
      output: null,
    },
    {
      code: 'function read<T>(props: { value: T }) { return props.value; }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'does not hoist a function-scoped generic type parameter',
      output: null,
    },
    {
      code: 'function read(id: string, props: { value: typeof id }) { return props.value; }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'does not hoist a type query that depends on another parameter',
      output: null,
    },
    {
      code: 'function read(props: { args: typeof arguments }) { return props.args; }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'does not hoist an annotation that depends on implicit function bindings',
      output: null,
    },
    {
      code: 'function read(id: string, props: { get(): typeof id }) { return props.get(); }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'preserves local type queries nested inside member signatures',
      output: null,
    },
    {
      code: 'namespace Readers { export function read(props: { id: string }) { return props.id; } }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'reports unsupported declaration scopes without inserting an invalid alias',
      output: null,
    },
    {
      code: 'const read = (props: { id: string }) => props.id;',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'reports inline arrow parameter types without inventing a declaration owner',
      output: null,
    },
    {
      code: 'type ReadProps = { previous: boolean };\nfunction read(props: { id: string }) { return props.id; }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'does not overwrite or shadow an existing type with the derived name',
      output: 'type ReadProps = { previous: boolean };\ntype ReadProps2 = { id: string };\n\n'
        + 'function read(props: ReadProps2) { return props.id; }',
    },
    {
      code: 'function read(props: { id?: string } = {}) { return props.id; }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'preserves an identifier parameter default when extracting its type',
      output: 'type ReadProps = { id?: string };\n\nfunction read(props: ReadProps = {}) { return props.id; }',
    },
    {
      code: 'function outer<T>() { function read(props: { value: T }) { return props.value; } }',
      errors: [{ messageId: 'noInlineParamType' }],
      name: 'keeps aliases inside the surrounding block where outer generic types remain visible',
      output: 'function outer<T>() { type ReadProps = { value: T };\n\n'
        + 'function read(props: ReadProps) { return props.value; } }',
    },
  ],
  valid: [
    { code: 'function read(props: ReadProps) { return props.id; }', name: 'allows named parameter types' },
    {
      code: 'function read(props: { id: string }) { return props.id; }',
      name: 'allows inline object types when ignoreTypes is enabled',
      options: [{ ignoreTypes: true }],
    },
  ],
});

ruleTester.run('custom/no-param-destructuring', noParamDestructuring, {
  invalid: [
    {
      code: 'function read({ id } // keep\n: { id: string }) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'preserves a line comment between the pattern and its annotation',
      options: [{ ignoreTypes: true }],
      output: 'function read(props: { id: string }) {\nconst { id } // keep\n = props;\n return id; }',
    },
    {
      code: 'function read({ id }, { name = (id = 2) }) { return name; }',
      errors: [{ messageId: 'noParamDestructuring' }, { messageId: 'noParamDestructuring' }],
      name: 'does not move writes performed during another pattern initializer',
      options: [{ autoIncrementDefaultPropName: true }],
      output: null,
    },
    {
      code: 'function* read({ id }) { yield id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'does not defer generator parameter evaluation until iteration',
      output: null,
    },
    {
      code: 'function read({ id }, { name = id }) { return name; }',
      errors: [{ messageId: 'noParamDestructuring' }, { messageId: 'noParamDestructuring' }],
      name: 'declines the whole rewrite when another pattern initializer reads a binding',
      options: [{ autoIncrementDefaultPropName: true }],
      output: null,
    },
    {
      code: 'function read({ id /* keep */ }) { "first"; "second"; return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'preserves pattern comments and the entire directive prologue',
      output: 'function read(props) { "first"; "second";\nconst { id /* keep */ } = props;\n return id; }',
    },
    {
      code: 'function read({ id } = {}) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'preserves a default parameter initializer',
      output: 'function read(props = {}) {\nconst { id } = props;\n return id; }',
    },
    {
      code: 'function read({ id }: { id?: string } = {}) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'preserves a typed default parameter initializer',
      options: [{ ignoreTypes: true }],
      output: 'function read(props: { id?: string } = {}) {\nconst { id } = props;\n return id; }',
    },
    {
      code: 'function read([id] = []) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'preserves a default array parameter initializer',
      output: 'function read(props = []) {\nconst [id] = props;\n return id; }',
    },
    {
      code: 'function read({ first }, [second]) { return first + second; }',
      errors: [{ messageId: 'noParamDestructuring' }, { messageId: 'noParamDestructuring' }],
      name: 'fixes all destructured parameters together in their original order',
      options: [{ autoIncrementDefaultPropName: true }],
      output: 'function read(props, props2) {\nconst { first } = props;\nconst [second] = props2;\n return first + second; }',
    },
    {
      code: 'function read({ id }, props) { return id + props; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'skips conflicting names when auto increment is enabled',
      options: [{ autoIncrementDefaultPropName: true }],
      output: 'function read(props2, props) {\nconst { id } = props2;\n return id + props; }',
    },
    {
      code: 'function read({ id }) { return () => props + id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'does not shadow an outer binding referenced by a nested closure',
      output: null,
    },
    {
      code: 'function read({ id }) { id += 1; return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'keeps reassigned bindings mutable',
      output: 'function read(props) {\nlet { id } = props;\n id += 1; return id; }',
    },
    {
      code: 'function read({ id }: { id: "two  spaces" }) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'preserves repeated spaces in type literal annotations',
      options: [{ ignoreTypes: true }],
      output: 'function read(props: { id: "two  spaces" }) {\nconst { id } = props;\n return id; }',
    },
    {
      code: 'function read({ id }, other = initialize()) { return id + other; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'does not reorder destructuring before a later parameter initializer',
      output: null,
    },
    {
      code: 'function read({ id }) { var id; return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'does not introduce a lexical binding that conflicts with an existing declaration',
      output: null,
    },
    {
      code: 'function read({ id }) { return eval("id"); }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'does not rewrite bindings observed by direct eval',
      output: null,
    },
    {
      code: 'function read({ id }) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'does not generate an invalid parameter identifier',
      options: [{ defaultPropName: 'not-valid' }],
      output: null,
    },
    {
      code: 'function read({ id }) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'does not generate a reserved parameter identifier',
      options: [{ defaultPropName: 'await' }],
      output: null,
    },
    {
      code: 'function read({ id }) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'supports Unicode parameter names',
      options: [{ defaultPropName: 'entradaÑ' }],
      output: 'function read(entradaÑ) {\nconst { id } = entradaÑ;\n return id; }',
    },
    {
      code: 'function read({ id }) { return id; }',
      errors: [{ column: 15, line: 1, messageId: 'noParamDestructuring' }],
      name: 'moves an object pattern into a function declaration body',
      output: 'function read(props) {\nconst { id } = props;\n return id; }',
    },
    {
      code: 'const read = function ({ id }) { return id; };',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'checks function expressions',
      output: 'const read = function (props) {\nconst { id } = props;\n return id; };',
    },
    {
      code: 'const read = ({ id }) => { return id; };',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'checks block-bodied arrow functions by default',
      output: 'const read = (props) => {\nconst { id } = props;\n return id; };',
    },
    {
      code: 'const read = ({ id }) => id;',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'reports expression-bodied arrows without offering an unsafe fix',
      output: null,
    },
    {
      code: 'function read([first, ...rest]) { return first; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'moves array patterns including rest elements',
      output: 'function read(props) {\nconst [first, ...rest] = props;\n return first; }',
    },
    {
      code: 'function read({ user: { id }, name = "guest", ...rest }) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'preserves nested bindings, aliases, defaults and object rest',
      output: 'function read(props) {\nconst { user: { id }, name = "guest", ...rest } = props;\n return id; }',
    },
    {
      code: 'function read({ id }: { id: string }) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'preserves a TypeScript parameter annotation',
      options: [{ ignoreTypes: true }],
      output: 'function read(props: { id: string }) {\nconst { id } = props;\n return id; }',
    },
    {
      code: 'function read([id]: [string]) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'preserves a tuple annotation',
      output: 'function read(props: [string]) {\nconst [id] = props;\n return id; }',
    },
    {
      code: 'function read({\n  id,\n}: {\n  id: string;\n}) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'preserves multiline patterns and annotations',
      options: [{ ignoreTypes: true }],
      output: 'function read(props: {\n  id: string;\n}) {\nconst {\n  id,\n} = props;\n return id; }',
    },
    {
      code: 'function read({ id }) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'uses a custom parameter name',
      options: [{ defaultPropName: 'input' }],
      output: 'function read(input) {\nconst { id } = input;\n return id; }',
    },
    {
      code: 'function first({ id }) {} function second({ name }) {}',
      errors: [{ messageId: 'noParamDestructuring' }, { messageId: 'noParamDestructuring' }],
      name: 'increments generated parameter names across the file',
      options: [{ autoIncrementDefaultPropName: true, defaultPropName: 'input' }],
      output: 'function first(input) {\nconst { id } = input;\n} function second(input2) {\nconst { name } = input2;\n}',
    },
    {
      code: 'function first({ id }) {} function second({ name }) {}',
      errors: [{ messageId: 'noParamDestructuring' }, { messageId: 'noParamDestructuring' }],
      name: 'reuses the default name in separate functions without auto increment',
      output: 'function first(props) {\nconst { id } = props;\n} function second(props) {\nconst { name } = props;\n}',
    },
    {
      code: 'items.map(function ({ id }) { return id; });',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'checks callback expressions by default',
      output: 'items.map(function (props) {\nconst { id } = props;\n return id; });',
    },
    {
      code: 'function read({ id }) { return id; }',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'still checks declarations when arrow functions are ignored',
      options: [{ ignoreArrowFunctions: true }],
      output: 'function read(props) {\nconst { id } = props;\n return id; }',
    },
    {
      code: 'const read = function ({ id }) { return id; };',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'still checks non-callback expressions when callbacks are ignored',
      options: [{ ignoreCallbackExpressions: true }],
      output: 'const read = function (props) {\nconst { id } = props;\n return id; };',
    },
    {
      code: 'const read = ({ id }) => { return id; };',
      errors: [{ messageId: 'noParamDestructuring' }],
      name: 'still checks block bodies when non-block bodies are ignored',
      options: [{ ignoreNonBlockStatement: true }],
      output: 'const read = (props) => {\nconst { id } = props;\n return id; };',
    },
  ],
  valid: [
    { code: 'function read(props) { const { id } = props; return id; }', name: 'allows destructuring in the body' },
    { code: 'function read(id: string) { return id; }', name: 'allows identifier parameters' },
    { code: 'function read() {}', name: 'allows functions without parameters' },
    { code: 'function read(...items: string[]) { return items; }', name: 'allows identifier rest parameters' },
    { code: 'declare function read({ id }: { id: string }): string;', name: 'ignores signatures without a body' },
    {
      code: 'const read = ({ id }) => { return id; };',
      name: 'ignores block-bodied arrows when configured',
      options: [{ ignoreArrowFunctions: true }],
    },
    {
      code: 'const read = ({ id }) => id;',
      name: 'ignores expression-bodied arrows when configured',
      options: [{ ignoreArrowFunctions: true }],
    },
    {
      code: 'items.map(({ id }) => id);',
      name: 'ignores arrow callbacks when configured',
      options: [{ ignoreCallbackExpressions: true }],
    },
    {
      code: 'items.map(function ({ id }) { return id; });',
      name: 'ignores function expression callbacks when configured',
      options: [{ ignoreCallbackExpressions: true }],
    },
    {
      code: 'const read = ({ id }) => id;',
      name: 'ignores non-block bodies when configured',
      options: [{ ignoreNonBlockStatement: true }],
    },
    {
      code: 'const Component = ({ id }: { id: string }) => <span>{id}</span>;',
      filename: 'component.tsx',
      name: 'supports ignored TSX arrow components',
      options: [{ ignoreArrowFunctions: true }],
    },
  ],
});

describe('no-param-destructuring: regressions', () => {
  it('accepts ignoreTypes through the public typed rule configuration', () => {
    const messages = new Linter().verify(
      'function read(props: { id: string }) { return props.id; }',
      createConfig([{ ignoreTypes: true }]),
    );

    expect(messages).toEqual([]);
  });

  it('applies type extraction and value destructuring fixes until the result is stable', () => {
    const config = createConfig();
    const linter = new Linter();
    const result = linter.verifyAndFix('function read({ id }: { id: string }) { return id; }', config);

    expect(result.messages).toEqual([]);

    expect(result.output).toBe('type ReadProps = { id: string };\n\n'
      + 'function read(props: ReadProps) {\nconst { id } = props;\n return id; }');

    expect(linter.verifyAndFix(result.output, config)).toMatchObject({ fixed: false, messages: [] });
  });

  it('extracts multiple parameter types without duplicate alias names across fix passes', () => {
    const result = new Linter().verifyAndFix(
      'function read(first: { id: string }, second: { active: boolean }) {}',
      createConfig(),
    );

    expect(result.messages).toEqual([]);
    expect(result.output).toContain('type ReadProps = { id: string };');
    expect(result.output).toContain('type ReadProps2 = { active: boolean };');
    expect(result.output).toContain('function read(first: ReadProps, second: ReadProps2)');
  });

  it('does not carry generated type names between files', () => {
    const config = createConfig();
    const linter = new Linter();
    const code = 'function read(props: { id: string }) {}';

    expect(linter.verifyAndFix(code, config, 'first.js').output).toBe(linter.verifyAndFix(code, config, 'second.js').output);
  });

  it('reports patterns wrapped in a default parameter assignment', () => {
    const messages = new Linter().verify('function read({ id } = {}) { return id; }', createConfig());

    expect(messages).toMatchObject([{ messageId: 'noParamDestructuring' }]);
  });

  it.each([
    {
      code: 'function read({ id }, props) { return id; }',
      name: 'does not offer a fix that collides with an existing parameter',
      options: [],
      output: 'function read({ id }, props) { return id; }',
    },
    {
      code: 'function read({ name = "two  spaces" }) { return name; }',
      name: 'preserves whitespace inside string literals',
      options: [],
      output: 'function read(props) {\nconst { name = "two  spaces" } = props;\n return name; }',
    },
    {
      code: 'function read({ id }) { "use client"; return id; }',
      name: 'preserves the directive prologue',
      options: [],
      output: 'function read(props) { "use client";\nconst { id } = props;\n return id; }',
    },
    {
      code: 'function read({ id }, fallback = id) { return fallback; }',
      name: 'does not move bindings used by another parameter initializer',
      options: [],
      output: 'function read({ id }, fallback = id) { return fallback; }',
    },
  ] as const)('$name', ({ code, options, output }) => {
    expect(new Linter().verifyAndFix(code, createConfig(options)).output).toBe(output);
  });

  it('keeps generated names unique across multiple autofix passes', () => {
    const result = new Linter().verifyAndFix(
      'function read({ first }, { second }) { return first + second; }',
      createConfig([{ autoIncrementDefaultPropName: true }]),
    );

    expect(result).toMatchObject({ messages: [], output: expect.stringMatching(/^function read\(props, props2\)/) });
  });
});
