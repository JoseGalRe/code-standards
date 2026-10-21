import type {
  ConversionContext,
  ConversionOptions,
  ConversionResult,
  JsonSchema,
  JsonSchemaType,
} from './json-schema-to-type-types.ts';

/**
 * Generates a JSDoc comment from a description and optional deprecated tag.
 *
 * Multiline descriptions are split into padded ` * ` lines, and any `*\/` sequence in the description is escaped so
 * the generated comment does not close early. Returns an empty string when there is neither a description nor a
 * deprecated flag.
 *
 * @param description - Description text, or undefined when the schema has none.
 * @param indentLevel - Current indentation level multiplied by `indent`.
 * @param indent - Indentation string.
 * @param isDeprecated - Whether to append an `@deprecated` tag.
 *
 * @returns The JSDoc comment with a trailing newline, or an empty string when there is nothing to emit.
 */
function generateJsDoc(
  description: string | undefined,
  indentLevel: number,
  indent: string,
  isDeprecated?: boolean,
): string {
  if (!description && !isDeprecated) {
    return '';
  }

  const padding = indent.repeat(indentLevel);

  // Only deprecated, no description
  if (!description && isDeprecated) {
    return `${padding}/** @deprecated */\n`;
  }

  const escaped = String(description).replaceAll('*/', String.raw`*\/`);
  const lines = escaped.split('\n');

  // Single line JSDoc without deprecated
  if (!isDeprecated && lines.length === 1) {
    return `${padding}/** ${escaped} */\n`;
  }

  // Multiline or with deprecated
  const formattedLines = lines.map((line) => `${padding} * ${line}`);

  if (isDeprecated) {
    formattedLines.push(`${padding} * @deprecated`);
  }

  return `${padding}/**\n${formattedLines.join('\n')}\n${padding} */\n`;
}

/**
 * Converts a ref path to a valid TypeScript identifier.
 *
 * The last path segment is used as the base name, non-word characters are removed, and the first letter is
 * uppercased. When the segment is empty, the name falls back to `Unknown`.
 *
 * @param ref - The `$ref` string (for example, `#/definitions/Foo`).
 * @param prefix - Prefix applied to the resulting name to avoid collisions between different rules.
 *
 * @returns A valid TypeScript type name.
 */
function refToTypeName(ref: string, prefix: string): string {
  const parts = ref.split('/');
  const name = parts.at(-1) || 'Unknown';

  // Capitalize first letter and remove invalid characters
  const cleanName = name.replaceAll(/[^\w$]/g, '').replace(/^[a-z]/, (c) => c.toUpperCase());

  // Add prefix if provided to avoid collisions between different rules
  return prefix ? `${prefix}${cleanName}` : cleanName;
}

/**
 * Stringifies a value for use in TypeScript (handles primitives).
 *
 * @param value - The value to stringify
 *
 * @returns TypeScript literal representation
 */
function valueToLiteral(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => valueToLiteral(item)).join(', ')}]`;
  }

  return typeof value === 'object' ? JSON.stringify(value) : 'unknown';
}

/**
 * Resolves a `$ref` pointer to its target schema inside the root schema.
 *
 * `#` returns the root schema, object segments walk object properties with a `definitions`/`$defs` fallback, and
 * numeric segments address array positions.
 *
 * @param ref - Reference string, starting with `#` for local pointers.
 * @param ctx - Conversion context that owns the root schema.
 *
 * @returns The resolved schema.
 *
 * @throws {Error} When the reference is external (does not start with `#`), when a path segment cannot be found, or
 * when an array segment is not a valid in-range index.
 */
function resolveRef(ref: string, ctx: ConversionContext): JsonSchema {
  if (!ref.startsWith('#')) {
    throw new Error(`External $ref is not supported: ${ref}`);
  }

  const path = ref.slice(1).split('/').filter(Boolean);

  // Handle root reference "#"
  if (path.length === 0) {
    return ctx.rootSchema;
  }

  // Walk the path to resolve the reference
  let current: unknown = ctx.rootSchema;

  for (const segment of path) {
    if (current === null || typeof current !== 'object') {
      throw new Error(`Reference not found: ${ref}`);
    }

    // Handle array index access (e.g., "0" in "#/items/0/$defs/...")
    if (Array.isArray(current)) {
      const index = Number(segment);

      if (Number.isNaN(index) || index < 0 || index >= current.length) {
        throw new Error(`Invalid array index in reference: ${ref}`);
      }

      current = current[index];
    } else {
      // Handle object property access
      const obj = current as Record<string, unknown>;

      if (Object.hasOwn(obj, segment)) {
        current = obj[segment];
      } else if (segment === 'definitions' && Object.hasOwn(obj, '$defs')) { // Try checking in $defs or definitions as fallback
        current = obj.$defs;
      } else if (segment === '$defs' && 'definitions' in obj) {
        current = obj.definitions;
      } else {
        throw new Error(`Reference not found: ${ref}`);
      }
    }
  }

  return current as JsonSchema;
}

/**
 * Converts an object schema to TypeScript type string.
 *
 * @param schema - The object schema
 * @param ctx - Conversion context
 * @param indentLevel - Current indentation level
 *
 * @returns TypeScript object type string
 */
function convertObjectSchema(schema: JsonSchema, ctx: ConversionContext, indentLevel: number): string {
  const declaredProperties = schema.properties ?? {};
  const expandedProperties = new Map<string, JsonSchema>();
  const patternEntries = Object.entries(schema.patternProperties ?? {});

  let canExpandPatterns = typeof schema.additionalProperties !== 'object';

  for (const [pattern, patternSchema] of patternEntries) {
    // Finite patterns such as Vitest's ^must(?:Not)?Match$ need named properties,
    // but partial expansion can conflict with other properties or index signatures.
    const match = /^\^([\w$]*)\(\?:([\w$]+)\)\?([\w$]*)\$$/u.exec(pattern);
    const prefix = match?.[1];
    const optionalPart = match?.[2];
    const suffix = match?.[3];

    if (prefix === undefined || optionalPart === undefined || suffix === undefined) {
      canExpandPatterns = false;
      continue;
    }

    for (const key of [`${prefix}${suffix}`, `${prefix}${optionalPart}${suffix}`]) {
      if (Object.hasOwn(declaredProperties, key) || expandedProperties.has(key)) {
        canExpandPatterns = false;
      }

      expandedProperties.set(key, patternSchema);
    }
  }

  const properties = {
    ...declaredProperties,
    ...(canExpandPatterns && Object.fromEntries(expandedProperties)),
  };

  const patternProps = canExpandPatterns ? {} : (schema.patternProperties ?? {});
  const requiredSet = new Set(schema.required);
  const padding = ctx.indent.repeat(indentLevel);
  const innerPadding = ctx.indent.repeat(indentLevel + 1);

  const propEntries = Object.entries(properties);
  const hasPatternProps = Object.keys(patternProps).length > 0;

  if (!hasPatternProps && propEntries.length === 0) {
    // Empty object or additionalProperties only
    if (schema.additionalProperties === false) {
      return '{}';
    }

    if (typeof schema.additionalProperties === 'object') {
      const valueType = convertSchemaToType(schema.additionalProperties, ctx, 0);

      return `{\n[key: string]: ${valueType}\n}`;
    }

    return '{\n[key: string]: unknown\n}';
  }

  const lines: string[] = ['{'];

  // Sort properties alphabetically by key
  const sortedEntries = propEntries.toSorted(([a], [b]) => a.localeCompare(b));

  for (const [key, propSchema] of sortedEntries) {
    const isRequired = requiredSet.has(key);
    const optional = isRequired ? '' : '?';
    const propType = convertSchemaToType(propSchema, ctx, indentLevel + 1);

    // Generate JSDoc for property if enabled (with deprecated support)
    const jsDoc = generateJsDoc(
      ctx.includeDescriptions ? propSchema.description : undefined,
      indentLevel + 1,
      ctx.indent,
      propSchema.deprecated,
    );

    if (jsDoc) {
      lines.push(jsDoc.trimEnd());
    }

    // Handle keys that need quoting
    const safeKey = /^[a-z_$][\w$]*$/i.test(key) ? key : JSON.stringify(key);

    lines.push(`${innerPadding}${safeKey}${optional}: ${propType};`);
  }

  // Handle patternProperties - collect all value types for index signature
  if (hasPatternProps) {
    const patternTypes: string[] = Array.from(
      Object.values(patternProps),
      (patternSchema) => convertSchemaToType(patternSchema, ctx, indentLevel + 1),
    );

    const uniquePatternTypes = [...new Set(patternTypes)];

    uniquePatternTypes.sort((a, b) => a.localeCompare(b));

    const patternValueType = uniquePatternTypes.length === 1
      ? uniquePatternTypes[0]
      : uniquePatternTypes.join(' | ');

    lines.push(`${innerPadding}[key: string]: ${patternValueType};`);
  } else if (schema.additionalProperties !== false) {
    // Handle additionalProperties (defaults to true when not specified per JSON Schema spec)
    if (typeof schema.additionalProperties === 'object') {
      const valueType = convertSchemaToType(schema.additionalProperties, ctx, indentLevel + 1);

      lines.push(`${innerPadding}[key: string]: ${valueType};`);
    } else {
      // additionalProperties is true or undefined (default true)
      lines.push(`${innerPadding}[key: string]: unknown;`);
    }
  }

  lines.push(`${padding}}`);

  return lines.join('\n');
}

/**
 * Converts an array schema to TypeScript type string.
 *
 * @param schema - The array schema
 * @param ctx - Conversion context
 * @param indentLevel - Current indentation level
 *
 * @returns TypeScript array type string
 */
function convertArraySchema(schema: JsonSchema, ctx: ConversionContext, indentLevel: number): string {
  const prefixItems = schema?.prefixItems;
  const items = schema?.items;

  // Handle tuple with prefixItems (draft-2020-12)
  if (prefixItems && Array.isArray(prefixItems)) {
    const tupleTypes = prefixItems.map((item) => convertSchemaToType(item, ctx, indentLevel));

    // Handle rest items
    if (items && typeof items === 'object' && !Array.isArray(items)) {
      const restType = convertSchemaToType(items, ctx, indentLevel);

      return `[${tupleTypes.join(', ')}, ...${restType}[]]`;
    }

    return `[${tupleTypes.join(', ')}]`;
  }

  // Handle tuple with items array (draft-07)
  if (Array.isArray(items)) {
    const tupleTypes = items.map((item) => convertSchemaToType(item, ctx, indentLevel));

    // Handle additionalItems
    if (schema.additionalItems && typeof schema.additionalItems === 'object') {
      const restType = convertSchemaToType(schema.additionalItems, ctx, indentLevel);

      return `[${tupleTypes.join(', ')}, ...${restType}[]]`;
    }

    return `[${tupleTypes.join(', ')}]`;
  }

  // Handle regular array with items schema
  if (items && typeof items === 'object') {
    const elementType = convertSchemaToType(items, ctx, indentLevel);

    // Wrap complex types in parentheses
    return elementType.includes('|') || elementType.includes('&') ? `(${elementType})[]` : `${elementType}[]`;
  }

  // No items specified - array of unknown
  return 'unknown[]';
}

/**
 * Converts a primitive type to TypeScript.
 *
 * @param type - The JSON Schema type
 *
 * @returns TypeScript primitive type string
 */
function convertPrimitiveType(type: JsonSchemaType): string {
  switch (type) {
    case 'boolean': {
      return 'boolean';
    }

    case 'integer':
    case 'number': {
      return 'number';
    }

    case 'null': {
      return 'null';
    }

    case 'object': {
      return 'Record<string, unknown>';
    }

    case 'string': {
      return 'string';
    }

    default: {
      return 'unknown';
    }
  }
}

/**
 * Converts a union schema (anyOf/oneOf) to TypeScript type string.
 * Handles JSDoc per-value and deduplication.
 *
 * @param schemas - Array of schemas in the union
 * @param ctx - Conversion context
 * @param indentLevel - Current indentation level
 * @param separator - Union separator ('|' or '&')
 *
 * @returns TypeScript union type string
 */
function convertUnionSchema(
  schemas: JsonSchema[],
  ctx: ConversionContext,
  indentLevel: number,
  separator: ' & ' | ' | ',
): string {
  const hasDescriptions = ctx.includeDescriptions && schemas.some((s) => typeof s === 'object' && s.description);

  if (hasDescriptions && separator === ' | ') {
    // Generate multiline union with JSDoc per value
    const typesWithDocs: { doc: null | string; type: string }[] = [];

    for (const s of schemas) {
      const typeString = convertSchemaToType(s, ctx, indentLevel);
      const doc = typeof s === 'object' && (s.description || s.deprecated)
        ? generateJsDoc(s.description, indentLevel, ctx.indent, s.deprecated).trimEnd()
        : null;

      typesWithDocs.push({ doc, type: typeString });
    }

    typesWithDocs.sort((a, b) => a.type.localeCompare(b.type));

    const lines: string[] = [];
    const pad = ctx.indent.repeat(indentLevel);

    for (let index = 0; index < typesWithDocs.length; index++) {
      const doc = typesWithDocs[index]?.doc;
      const type = typesWithDocs[index]?.type;
      const prefix = index === 0 ? '' : '| ';

      lines.push(doc ? `${doc}\n${pad}${prefix}${type}` : `${pad}${prefix}${type}`);
    }

    return `\n${lines.join('\n')}`;
  }

  const types = schemas.map((s) => convertSchemaToType(s, ctx, indentLevel));
  const uniqueTypes = [...new Set(types)];

  uniqueTypes.sort((a, b) => a.localeCompare(b));

  return uniqueTypes.length === 1 ? (uniqueTypes[0] as string) : uniqueTypes.join(separator);
}

/**
 * Converts a JSON Schema to a TypeScript type string.
 * This is the main recursive conversion function.
 *
 * @param schema - The JSON Schema to convert
 * @param ctx - Conversion context
 * @param indentLevel - Current indentation level
 *
 * @returns TypeScript type string
 */
function convertSchemaToType(schema: JsonSchema, ctx: ConversionContext, indentLevel: number): string {
  // Handle boolean schemas
  if (typeof schema === 'boolean') {
    return schema ? 'unknown' : 'never';
  }

  /**
   * Applies the nullable modifier if schema.nullable is true (OpenAPI extension).
   *
   * @param type - Resolved type text to which the nullable modifier is applied.
   *
   * @returns The type text with the nullable modifier applied.
   */
  const applyNullable = (type: string): string => {
    return schema.nullable === true && !type.includes('null') ? `${type} | null` : type;
  };

  // Handle $ref
  if (schema.$ref) {
    const ref = schema.$ref;

    // Check if already resolved
    if (ctx.refs.has(ref)) {
      return applyNullable(ctx.refs.get(ref) as string);
    }

    // Check for circular reference
    if (ctx.processing.has(ref)) {
      // Return a placeholder - the actual type will be generated later
      const typeName = refToTypeName(ref, ctx.typePrefix);

      ctx.refs.set(ref, typeName);

      return applyNullable(typeName);
    }

    ctx.processing.add(ref);

    const resolved = resolveRef(ref, ctx);
    const typeName = refToTypeName(ref, ctx.typePrefix);

    // Generate the type for this ref
    const resolvedType = convertSchemaToType(resolved, ctx, 0);

    ctx.refs.set(ref, typeName);
    ctx.generatedTypes.set(typeName, resolvedType);
    ctx.processing.delete(ref);

    return applyNullable(typeName);
  }

  // Handle enum
  if (schema.enum !== undefined) {
    const enumValues = schema.enum;

    if (enumValues.length === 0) {
      return 'never';
    }

    // Sort enum values alphabetically for consistent output
    const literals = enumValues
      .map((value) => valueToLiteral(value))
      .toSorted((a, b) => a.localeCompare(b));

    return applyNullable(literals.join(' | '));
  }

  // Handle const
  if (schema.const !== undefined) {
    return applyNullable(valueToLiteral(schema.const));
  }

  // Handle composition keywords
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    return applyNullable(convertUnionSchema(schema.anyOf, ctx, indentLevel, ' | '));
  }

  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    return applyNullable(convertUnionSchema(schema.oneOf, ctx, indentLevel, ' | '));
  }

  if (schema.allOf && Array.isArray(schema.allOf)) {
    return applyNullable(convertUnionSchema(schema.allOf, ctx, indentLevel, ' & '));
  }

  if (schema.not || schema.if) {
    const hasTypeKeywords = schema.type || schema.properties || schema.items || schema.prefixItems
      || schema.anyOf || schema.oneOf || schema.allOf || schema.enum !== undefined || schema.const !== undefined;

    if (!hasTypeKeywords && schema.not) {
      const notType = convertSchemaToType(schema.not, ctx, indentLevel);

      return applyNullable(`unknown /* NOT: ${notType} */`);
    }

    if (!hasTypeKeywords && schema.if && (schema.then || schema.else)) {
      const types: string[] = [];

      if (schema.then) {
        types.push(convertSchemaToType(schema.then, ctx, indentLevel));
      }

      if (schema.else) {
        types.push(convertSchemaToType(schema.else, ctx, indentLevel));
      }

      if (schema.then && !schema.else) {
        types.push('unknown');
      }

      const uniqueTypes = [...new Set(types)];

      uniqueTypes.sort((a, b) => a.localeCompare(b));

      return applyNullable(uniqueTypes.length === 1 ? uniqueTypes[0] as string : uniqueTypes.join(' | '));
    }
  }

  // Handle type
  const type = schema.type;

  // Handle type array (e.g., ["string", "null"])
  if (Array.isArray(type)) {
    const types = type.map((t) => {
      if (t === 'object' && schema.properties) {
        return convertObjectSchema(schema, ctx, indentLevel);
      }

      return t === 'array' ? convertArraySchema(schema, ctx, indentLevel) : convertPrimitiveType(t);
    });

    return applyNullable(types.length === 1 ? types[0] as string : types.join(' | '));
  }

  // Handle single type or implicit type from structure
  if (type === 'object' || schema.properties) {
    return applyNullable(convertObjectSchema(schema, ctx, indentLevel));
  }

  if (type === 'array' || schema.items || schema.prefixItems) {
    return applyNullable(convertArraySchema(schema, ctx, indentLevel));
  }

  return type ? applyNullable(convertPrimitiveType(type)) : applyNullable('unknown');
}

/**
 * Converts a JSON Schema into a TypeScript type expression or declaration.
 *
 * The converter supports primitives, enums, `const`, objects with `properties`, `required`, `additionalProperties`,
 * and `patternProperties`, arrays and tuples (`prefixItems` and draft-7 `items` arrays), the composition keywords
 * `allOf`, `anyOf`, `oneOf`, local `$ref` resolution with circular-reference handling, `not`, and `if`/`then`/`else`.
 * Object properties and union members are sorted alphabetically so the output is deterministic, and `description`
 * or `deprecated` metadata becomes JSDoc when `includeDescriptions` is enabled.
 *
 * `$ref` targets are emitted as auxiliary declarations in `auxiliaryTypes`; consumers must declare them next to
 * `mainType` for the generated code to compile. External references and unresolved local pointers throw.
 *
 * @param schema - Schema to convert. An array of schemas becomes a tuple type, and `false` becomes an empty tuple.
 * @param options - Naming, indentation, and JSDoc generation options.
 *
 * @example
 * ```typescript
 * const result = jsonSchemaToType(
 *   {
 *     type: 'object',
 *     properties: {
 *       name: { type: 'string', description: 'The name' },
 *       age: { type: 'number' },
 *     },
 *     required: ['name'],
 *   },
 *   { typeName: 'Person' },
 * );
 *
 * // result.mainType starts with 'type Person = {' and contains a JSDoc comment for `name`.
 * // result.auxiliaryTypes is [] when the schema has no $ref targets.
 * ```
 *
 * @returns The main type plus any auxiliary type declarations required by `$ref` resolution.
 *
 * @throws {Error} When a `$ref` is external, cannot be resolved, or points to an invalid array index.
 */
export function jsonSchemaToType(
  schema: false | JsonSchema | JsonSchema[],
  options: ConversionOptions = {},
): ConversionResult {
  const { includeDescriptions = true, indent = '  ', typeName } = options;

  if (schema === false) {
    const mainType = typeName ? `type ${typeName} = [];` : '[]';

    return { auxiliaryTypes: [], mainType };
  }

  if (Array.isArray(schema) && schema.length === 0) {
    const mainType = typeName ? `type ${typeName} = [];` : '[]';

    return { auxiliaryTypes: [], mainType };
  }

  const isArraySchema = Array.isArray(schema);
  const rootSchema = isArraySchema ? { items: schema, type: 'array' as const } : schema;

  // Collect all definitions from the schema (from root and all array elements)
  const defs: Record<string, JsonSchema> = {};

  if (isArraySchema) {
    for (const element of schema) {
      Object.assign(defs, element.$defs, element.definitions);
    }
  } else {
    Object.assign(defs, rootSchema.$defs, rootSchema.definitions);
  }

  const ctx: ConversionContext = {
    defs,
    generatedTypes: new Map(),
    includeDescriptions,
    indent,
    processing: new Set(),
    refs: new Map(),
    rootSchema,
    typeCounter: 0,
    typePrefix: typeName ?? '',
  };

  let typeBody: string;

  if (isArraySchema) {
    const tupleElements: string[] = [];

    for (const s of schema) {
      const typeString = convertSchemaToType(s, ctx, 0);

      if (ctx.includeDescriptions && s.description) {
        const jsDoc = generateJsDoc(s.description, 0, indent);

        tupleElements.push(`${jsDoc}${indent}${typeString}`);
      } else {
        tupleElements.push(`${indent}${typeString}`);
      }
    }

    typeBody = `[\n${tupleElements.join(',\n')},\n]`;
  } else {
    typeBody = convertSchemaToType(rootSchema, ctx, 0);
  }

  const mainType = typeName ? `type ${typeName} = ${typeBody};` : typeBody;
  const auxiliaryTypes: string[] = [];

  for (const [name, body] of ctx.generatedTypes) {
    auxiliaryTypes.push(`type ${name} = ${body};`);
  }

  return { auxiliaryTypes, mainType };
}
