/**
 * Internal conversion state shared across the recursive conversion.
 *
 * It accumulates resolved references, cycle detection information, generated auxiliary types, and formatting
 * defaults. Consumers normally do not build this object directly; `jsonSchemaToType` creates it per invocation.
 */
export type ConversionContext = {
  /**
   * Definitions collected from the root schema, or from every element when the input is an array of schemas.
   */
  defs: Record<string, JsonSchema>;
  /**
   * Auxiliary type declarations collected during conversion, keyed by type name in resolution order.
   */
  generatedTypes: Map<string, string>;
  /**
   * Whether descriptions and deprecations are rendered as JSDoc.
   */
  includeDescriptions: boolean;
  /**
   * Indentation string applied to nested generated types.
   */
  indent: string;
  /**
   * Reference pointers currently being resolved, used to detect and break circular references.
   */
  processing: Set<string>;
  /**
   * Resolved reference cache that maps a `$ref` pointer to its generated type name.
   */
  refs: Map<string, string>;
  /**
   * Root schema used to resolve `#` references.
   */
  rootSchema: JsonSchema;
  /**
   * Numeric counter carried by the context. The current implementation initializes it and never reads or increments
   * it.
   */
  typeCounter: number;
  /**
   * Prefix applied to reference-derived type names to avoid collisions between rules.
   */
  typePrefix: string;
};

/**
 * Configuration accepted by `jsonSchemaToType`.
 */
export type ConversionOptions = {
  /**
   * Whether `description` and `deprecated` metadata produce JSDoc comments in the generated type.
   *
   * @default true
   */
  includeDescriptions?: boolean;
  /**
   * Indentation string repeated per nesting level of the generated type.
   *
   * @default '  ' (two spaces)
   */
  indent?: string;
  /**
   * Name used for the root type declaration.
   *
   * When provided, the main type is emitted as `type <name> = ...;` and reference-derived auxiliary type names are
   * prefixed with it. When omitted, the main type is a bare expression.
   *
   * @default undefined
   */
  typeName?: string;
};

/**
 * Output produced by `jsonSchemaToType`.
 */
export type ConversionResult = {
  /**
   * Additional `type <name> = ...;` declarations generated for `$ref` targets, in resolution order. They must be
   * declared alongside `mainType` for the result to compile.
   */
  auxiliaryTypes: string[];
  /**
   * Main type expression or declaration, optionally wrapped as `type <name> = ...;` when `typeName` was provided.
   */
  mainType: string;
};

/**
 * Subset of the JSON Schema specification accepted by `jsonSchemaToType`.
 *
 * The type keeps the keywords that influence type generation across drafts 4 to 2020-12 plus the OpenAPI
 * `nullable` extension, and allows unknown extra properties for extensibility. Validation-only keywords such as
 * lengths, ranges, and patterns are accepted but ignored during conversion.
 *
 * @example
 * ```typescript
 * const schema: JsonSchema = {
 *   type: 'object',
 *   properties: { name: { type: 'string' } },
 *   required: ['name'],
 * };
 * ```
 */
export type JsonSchema = {
  /**
   * Additional schema keywords.
   *
   * Unknown properties are preserved for extensibility and ignored during conversion.
   */
  [key: string]: unknown;
  /**
   * Implementation comment carried by the schema.
   *
   * Accepted for compatibility and ignored during conversion.
   *
   * @default undefined
   */
  $comment?: string;
  /**
   * Definitions container introduced by draft 2019-09 and later.
   *
   * @default undefined
   */
  $defs?: Record<string, JsonSchema>;
  /**
   * Schema identifier.
   *
   * Accepted for compatibility and ignored during conversion.
   *
   * @default undefined
   */
  $id?: string;
  /**
   * JSON Pointer reference resolved against the root schema, such as `#/$defs/Name`.
   *
   * External references are rejected. When the written path targets `definitions` or `$defs` and that container is
   * absent, the converter falls back to the sibling container.
   *
   * @default undefined
   */
  $ref?: string;
  /**
   * Meta-schema dialect declared with `$schema`.
   *
   * Accepted for compatibility and ignored during conversion.
   *
   * @default undefined
   */
  $schema?: string;
  /**
   * Rest element schema for draft-7 tuples declared through `items` as an array.
   *
   * @default undefined
   */
  additionalItems?: boolean | JsonSchema;
  /**
   * Index signature behavior for objects. `false` omits the signature, an object schema emits `[key: string]: T`,
   * and `true` or undefined emits `[key: string]: unknown`.
   *
   * @default undefined, treated as `true` by the JSON Schema specification
   */
  additionalProperties?: boolean | JsonSchema;
  /**
   * Schemas that must all match, converted to an intersection joined with `&`.
   *
   * @default undefined
   */
  allOf?: JsonSchema[];
  /**
   * Schemas where at least one must match, converted to an alphabetically sorted union. When `includeDescriptions`
   * is enabled, member descriptions and deprecations can add per-value JSDoc.
   *
   * @default undefined
   */
  anyOf?: JsonSchema[];
  /**
   * Single literal value, converted like an enum entry except that object values are JSON-stringified.
   *
   * @default undefined
   */
  const?: unknown;
  /**
   * Default value declared by the schema.
   *
   * Accepted for compatibility and ignored during conversion.
   *
   * @default undefined
   */
  default?: unknown;
  /**
   * Definitions container from draft 7 and earlier, resolved with the same fallback rules as `$defs`.
   *
   * @default undefined
   */
  definitions?: Record<string, JsonSchema>;
  /**
   * Marks the value as deprecated. When `includeDescriptions` is enabled it adds an `@deprecated` tag.
   *
   * @default undefined
   */
  deprecated?: boolean;
  /**
   * Human-readable description. When `includeDescriptions` is enabled it becomes a JSDoc comment on a property,
   * tuple element, or union member.
   *
   * @default undefined
   */
  description?: string;
  /**
   * Type applied when `if` does not match. Only used when no other type keyword exists.
   *
   * @default undefined
   */
  else?: JsonSchema;
  /**
   * Allowed literal values, converted to an alphabetically sorted union of string, number, boolean, `null`, and
   * array literals. An empty enum becomes `never`.
   *
   * @default undefined
   */
  enum?: readonly unknown[];
  /**
   * Exclusive maximum number (numeric form) or legacy boolean form.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  exclusiveMaximum?: boolean | number;
  /**
   * Exclusive minimum number (numeric form) or legacy boolean form.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  exclusiveMinimum?: boolean | number;
  /**
   * String format such as `date-time` or `email`.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  format?: string;
  /**
   * Condition schema. When no other type keyword exists and `then` or `else` is present, their union is emitted;
   * otherwise the conditional keywords are ignored.
   *
   * @default undefined
   */
  if?: JsonSchema;
  /**
   * Array item schema. An object value types every item, an array value describes a tuple (draft 7), and boolean
   * values are treated as absent because `convertArraySchema` only inspects object item schemas.
   *
   * @default undefined, producing `unknown[]` for arrays with no object item schema
   */
  items?: JsonSchema | JsonSchema[];
  /**
   * Inclusive maximum number.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  maximum?: number;
  /**
   * Maximum number of array items.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  maxItems?: number;
  /**
   * Maximum string length.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  maxLength?: number;
  /**
   * Maximum number of object properties.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  maxProperties?: number;
  /**
   * Inclusive minimum number.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  minimum?: number;
  /**
   * Minimum number of array items.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  minItems?: number;
  /**
   * Minimum string length.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  minLength?: number;
  /**
   * Minimum number of object properties.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  minProperties?: number;
  /**
   * Number multiple.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  multipleOf?: number;
  /**
   * Schema that must not match. When no other type keyword exists, the result is `unknown` followed by a `NOT`
   * comment describing the excluded type; otherwise it is ignored.
   *
   * @default undefined
   */
  not?: JsonSchema;
  /**
   * OpenAPI extension that appends `| null` to the generated type when `true`, unless `null` is already present.
   *
   * @default undefined
   */
  nullable?: boolean;
  /**
   * Schemas where exactly one must match, converted with the same rules as `anyOf`.
   *
   * @default undefined
   */
  oneOf?: JsonSchema[];
  /**
   * Regular expression pattern.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  pattern?: string;
  /**
   * Anchored literal patterns with one optional literal group, such as `^must(?:Not)?Match$`, expand into named
   * properties only when every pattern has this form, no keys overlap, and `additionalProperties` is not a schema.
   * Otherwise, patterns merge into a single `[key: string]: A | B` index signature with deduplicated and sorted
   * value types, taking precedence over `additionalProperties`.
   *
   * @default undefined
   */
  patternProperties?: Record<string, JsonSchema>;
  /**
   * Tuple item schemas introduced by draft 2020-12. When present, `items` supplies the rest element type.
   *
   * @default undefined
   */
  prefixItems?: JsonSchema[];
  /**
   * Object properties. Properties are sorted alphabetically, keys that are not valid identifiers are quoted, and
   * `required` decides the optional marker.
   *
   * @default undefined
   */
  properties?: Record<string, JsonSchema>;
  /**
   * Names of the properties emitted without the optional `?` marker.
   *
   * @default undefined
   */
  required?: readonly string[];
  /**
   * Type applied when `if` matches. Only used when no other type keyword exists.
   *
   * @default undefined
   */
  then?: JsonSchema;
  /**
   * Schema title.
   *
   * Accepted for compatibility and ignored during conversion.
   *
   * @default undefined
   */
  title?: string;
  /**
   * Type or union of types declared by the schema.
   *
   * `integer` maps to `number`, and unknown type values map to `unknown`. When omitted, the type is inferred from
   * `properties`, `items`, or `prefixItems`.
   *
   * @default undefined
   */
  type?: JsonSchemaType | JsonSchemaType[];
  /**
   * Whether array items must be unique.
   *
   * Accepted for validation compatibility and ignored during conversion.
   *
   * @default undefined
   */
  uniqueItems?: boolean;
};

/**
 * Primitive JSON Schema types understood by the converter.
 *
 * `integer` is normalized to `number`; `object` and `array` are usually expanded by the structural converters before
 * the primitive mapping is consulted.
 */
export type JsonSchemaType = 'array' | 'boolean' | 'integer' | 'null' | 'number' | 'object' | 'string';
