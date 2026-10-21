import type { TSESTree } from '@typescript-eslint/utils';
import type { Rule, Scope } from 'eslint';

type ArrowFunctionExpression = NonNullable<Rule.NodeListener['ArrowFunctionExpression']>;
type FunctionDeclaration = NonNullable<Rule.NodeListener['FunctionDeclaration']>;
type FunctionExpression = NonNullable<Rule.NodeListener['FunctionExpression']>;

type FunctionNode = Parameters<ArrowFunctionExpression | FunctionDeclaration | FunctionExpression>[0];
type FunctionExpressionNode = TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression;

type PatternParameter = {
  index: number;
  parameter: TSESTree.Parameter;
  pattern: TSESTree.ArrayPattern | TSESTree.ObjectPattern;
};

const RESERVED_PARAMETER_NAMES = new Set(
  ('arguments await break case catch class const continue debugger default delete do else enum eval export extends '
    + 'false finally for function if implements import in instanceof interface let new null package private protected '
    + 'public return static super switch this throw true try typeof var void while with yield').split(' '),
);

function collectUsedNames(scope: Scope.Scope, names: Set<string>) {
  for (const variable of scope.variables) {
    names.add(variable.name);
  }

  for (const reference of scope.references) {
    names.add(reference.identifier.name);
  }

  for (const child of scope.childScopes) {
    collectUsedNames(child, names);
  }
}

/**
 * ESLint rule that prohibits value destructuring and inline object parameter types.
 *
 * Registered by the `custom` config layer as `custom/no-param-destructuring`.
 * Destructured parameters are reported and, when the body is a block statement,
 * the fixer moves the binding into the function body using the configured
 * default prop name.
 * Inline object annotations are extracted into named aliases based on the
 * function name when their scope can be preserved safely.
 *
 * @example
 * ```json
 * {
 *   "custom/no-param-destructuring": ["error", { "ignoreArrowFunctions": true }]
 * }
 * ```
 */
export const noParamDestructuring: Rule.RuleModule = {
  create: (context) => {
    const { options, sourceCode } = context;

    const {
      autoIncrementDefaultPropName = false,
      defaultPropName = 'props',
      ignoreArrowFunctions = false,
      ignoreCallbackExpressions = false,
      ignoreNonBlockStatement = false,
      ignoreTypes = false,
    } = options[0];

    const usedTypeNames = new Set<string>();

    collectUsedNames(sourceCode.getScope(sourceCode.ast), usedTypeNames);

    let reportCount = 0;

    const checkParameterTypes = (node: FunctionNode, functionNode: FunctionExpressionNode) => {
      for (const parameter of functionNode.params) {
        const binding = parameter.type === 'TSParameterProperty' ? parameter.parameter : parameter;
        const target = binding.type === 'AssignmentPattern' ? binding.left : binding;
        const annotation = target.typeAnnotation?.typeAnnotation;

        if (annotation?.type !== 'TSTypeLiteral') {
          continue;
        }

        context.report({
          fix: (fixer) => {
            const parent = functionNode.parent;
            const declaration = parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportDefaultDeclaration'
              ? parent
              : functionNode;

            if (functionNode.type !== 'FunctionDeclaration'
              || !functionNode.id
              || functionNode.typeParameters
              || (declaration.parent.type !== 'Program' && declaration.parent.type !== 'BlockStatement')) {
              return null;
            }

            const functionScope = sourceCode.getScope(node);
            const localNames = new Set(functionScope.variables.map((variable) => variable.name));

            // Type queries such as `typeof arguments` can remain unresolved in parameter scopes.
            // Check local names directly, including references inside nested member signatures.
            const hasFunctionLocalReference = (scope: Scope.Scope): boolean => {
              return scope.references.some((reference) => reference.identifier.range
                && reference.identifier.range[0] >= annotation.range[0]
                && reference.identifier.range[0] < annotation.range[1]
                && localNames.has(reference.identifier.name))
              || scope.childScopes.some((childScope) => hasFunctionLocalReference(childScope));
            };

            if (hasFunctionLocalReference(functionScope)) {
              return null;
            }

            const functionName = functionNode.id.name;
            const baseName = `${functionName.slice(0, 1).toUpperCase()}${functionName.slice(1)}Props`;

            let typeName = baseName;
            let suffix = 1;

            while (usedTypeNames.has(typeName)) {
              suffix += 1;
              typeName = `${baseName}${suffix}`;
            }

            usedTypeNames.add(typeName);

            const typeText = sourceCode.text.slice(...annotation.range);
            const anchor = node.parent?.type === 'ExportNamedDeclaration' || node.parent?.type === 'ExportDefaultDeclaration'
              ? node.parent
              : node;

            const [comment] = sourceCode.getCommentsBefore(anchor);
            const insertionPoint = comment?.range?.[0] ?? declaration.range[0];

            return [
              fixer.insertTextBeforeRange([insertionPoint, insertionPoint], `type ${typeName} = ${typeText};\n\n`),
              fixer.replaceTextRange(annotation.range, typeName),
            ];
          },
          messageId: 'noInlineParamType',
          node: annotation,
        });
      }
    };

    const checkFunction = (node: FunctionNode) => {
      const functionNode = node as FunctionExpressionNode;
      const { body, generator, params, parent, type } = functionNode;

      if (type === 'ArrowFunctionExpression' && ignoreArrowFunctions) {
        return;
      }

      if (ignoreCallbackExpressions && parent?.type === 'CallExpression') {
        return;
      }

      if (ignoreNonBlockStatement && body.type !== 'BlockStatement') {
        return;
      }

      if (!ignoreTypes) {
        checkParameterTypes(node, functionNode);
      }

      const patterns: PatternParameter[] = [];

      for (const [index, parameter] of params.entries()) {
        const pattern = parameter.type === 'AssignmentPattern' ? parameter.left : parameter;

        if (pattern.type === 'ObjectPattern' || pattern.type === 'ArrayPattern') {
          patterns.push({ index, parameter, pattern });
        }
      }

      if (patterns.length === 0) {
        return;
      }

      const createFix = () => {
        if (generator
          || body.type !== 'BlockStatement'
          || defaultPropName.trim() !== defaultPropName
          || !/^[$_\p{ID_Start}][$\u{200C}\u{200D}\p{ID_Continue}]*$/u.test(defaultPropName)
          || RESERVED_PARAMETER_NAMES.has(defaultPropName)) {
          return;
        }

        const usedNames = new Set<string>();
        const scope = sourceCode.getScope(node);

        collectUsedNames(scope, usedNames);

        // Direct eval can observe bindings that scope analysis cannot resolve statically.
        if (usedNames.has('eval')) {
          return;
        }

        const variables = sourceCode.getDeclaredVariables(node);
        const changes: { binding: string; range: TSESTree.Node['range']; replacement: string }[] = [];

        let nextCount = reportCount;

        for (const { index, parameter, pattern } of patterns) {
          const bindings = variables.filter((variable) => {
            return variable.identifiers.some((identifier) => identifier.range
              && identifier.range[0] >= pattern.range[0] && identifier.range[0] < pattern.range[1]);
          });

          const hasParameterAccesses = bindings.some((variable) => {
            return variable.references.some((reference) => (reference.isRead() || (reference.isWrite() && !reference.init))
              && (!reference.identifier.range || reference.identifier.range[0] < body.range[0]));
          });

          // Moving destructuring after a later initializer can change evaluation order,
          // even when it does not reference a destructured binding directly.
          if (hasParameterAccesses
            || params.slice(index + 1).some((param) => param.type === 'AssignmentPattern')
            || bindings.some((variable) => variable.defs.some((definition) => definition.type !== 'Parameter'))) {
            return;
          }

          nextCount += 1;

          let propName = autoIncrementDefaultPropName && nextCount > 1 ? `${defaultPropName}${nextCount}` : defaultPropName;

          if (!autoIncrementDefaultPropName && usedNames.has(propName)) {
            return;
          }

          while (usedNames.has(propName)) {
            nextCount += 1;
            propName = `${defaultPropName}${nextCount}`;
          }

          usedNames.add(propName);

          const { typeAnnotation } = pattern;
          const patternText = sourceCode.text.slice(pattern.range[0], typeAnnotation?.range[0] ?? pattern.range[1]);
          const annotation = typeAnnotation ? sourceCode.text.slice(...typeAnnotation.range) : '';
          const defaultValue = sourceCode.text.slice(pattern.range[1], parameter.range[1]);

          const isReassigned = bindings.some((variable) => variable.references.some((reference) => reference.isWrite()
            && reference.identifier.range && reference.identifier.range[0] >= body.range[0]));

          changes.push({
            binding: `${isReassigned ? 'let' : 'const'} ${patternText} = ${propName};`,
            range: parameter.range,
            replacement: `${propName}${annotation}${defaultValue}`,
          });
        }

        reportCount = nextCount;

        let insertionPoint = body.range[0] + 1;

        for (const statement of body.body) {
          if (statement.type !== 'ExpressionStatement' || statement.directive === undefined) {
            break;
          }

          insertionPoint = statement.range[1];
        }

        return (fixer: Rule.RuleFixer) => [
          ...changes.map((change) => fixer.replaceTextRange(change.range, change.replacement)),
          fixer.insertTextAfterRange([insertionPoint, insertionPoint], `\n${changes.map((change) => change.binding).join('\n')}\n`),
        ];
      };

      const fix = createFix();

      for (const [index, entry] of patterns.entries()) {
        context.report({
          ...(index === 0 && fix && { fix }),
          messageId: 'noParamDestructuring',
          node: entry.pattern,
        });
      }
    };

    return {
      ArrowFunctionExpression: checkFunction,
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
    };
  },
  meta: {
    defaultOptions: [
      {
        autoIncrementDefaultPropName: false,
        defaultPropName: 'props',
        ignoreArrowFunctions: false,
        ignoreCallbackExpressions: false,
        ignoreNonBlockStatement: false,
        ignoreTypes: false,
      },
    ],
    docs: {
      description: 'Prohibit destructuring and inline object types in function parameters',
      recommended: false,
    },
    fixable: 'code',
    messages: {
      noInlineParamType: 'Inline object types are not allowed in function parameters. Use a named type instead.',
      noParamDestructuring: 'No destructuring in function parameters. Destructure inside the function body instead.',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          autoIncrementDefaultPropName: {
            description: 'Automatically increment the default prop name when two or more destructured parameters are found.',
            type: 'boolean',
          },
          defaultPropName: {
            description: 'Default name to use when destructuring is found in function parameters, default is "props".',
            type: 'string',
          },
          ignoreArrowFunctions: {
            description: 'Ignore destructuring in arrow function parameters.',
            type: 'boolean',
          },
          ignoreCallbackExpressions: {
            description: 'Ignore destructuring in callback function parameters, like in `map`, `filter`, etc.',
            type: 'boolean',
          },
          ignoreNonBlockStatement: {
            description: 'Ignore destructuring in non-block statement function bodies, like in single-line arrow functions.',
            type: 'boolean',
          },
          ignoreTypes: {
            description: 'Allow inline object types in function parameter annotations.',
            type: 'boolean',
          },
        },
        type: 'object',
      },
    ],
    type: 'suggestion',
  },
};
