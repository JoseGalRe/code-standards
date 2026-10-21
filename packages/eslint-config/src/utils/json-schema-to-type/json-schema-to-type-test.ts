import { jsonSchemaToType } from './json-schema-to-type.ts';

describe('utils: json-schema-to-type', () => {
  describe('primitive types', () => {
    it('should convert string type', () => {
      const result = jsonSchemaToType({ type: 'string' });

      expect(result.mainType).toBe('string');
      expect(result.auxiliaryTypes).toEqual([]);
    });

    it('should convert number type', () => {
      const result = jsonSchemaToType({ type: 'number' });

      expect(result.mainType).toBe('number');
    });

    it('should convert integer type to number', () => {
      const result = jsonSchemaToType({ type: 'integer' });

      expect(result.mainType).toBe('number');
    });

    it('should convert boolean type', () => {
      const result = jsonSchemaToType({ type: 'boolean' });

      expect(result.mainType).toBe('boolean');
    });

    it('should convert null type', () => {
      const result = jsonSchemaToType({ type: 'null' });

      expect(result.mainType).toBe('null');
    });

    it('should convert object type to record', () => {
      const result = jsonSchemaToType({ type: 'object' });

      expect(result.mainType).toContain('[key: string]: unknown');
    });

    it('should convert array type to unknown array', () => {
      const result = jsonSchemaToType({ type: 'array' });

      expect(result.mainType).toBe('unknown[]');
    });

    it('should handle simple object and array without structure', () => {
      const resultObj = jsonSchemaToType({ type: 'object' });
      const resultArray = jsonSchemaToType({ type: 'array' });

      expect(resultObj.mainType).toBe('{\n[key: string]: unknown\n}');
      expect(resultArray.mainType).toBe('unknown[]');
    });

    it('should convert unknown type to unknown', () => {
      // @ts-expect-error - Testing invalid type
      const result = jsonSchemaToType({ type: 'foo' });

      expect(result.mainType).toBe('unknown');
    });

    it('should convert type array to union', () => {
      const result = jsonSchemaToType({ type: ['string', 'null'] });

      expect(result.mainType).toBe('string | null');
    });

    it('should handle single element type array', () => {
      const result = jsonSchemaToType({ type: ['string'] });

      expect(result.mainType).toBe('string');
    });

    it('should handle object and array in type array', () => {
      const result = jsonSchemaToType({
        properties: { a: { type: 'string' } },
        type: ['object', 'array', 'string'],
      });

      expect(result.mainType).toContain('{');
      expect(result.mainType).toContain('unknown[]');
      expect(result.mainType).toContain('string');
    });

    it('should handle primitive object and array in type array without structure', () => {
      const result = jsonSchemaToType({
        type: ['object', 'array'],
      });

      expect(result.mainType).toBe('Record<string, unknown> | unknown[]');
    });
  });

  describe('boolean schemas', () => {
    it('should convert true schema to unknown', () => {
      // @ts-expect-error - Testing boolean schema
      const result = jsonSchemaToType(true);

      expect(result.mainType).toBe('unknown');
    });

    it('should convert false schema to []', () => {
      const result = jsonSchemaToType(false);

      expect(result.mainType).toBe('[]');
    });

    it('should convert false schema with typeName to type Name = [];', () => {
      const result = jsonSchemaToType(false, { typeName: 'Empty' });

      expect(result.mainType).toBe('type Empty = [];');
    });

    it('should handle nested boolean schemas', () => {
      // @ts-expect-error - Testing invalid
      const result = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          a: true,
          b: false,
        },
        type: 'object',
      });

      expect(result.mainType).toContain('a?: unknown;');
      expect(result.mainType).toContain('b?: never;');
    });

    it('should handle items: false', () => {
      // @ts-expect-error - Testing invalid
      const result = jsonSchemaToType({
        items: true,
        type: 'array',
      });

      expect(result.mainType).toBe('unknown[]');
    });
  });

  describe('entry points', () => {
    it('should handle empty array config', () => {
      const result = jsonSchemaToType([], { typeName: 'Empty' });

      expect(result.mainType).toBe('type Empty = [];');

      const result2 = jsonSchemaToType([]);

      expect(result2.mainType).toBe('[]');
    });

    it('should merge $defs from multiple array elements', () => {
      const result = jsonSchemaToType(
        [
          { $defs: { A: { type: 'string' } }, $ref: '#/items/0/$defs/A' },
          { $defs: { B: { type: 'number' } }, $ref: '#/items/1/$defs/B' },
        ],
        { typeName: 'Merged' },
      );

      expect(result.auxiliaryTypes).toContain('type MergedA = string;');
      expect(result.auxiliaryTypes).toContain('type MergedB = number;');
    });
  });

  describe('enum', () => {
    it('should convert string enum', () => {
      const result = jsonSchemaToType({ enum: ['a', 'b', 'c'] });

      expect(result.mainType).toBe('"a" | "b" | "c"');
    });

    it('should convert mixed enum', () => {
      const result = jsonSchemaToType({ enum: [1, 'two', true, null] });

      expect(result.mainType).toBe('"two" | 1 | null | true');
    });

    it('should convert empty enum to never', () => {
      const result = jsonSchemaToType({ enum: [] });

      expect(result.mainType).toBe('never');
    });

    it('should sort enum values alphabetically', () => {
      const result = jsonSchemaToType({ enum: ['zebra', 'apple', 'mango'] });

      expect(result.mainType).toBe('"apple" | "mango" | "zebra"');
    });
  });

  describe('const', () => {
    it('should convert string const', () => {
      const result = jsonSchemaToType({ const: 'fixed' });

      expect(result.mainType).toBe('"fixed"');
    });

    it('should convert number const', () => {
      const result = jsonSchemaToType({ const: 42 });

      expect(result.mainType).toBe('42');
    });

    it('should convert boolean const', () => {
      const result = jsonSchemaToType({ const: true });

      expect(result.mainType).toBe('true');
    });

    it('should convert null const', () => {
      const result = jsonSchemaToType({ const: null });

      expect(result.mainType).toBe('null');
    });

    it('should convert array const', () => {
      const result = jsonSchemaToType({ const: [1, '2'] });

      expect(result.mainType).toBe('[1, "2"]');
    });

    it('should convert object const', () => {
      const result = jsonSchemaToType({ const: { a: 1 } });

      expect(result.mainType).toBe('{"a":1}');
    });
  });

  describe('object schemas', () => {
    it('should convert empty object with additionalProperties false', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        type: 'object',
      });

      expect(result.mainType).toBe('{}');
    });

    it('should convert object with properties', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          age: { type: 'number' },
          name: { type: 'string' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('age?: number;');
      expect(result.mainType).toContain('name?: string;');
    });

    it('should mark required properties', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
        },
        required: ['id'],
        type: 'object',
      });

      expect(result.mainType).toContain('id: number;');
      expect(result.mainType).toContain('name?: string;');
    });

    it('should handle additionalProperties with type', () => {
      const result = jsonSchemaToType({
        additionalProperties: { type: 'string' },
        type: 'object',
      });

      expect(result.mainType).toContain('[key: string]: string');
    });

    it('should handle implicit object from properties', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          foo: { type: 'string' },
        },
      });

      expect(result.mainType).toContain('foo?: string;');
    });

    it('should sort properties alphabetically', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          apple: { type: 'string' },
          mango: { type: 'string' },
          zebra: { type: 'string' },
        },
        type: 'object',
      });

      const lines = result.mainType.split('\n').filter((l) => l.includes(':'));

      expect(lines[0]).toContain('apple');
      expect(lines[1]).toContain('mango');
      expect(lines[2]).toContain('zebra');
    });

    it('should handle empty object with additionalProperties true (default)', () => {
      const result = jsonSchemaToType({ type: 'object' });

      expect(result.mainType).toContain('[key: string]: unknown');
    });

    it('should handle object with properties and additionalProperties true', () => {
      const result = jsonSchemaToType({
        additionalProperties: true,
        properties: { a: { type: 'string' } },
        type: 'object',
      });

      expect(result.mainType).toContain('a?: string;');
      expect(result.mainType).toContain('[key: string]: unknown;');
    });

    it('should handle object with properties and additionalProperties object', () => {
      const result = jsonSchemaToType({
        additionalProperties: { type: 'number' },
        properties: { a: { type: 'string' } },
        type: 'object',
      });

      expect(result.mainType).toContain('a?: string;');
      expect(result.mainType).toContain('[key: string]: number;');
    });

    it('should handle additionalProperties as object when no properties', () => {
      const result = jsonSchemaToType({
        additionalProperties: { type: 'boolean' },
        type: 'object',
      });

      expect(result.mainType).toContain('[key: string]: boolean');
    });

    it('should handle keys with special characters', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          '@prefixed': { type: 'number' },
          'my-prop': { type: 'string' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('"my-prop"?: string;');
      expect(result.mainType).toContain('"@prefixed"?: number;');
    });
  });

  describe('array schemas', () => {
    it('should convert array of strings', () => {
      const result = jsonSchemaToType({
        items: { type: 'string' },
        type: 'array',
      });

      expect(result.mainType).toBe('string[]');
    });

    it('should convert array of objects', () => {
      const result = jsonSchemaToType({
        items: {
          additionalProperties: false,
          properties: { id: { type: 'number' } },
          type: 'object',
        },
        type: 'array',
      });

      expect(result.mainType).toContain('id?: number;');
      expect(result.mainType).toContain('[]');
    });

    it('should convert tuple with prefixItems (draft-2020-12)', () => {
      const result = jsonSchemaToType({
        prefixItems: [{ type: 'string' }, { type: 'number' }],
        type: 'array',
      });

      expect(result.mainType).toBe('[string, number]');
    });

    it('should convert tuple with prefixItems and items (rest)', () => {
      const result = jsonSchemaToType({
        items: { type: 'boolean' },
        prefixItems: [{ type: 'string' }],
        type: 'array',
      });

      expect(result.mainType).toBe('[string, ...boolean[]]');
    });

    it('should convert tuple with items array (draft-07)', () => {
      const result = jsonSchemaToType({
        items: [{ type: 'string' }, { type: 'number' }],
        type: 'array',
      });

      expect(result.mainType).toBe('[string, number]');
    });

    it('should convert tuple with items array and additionalItems', () => {
      const result = jsonSchemaToType({
        additionalItems: { type: 'boolean' },
        items: [{ type: 'string' }],
        type: 'array',
      });

      expect(result.mainType).toBe('[string, ...boolean[]]');
    });

    it('should handle implicit array from items', () => {
      const result = jsonSchemaToType({
        items: { type: 'boolean' },
      });

      expect(result.mainType).toBe('boolean[]');
    });

    it('should handle implicit array from prefixItems', () => {
      const result = jsonSchemaToType({
        prefixItems: [{ type: 'boolean' }],
      });

      expect(result.mainType).toBe('[boolean]');
    });

    it('should wrap union types in parentheses for arrays', () => {
      const result = jsonSchemaToType({
        items: { type: ['string', 'number'] },
        type: 'array',
      });

      expect(result.mainType).toBe('(string | number)[]');
    });

    it('should convert array with no items to unknown[]', () => {
      const result = jsonSchemaToType({ type: 'array' });

      expect(result.mainType).toBe('unknown[]');
    });
  });

  describe('anyOf', () => {
    it('should convert anyOf to union type', () => {
      const result = jsonSchemaToType({
        anyOf: [{ type: 'string' }, { type: 'number' }],
      });

      expect(result.mainType).toBe('number | string');
    });

    it('should deduplicate union types', () => {
      const result = jsonSchemaToType({
        anyOf: [{ type: 'string' }, { type: 'string' }],
      });

      expect(result.mainType).toBe('string');
    });
  });

  describe('oneOf', () => {
    it('should convert oneOf to union type', () => {
      const result = jsonSchemaToType({
        oneOf: [{ const: 'a' }, { const: 'b' }],
      });

      expect(result.mainType).toBe('"a" | "b"');
    });
  });

  describe('allOf', () => {
    it('should convert allOf to intersection type', () => {
      const result = jsonSchemaToType({
        allOf: [
          { properties: { a: { type: 'string' } }, type: 'object' },
          { properties: { b: { type: 'number' } }, type: 'object' },
        ],
      });

      expect(result.mainType).toContain('&');
    });
  });

  describe('$ref', () => {
    it('should resolve simple $ref', () => {
      const result = jsonSchemaToType(
        {
          $defs: {
            MyType: { type: 'string' },
          },
          $ref: '#/$defs/MyType',
        },
        { typeName: 'Test' },
      );

      expect(result.auxiliaryTypes.length).toBeGreaterThan(0);
    });

    it('should resolve $ref in properties', () => {
      const result = jsonSchemaToType(
        {
          $defs: {
            Name: { type: 'string' },
          },
          additionalProperties: false,
          properties: {
            name: { $ref: '#/$defs/Name' },
          },
          type: 'object',
        },
        { typeName: 'User' },
      );

      expect(result.mainType).toContain('name?:');
      expect(result.auxiliaryTypes.length).toBeGreaterThan(0);
    });

    it('should resolve root $ref (#)', () => {
      const result = jsonSchemaToType(
        {
          anyOf: [{ $ref: '#' }],
          type: 'string',
        },
        { typeName: 'Recursive' },
      );

      expect(result.mainType).toContain('Recursive');
    });

    it('should throw on external $ref', () => {
      expect(() => jsonSchemaToType({ $ref: 'https://example.com/schema' }))
        .toThrow('External $ref is not supported');
    });

    it('should throw on ref not found', () => {
      expect(() => jsonSchemaToType({ $ref: '#/missing' }))
        .toThrow('Reference not found');
    });

    it('should throw on properties not found in path', () => {
      expect(() => jsonSchemaToType(
        {
          $defs: { a: { type: 'string' } },
          $ref: '#/$defs/b',
        },
      )).toThrow('Reference not found');
    });

    it('should fallback to definitions', () => {
      const result = jsonSchemaToType({
        $ref: '#/definitions/MyType',
        definitions: {
          MyType: { type: 'number' },
        },
      });

      expect(result.auxiliaryTypes[0]).toContain('type MyType = number;');
    });

    it('should resolve definitions via $defs fallback', () => {
      const result = jsonSchemaToType({
        $ref: '#/$defs/MyType',
        definitions: {
          MyType: { type: 'number' },
        },
      });

      expect(result.auxiliaryTypes.length).toBe(1);
    });

    it('should resolve $defs via definitions fallback', () => {
      const result = jsonSchemaToType({
        $defs: {
          MyType: { type: 'number' },
        },
        $ref: '#/definitions/MyType',
      });

      expect(result.auxiliaryTypes.length).toBe(1);
    });

    it('should throw on invalid array index', () => {
      expect(() => jsonSchemaToType({
        $ref: '#/items/0',
        items: [],
      })).toThrow('Invalid array index');

      expect(() => jsonSchemaToType({
        $ref: '#/items/foo',
        items: [],
      })).toThrow('Invalid array index');
    });

    it('should handle circular references', () => {
      const result = jsonSchemaToType({
        $defs: {
          Node: {
            properties: {
              child: { $ref: '#/$defs/Node' },
            },
            type: 'object',
          },
        },
        $ref: '#/$defs/Node',
      }, { typeName: 'Tree' });

      expect(result.auxiliaryTypes.join('\n')).toContain('child?: TreeNode;');
    });

    it('should resolve definitions via path', () => {
      const result = jsonSchemaToType({
        $ref: '#/definitions/Foo',
        definitions: {
          Foo: { type: 'string' },
        },
      });

      expect(result.mainType).toBe('Foo');
    });

    it('should use cached ref resolution', () => {
      const result = jsonSchemaToType({
        $defs: {
          Ref: { type: 'string' },
        },
        properties: {
          a: { $ref: '#/$defs/Ref' },
          b: { $ref: '#/$defs/Ref' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('a?: Ref;');
      expect(result.mainType).toContain('b?: Ref;');
    });

    it('should throw on deep ref not found', () => {
      expect(() =>
        jsonSchemaToType({
          $ref: '#/definitions/a/missing',
          definitions: { a: { type: 'object' } },
        }),
      ).toThrow('Reference not found');
    });

    it('should throw on ref not found without fallback', () => {
      expect(() =>
        jsonSchemaToType({
          $ref: '#/something/abc',
          something: {},
        }),
      ).toThrow('Reference not found');
    });

    it('should throw on ref through non-object', () => {
      expect(() =>
        jsonSchemaToType({
          $ref: '#/a/b',
          a: 'not an object',
        }),
      ).toThrow('Reference not found');
    });
  });

  describe('typeName option', () => {
    it('should generate named type', () => {
      const result = jsonSchemaToType({ type: 'string' }, { typeName: 'MyString' });

      expect(result.mainType).toBe('type MyString = string;');
    });

    it('should prefix auxiliary types with typeName', () => {
      const result = jsonSchemaToType(
        {
          $defs: {
            Item: { type: 'number' },
          },
          $ref: '#/$defs/Item',
        },
        { typeName: 'Container' },
      );

      expect(result.auxiliaryTypes.some((t) => t.includes('ContainerItem'))).toBe(true);
    });

    it('should handle refToTypeName unknown', () => {
      const result = jsonSchemaToType({
        $defs: { '': { type: 'string' } },
        $ref: '#/$defs/',
      });

      expect(result.mainType).toBe('Unknown');
    });

    it('should handle refToTypeName with special chars', () => {
      const resultSafe = jsonSchemaToType({
        $defs: {
          scope_pkg: { type: 'string' },
        },
        $ref: '#/$defs/scope_pkg',
      });

      expect(resultSafe.mainType).toBe('Scope_pkg');
    });
  });

  describe('includeDescriptions option', () => {
    it('should include JSDoc for properties', () => {
      const result = jsonSchemaToType(
        {
          additionalProperties: false,
          properties: {
            name: { description: 'The user name', type: 'string' },
          },
          type: 'object',
        },
        { includeDescriptions: true },
      );

      expect(result.mainType).toContain('/** The user name */');
    });

    it('should not include JSDoc when disabled', () => {
      const result = jsonSchemaToType(
        {
          additionalProperties: false,
          properties: {
            name: { description: 'The user name', type: 'string' },
          },
          type: 'object',
        },
        { includeDescriptions: false },
      );

      expect(result.mainType).not.toContain('/**');
    });

    it('should preserve multiline descriptions', () => {
      const result = jsonSchemaToType(
        {
          additionalProperties: false,
          properties: {
            name: { description: 'Line 1\nLine 2', type: 'string' },
          },
          type: 'object',
        },
        { includeDescriptions: true },
      );

      expect(result.mainType).toContain('Line 1');
      expect(result.mainType).toContain('Line 2');
    });

    it('should escape JSDoc comments', () => {
      const resultDoc = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          prop: { description: 'End comment */', type: 'string' },
        },
        type: 'object',
      }, { includeDescriptions: true });

      expect(resultDoc.mainType).toContain(String.raw`*\/`);
    });
  });

  describe('array of schemas (ESLint rule format)', () => {
    it('should convert array of schemas to tuple', () => {
      const result = jsonSchemaToType(
        [
          {
            additionalProperties: false,
            properties: {
              enabled: { type: 'boolean' },
            },
            type: 'object',
          },
        ],
        { typeName: 'MyRule' },
      );

      expect(result.mainType).toContain('type MyRule = [');
      expect(result.mainType).toContain('enabled?: boolean;');
    });

    it('should handle empty array config', () => {
      const result = jsonSchemaToType([], { typeName: 'Empty' });

      expect(result.mainType).toBe('type Empty = [];');
    });

    it('should handle multiple tuple elements with descriptions', () => {
      const result = jsonSchemaToType(
        [
          { description: 'First element', type: 'string' },
          { description: 'Second element', type: 'number' },
        ],
        { includeDescriptions: true, typeName: 'Tuple' },
      );

      expect(result.mainType).toContain('First element');
      expect(result.mainType).toContain('Second element');
    });

    it('should handle multiple tuple elements without descriptions when descriptions enabled', () => {
      const result = jsonSchemaToType(
        [
          { type: 'string' },
          { description: 'Second', type: 'number' },
        ],
        { includeDescriptions: true, typeName: 'Tuple' },
      );

      expect(result.mainType).toContain('type Tuple = [');
      expect(result.mainType).toContain('string,');
    });
  });

  describe('edge cases', () => {
    it('should return unknown for empty schema', () => {
      const result = jsonSchemaToType({});

      expect(result.mainType).toBe('unknown');
    });

    it('should handle nested objects', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          nested: {
            additionalProperties: false,
            properties: {
              value: { type: 'string' },
            },
            type: 'object',
          },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('nested?:');
      expect(result.mainType).toContain('value?: string;');
    });

    it('should escape special characters in property names', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          '@special': { type: 'number' },
          'my-prop': { type: 'string' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('"@special"');
      expect(result.mainType).toContain('"my-prop"');
    });

    it('should handle anyOf with descriptions (per-value JSDoc)', () => {
      const result = jsonSchemaToType(
        {
          anyOf: [
            { description: 'A string value', type: 'string' },
            { description: 'A number value', type: 'number' },
          ],
        },
        { includeDescriptions: true },
      );

      expect(result.mainType).toContain('A string value');
      expect(result.mainType).toContain('A number value');
    });

    it('should handle anyOf mixed description presence', () => {
      const result = jsonSchemaToType(
        {
          anyOf: [
            { description: 'Doc', type: 'string' },
            { type: 'number' },
          ],
        },
        { includeDescriptions: true },
      );

      expect(result.mainType).toContain('/** Doc */');
      expect(result.mainType).toContain('number');
      expect(result.mainType).toContain('| string');
    });

    it('should handle anyOf where only some have descriptions', () => {
      const result = jsonSchemaToType(
        {
          anyOf: [
            { description: 'Has description', type: 'string' },
            { type: 'number' },
          ],
        },
        { includeDescriptions: true },
      );

      expect(result.mainType).toContain('/** Has description */');
      expect(result.mainType).toContain('number');
      expect(result.mainType).toContain('| string');
    });

    it('should handle anyOf with indentLevel > 0', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          union: {
            anyOf: [
              { description: 'S', type: 'string' },
              { description: 'N', type: 'number' },
            ],
          },
        },
        type: 'object',
      }, { includeDescriptions: true });

      expect(result.mainType).toContain('  /** S */');
      expect(result.mainType).toContain('  | string');
    });
  });

  describe('utilities', () => {
    it('should handle valueToLiteral with objects and unknowns', () => {
      const resultObj = jsonSchemaToType({ const: { a: 1 } });

      expect(resultObj.mainType).toBe('{"a":1}');

      const resultFunction = jsonSchemaToType({ const: () => {} });

      expect(resultFunction.mainType).toBe('unknown');
    });

    it('should handle generateJsDoc with empty description', () => {
      const result = jsonSchemaToType({ description: '', type: 'string' }, { includeDescriptions: true });

      expect(result.mainType).not.toContain('/**');
    });

    it('should handle convertPrimitiveType default case', () => {
      // @ts-expect-error - Testing invalid type
      const result = jsonSchemaToType({ type: 'unknown_type' });

      expect(result.mainType).toBe('unknown');
    });

    it('should handle jsonSchemaToTypeString with false schema and variety of options', () => {
      const result = jsonSchemaToType(false, { indent: ' '.repeat(4), typeName: 'Test' });

      expect(result.mainType).toBe('type Test = [];');

      const result2 = jsonSchemaToType(false);

      expect(result2.mainType).toBe('[]');
    });

    it('should handle jsonSchemaToTypeString with single schema and description', () => {
      const result = jsonSchemaToType({ description: 'Desc', type: 'string' }, { typeName: 'T' });

      expect(result.mainType).toBe('type T = string;');
    });
  });

  describe('complex schemas', () => {
    it('should handle ESLint-like rule schema', () => {
      const result = jsonSchemaToType(
        [
          {
            additionalProperties: false,
            properties: {
              mode: {
                description: 'The severity level',
                enum: ['error', 'warn', 'off'],
              },
              options: {
                additionalProperties: false,
                properties: {
                  allowUnused: { type: 'boolean' },
                },
                type: 'object',
              },
            },
            type: 'object',
          },
        ],
        { includeDescriptions: true, typeName: 'RuleConfig' },
      );

      expect(result.mainType).toContain('type RuleConfig');
      expect(result.mainType).toContain('"error" | "off" | "warn"');
      expect(result.mainType).toContain('allowUnused?: boolean;');
    });

    it('should handle schema with nested $refs', () => {
      const result = jsonSchemaToType(
        {
          $defs: {
            Item: {
              additionalProperties: false,
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
              },
              type: 'object',
            },
          },
          additionalProperties: false,
          properties: {
            items: {
              items: { $ref: '#/$defs/Item' },
              type: 'array',
            },
          },
          type: 'object',
        },
        { typeName: 'Container' },
      );

      expect(result.mainType).toContain('items?:');
      expect(result.auxiliaryTypes.some((t) => t.includes('ContainerItem'))).toBe(true);
    });
  });

  describe('not keyword', () => {
    it('should convert not to unknown with comment', () => {
      const result = jsonSchemaToType({ not: { type: 'string' } });

      expect(result.mainType).toBe('unknown /* NOT: string */');
    });

    it('should handle complex not schema', () => {
      const result = jsonSchemaToType({
        not: {
          additionalProperties: false,
          properties: { forbidden: { type: 'boolean' } },
          type: 'object',
        },
      });

      expect(result.mainType).toContain('unknown /* NOT:');
      expect(result.mainType).toContain('forbidden?: boolean');
    });
  });

  /* eslint-disable unicorn/no-thenable */
  /* biome-ignore-start lint/suspicious/noThenProperty: Testing then */

  describe('if/then/else conditional keywords', () => {
    it('should convert if/then/else to union of then and else when sole keywords', () => {
      const result = jsonSchemaToType({
        else: { type: 'number' },
        if: { const: 'premium' },
        then: { type: 'string' },
      });

      expect(result.mainType).toBe('number | string');
    });

    it('should handle if/then without else when sole keywords', () => {
      const result = jsonSchemaToType({
        if: { const: 'premium' },
        then: { type: 'string' },
      });

      expect(result.mainType).toBe('string | unknown');
    });

    it('should handle if/else without then when sole keywords', () => {
      const result = jsonSchemaToType({
        else: { type: 'number' },
        if: { const: 'premium' },
      });

      expect(result.mainType).toBe('number');
    });

    it('should deduplicate if/then/else types', () => {
      const result = jsonSchemaToType({
        else: { type: 'string' },
        if: { const: 'a' },
        then: { type: 'string' },
      });

      expect(result.mainType).toBe('string');
    });

    it('should ignore if/then/else when type or properties exist (validation constraint)', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        if: { properties: { type: { const: 'premium' } } },
        properties: {
          name: { type: 'string' },
        },
        then: { required: ['name'] },
        type: 'object',
      });

      expect(result.mainType).toContain('name?: string');
      expect(result.mainType).not.toContain('|');
    });

    it('should ignore if without then or else', () => {
      const result = jsonSchemaToType({
        if: { properties: { type: { const: 'a' } } },
        type: 'string',
      });

      expect(result.mainType).toBe('string');
    });
  });

  /* biome-ignore-end lint/suspicious/noThenProperty: Testing then */
  /* eslint-enable unicorn/no-thenable */

  describe('patternProperties', () => {
    it('should preserve finite optional-literal patterns without a conflicting index signature', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        patternProperties: {
          '^must(?:Not)?Match$': { type: 'string' },
        },
        properties: {
          allowArguments: { type: 'boolean' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('allowArguments?: boolean;');
      expect(result.mainType).toContain('mustMatch?: string;');
      expect(result.mainType).toContain('mustNotMatch?: string;');
      expect(result.mainType).not.toContain('[key: string]');
    });

    it('should preserve explicit properties and their docs when finite patterns overlap', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        patternProperties: {
          '^must(?:Not)?Match$': {
            oneOf: [{ type: 'string' }, { items: { type: 'string' }, type: 'array' }],
          },
        },
        properties: {
          mustMatch: { deprecated: true, description: 'Keep this title restriction.', enum: ['expected'] },
        },
        required: ['mustMatch'],
        type: 'object',
      });

      expect(result.mainType).toContain('mustMatch: "expected";');
      expect(result.mainType).toContain('Keep this title restriction.');
      expect(result.mainType).toContain('@deprecated');
      expect(result.mainType).not.toContain(' & ');
    });

    it('should keep a shared index when finite and non-finite patterns are mixed', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        patternProperties: {
          '^must(?:Not)?Match$': { type: 'string' },
          '^x_': { type: 'boolean' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('[key: string]: boolean | string;');
      expect(result.mainType).not.toContain('mustMatch');
    });

    it('should preserve pattern precedence over typed additional properties', () => {
      const result = jsonSchemaToType({
        additionalProperties: { type: 'boolean' },
        patternProperties: {
          '^must(?:Not)?Match$': { type: 'string' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('[key: string]: string;');
      expect(result.mainType).not.toContain('mustMatch');
    });

    it('should keep a shared index when finite patterns expand to overlapping keys', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        patternProperties: {
          '^must(?:Also)?Match$': { type: 'number' },
          '^must(?:Not)?Match$': { type: 'string' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('[key: string]: number | string;');
      expect(result.mainType).not.toContain('mustMatch');
    });

    it('should convert patternProperties to index signature', () => {
      const result = jsonSchemaToType({
        patternProperties: {
          '^S_': { type: 'string' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('[key: string]: string');
    });

    it('should handle multiple patternProperties with union', () => {
      const result = jsonSchemaToType({
        patternProperties: {
          '^N_': { type: 'number' },
          '^S_': { type: 'string' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('[key: string]: number | string');
    });

    it('should handle patternProperties with properties', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        patternProperties: {
          '^meta_': { type: 'string' },
        },
        properties: {
          id: { type: 'number' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('id?: number;');
      expect(result.mainType).toContain('[key: string]: string;');
    });

    it('should deduplicate patternProperties types', () => {
      const result = jsonSchemaToType({
        patternProperties: {
          '^A_': { type: 'string' },
          '^B_': { type: 'string' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('[key: string]: string');
      expect(result.mainType).not.toContain('string | string');
    });

    it('should prioritize patternProperties over additionalProperties', () => {
      const result = jsonSchemaToType({
        additionalProperties: { type: 'string' },
        patternProperties: {
          '^foo_': { type: 'boolean' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('[key: string]: boolean');
      // patternProperties takes precedence, so additionalProperties type (string) is not used
      expect(result.mainType).not.toContain(': string;');
    });
  });

  describe('valueToLiteral edge cases', () => {
    it('should handle undefined as unknown', () => {
      const result = jsonSchemaToType({ const: undefined });

      expect(result.mainType).toBe('unknown');
    });
  });

  describe('nullable (OpenAPI extension)', () => {
    it('should add | null for nullable string', () => {
      const result = jsonSchemaToType({ nullable: true, type: 'string' });

      expect(result.mainType).toBe('string | null');
    });

    it('should add | null for nullable object', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        nullable: true,
        properties: { id: { type: 'number' } },
        type: 'object',
      });

      expect(result.mainType).toContain('| null');
    });

    it('should not duplicate null if already in type', () => {
      const result = jsonSchemaToType({
        nullable: true,
        type: ['string', 'null'],
      });

      expect(result.mainType).toBe('string | null');
      expect(result.mainType.match(/null/g)?.length).toBe(1);
    });

    it('should apply nullable to enum', () => {
      const result = jsonSchemaToType({
        enum: ['a', 'b'],
        nullable: true,
      });

      expect(result.mainType).toBe('"a" | "b" | null');
    });

    it('should not add | null when nullable is false', () => {
      const result = jsonSchemaToType({ nullable: false, type: 'string' });

      expect(result.mainType).toBe('string');
    });
  });

  describe('deprecated annotation', () => {
    it('should add @deprecated JSDoc for deprecated property', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          oldProp: { deprecated: true, type: 'string' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('@deprecated');
    });

    it('should combine description and @deprecated', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          oldProp: { deprecated: true, description: 'Old property', type: 'string' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('Old property');
      expect(result.mainType).toContain('@deprecated');
    });

    it('should add @deprecated only JSDoc when no description', () => {
      const result = jsonSchemaToType({
        additionalProperties: false,
        properties: {
          oldProp: { deprecated: true, type: 'string' },
        },
        type: 'object',
      });

      expect(result.mainType).toContain('/** @deprecated */');
    });
  });
});
