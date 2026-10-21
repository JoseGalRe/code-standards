import type { TSESTree } from '@typescript-eslint/utils';
import type { Rule } from 'eslint';

type ImportDeclaration = TSESTree.ImportDeclaration;
type ExportNamedDeclaration = TSESTree.ExportNamedDeclaration;

type ImportKind = ImportDeclaration['importKind'];

type ImportOptions = {
  considerQueryString: boolean;
  ignoreDeclareModules: boolean;
  includeExports: boolean;
  preferInline: boolean;
};

function isInsideDeclareModule(node: ExportNamedDeclaration | ImportDeclaration) {
  let current: TSESTree.Node | undefined = node.parent;

  while (current) {
    if (current.type === 'TSModuleDeclaration' && current.declare === true) {
      return true;
    }

    current = current.parent;
  }

  return false;
}

/**
 * ESLint rule that disallows duplicate imports and, optionally, duplicate
 * exports of the same module source.
 *
 * Registered by the `custom` config layer as `custom/no-duplicate-imports`.
 * When `includeExports` is enabled it also reports duplicate named exports, and
 * the fixer merges duplicate import declarations into a single statement.
 *
 * @example
 * ```json
 * {
 *   "custom/no-duplicate-imports": ["error", { "considerQueryString": true }]
 * }
 * ```
 */
export const noDuplicateImports: Rule.RuleModule = {
  create: (context) => {
    const { sourceCode } = context;

    const options: ImportOptions = {
      considerQueryString: false,
      ignoreDeclareModules: false,
      includeExports: false,
      preferInline: false,
      ...context.options[0],
    };

    const imports = new Map<string, Record<ImportKind, ImportDeclaration[]>>();
    const exports = new Map<string, Record<ImportKind, ExportNamedDeclaration[]>>();

    const normalizeSource = (source: string) => {
      const queryIndex = source.indexOf('?');

      return queryIndex === -1 || options.considerQueryString ? source : source.slice(0, queryIndex);
    };

    const mergeImports = (
      firstDeclaration: ImportDeclaration,
      declarations: ImportDeclaration[],
      kind: ImportKind,
      fixer: Rule.RuleFixer,
    ) => {
      const first = declarations.find((declaration) => declaration.importKind === 'value') ?? firstDeclaration;

      const names = new Map<string, string>();
      const comments = sourceCode.getAllComments();

      const isTypeDeclaration = kind === 'type' || declarations.every((declaration) => declaration.importKind === 'type');

      let defaultName: string | undefined;
      let hasSideEffectImport = false;
      let hasValueSpecifier = false;

      for (const declaration of declarations) {
        // Do not erase query semantics, attributes, comments, or namespace bindings.
        if (declaration.source.value !== first.source.value
          || declaration.attributes.length > 0
          || comments.some((comment) => !comment.range
            || (comment.range[0] >= declaration.range[0] && comment.range[1] <= declaration.range[1]))) {
          return null;
        }

        hasSideEffectImport ||= declaration.specifiers.length === 0;

        for (const specifier of declaration.specifiers) {
          if (specifier.type === 'ImportNamespaceSpecifier') {
            return null;
          }

          if (specifier.type === 'ImportDefaultSpecifier') {
            if (defaultName || declaration.importKind === 'type') {
              return null;
            }

            defaultName = specifier.local.name;
            hasValueSpecifier = true;
            continue;
          }

          const imported = sourceCode.text.slice(...specifier.imported.range);

          const local = specifier.local.name;
          const isType = declaration.importKind === 'type' || specifier.importKind === 'type';

          const binding = specifier.imported.type === 'Identifier' && specifier.imported.name === local
            ? local
            : `${imported} as ${local}`;

          const name = `${!isTypeDeclaration && isType ? 'type ' : ''}${binding}`;

          if (names.has(local) && names.get(local) !== name) {
            return null;
          }

          names.set(local, name);

          hasValueSpecifier ||= !isType;
        }
      }

      if (hasSideEffectImport && !hasValueSpecifier && names.size > 0) {
        return null;
      }

      const clause = [
        ...(defaultName ? [defaultName] : []),
        ...(names.size > 0 ? [`{ ${names.values().toArray().join(', ')} }`] : []),
      ].join(', ');

      const replacement = clause
        ? `import ${isTypeDeclaration ? 'type ' : ''}${clause} from ${first.source.raw};`
        : `import ${first.source.raw};`;

      return declarations.map((declaration) => {
        return declaration === first
          ? fixer.replaceTextRange(declaration.range, replacement)
          : fixer.removeRange(declaration.range);
      });
    };

    return {
      'ExportNamedDeclaration': (node) => {
        const localNode = node as ExportNamedDeclaration;

        if (!options.includeExports || !localNode.source) {
          return;
        }

        if (options.ignoreDeclareModules && isInsideDeclareModule(localNode)) {
          return;
        }

        const source = normalizeSource(localNode.source.value);
        const key = `${localNode.parent.range[0]}:${source}`;

        const kind = localNode.exportKind === 'type' ? 'type' : 'value';

        const record: Record<ImportKind, ExportNamedDeclaration[]> = exports.get(key) ?? { type: [], value: [] };

        exports.set(key, record);
        record[kind].push(localNode);

        if (record[kind].length > 1) {
          context.report({
            data: {
              source,
            },
            messageId: kind === 'type' ? 'duplicateTypeExport' : 'duplicateExport',
            node,
          });
        }
      },
      'ImportDeclaration': (node) => {
        const localNode = node as ImportDeclaration;

        if (options.ignoreDeclareModules && isInsideDeclareModule(localNode)) {
          return;
        }

        const source = normalizeSource(localNode.source.value);
        const key = `${localNode.parent.range[0]}:${source}`;

        const kind = !options.preferInline && localNode.importKind === 'type' ? 'type' : 'value';

        const record: Record<ImportKind, ImportDeclaration[]> = imports.get(key) ?? { type: [], value: [] };

        imports.set(key, record);
        record[kind].push(localNode);
      },
      'Program:exit': () => {
        for (const record of imports.values()) {
          for (const kind of ['type', 'value'] as const) {
            const declarations = record[kind];

            const [first, ...duplicates] = declarations;

            if (!first) {
              continue;
            }

            for (const declaration of duplicates) {
              context.report({
                data: { source: normalizeSource(first.source.value) },
                fix: (fixer) => mergeImports(first, declarations, kind, fixer),
                messageId: kind === 'type' ? 'duplicateTypeImport' : 'duplicateImport',
                node: declaration,
              });
            }
          }
        }
      },
    };
  },
  meta: {
    defaultOptions: [
      {
        considerQueryString: false,
        ignoreDeclareModules: false,
        includeExports: false,
        preferInline: false,
      },
    ],
    docs: {
      description: 'Disallow duplicate imports',
      recommended: true,
    },
    fixable: 'code',
    messages: {
      duplicateExport: 'Duplicate export from "{{source}}".',
      duplicateImport: 'Duplicate import from "{{source}}".',
      duplicateTypeExport: 'Duplicate export type from "{{source}}".',
      duplicateTypeImport: 'Duplicate import type from "{{source}}".',
    },
    schema: [
      {
        additionalProperties: false,
        properties: {
          considerQueryString: {
            description: 'Allow query strings in import paths to be considered for duplicates.',
            type: 'boolean',
          },
          ignoreDeclareModules: {
            description: 'Ignore duplicate imports from declared modules.',
            type: 'boolean',
          },
          includeExports: {
            description: 'Include exports in the duplicate check.',
            type: 'boolean',
          },
          preferInline: {
            description: 'Prefer inline imports over separate import statements.',
            type: 'boolean',
          },
        },
        type: 'object',
      },
    ],
    type: 'problem',
  },
};
