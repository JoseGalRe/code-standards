import type { TSESTree } from '@typescript-eslint/utils';
import type { Rule } from 'eslint';

/**
 * ESLint rule that disallows inline type imports mixed with value imports in
 * the same statement.
 *
 * Registered by the `custom` config layer as `custom/no-inline-type-imports`.
 * The fixer splits the declaration into one value import and one `import type`
 * statement.
 *
 * @example
 * ```json
 * {
 *   "custom/no-inline-type-imports": ["error"]
 * }
 * ```
 */
export const noInlineTypeImports: Rule.RuleModule = {
  create: (context) => {
    const { sourceCode } = context;

    return {
      ImportDeclaration: (node) => {
        const declaration = node as TSESTree.ImportDeclaration;
        const { importKind, source, specifiers } = declaration;

        if (importKind === 'type') {
          return;
        }

        const valueSpecifiers: string[] = [];
        const typeSpecifiers: TSESTree.ImportSpecifier[] = [];
        const defaultSpecifiers: string[] = [];

        for (const spec of specifiers) {
          if (spec.type === 'ImportSpecifier' && spec.importKind === 'type') {
            typeSpecifiers.push(spec);
          } else if (spec.type === 'ImportDefaultSpecifier') {
            defaultSpecifiers.push(sourceCode.text.slice(...spec.range));
          } else {
            valueSpecifiers.push(sourceCode.text.slice(...spec.range));
          }
        }

        if (typeSpecifiers.length === 0) {
          return;
        }

        context.report({
          data: {
            values: typeSpecifiers.map((specifier) => specifier.local.name).join(', '),
          },
          fix(fixer) {
            if (declaration.attributes.length > 0 || sourceCode.getCommentsInside(node).length > 0) {
              return null;
            }

            const valueClause = [
              ...defaultSpecifiers,
              ...(valueSpecifiers.length > 0 ? [`{ ${valueSpecifiers.join(', ')} }`] : []),
            ].join(', ');

            const types = typeSpecifiers.map((specifier) => {
              return sourceCode.text.slice(specifier.imported.range[0], specifier.range[1]);
            });

            const newImports = [
              ...(valueClause ? [`import ${valueClause} from ${source.raw};`] : []),
              `import type { ${types.join(', ')} } from ${source.raw};`,
            ];

            return fixer.replaceText(node, newImports.join('\n'));
          },
          messageId: 'noInline',
          node,
        });
      },
    };
  },
  meta: {
    docs: {
      description: 'Disallow inline type imports mixed with value imports in the same statement',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      noInline: 'Inline type "{{values}}" should be separated into their own `import type` statements.',
    },
    schema: [],
    type: 'suggestion',
  },
};
