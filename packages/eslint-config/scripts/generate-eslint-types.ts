import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { builtinRules } from 'eslint/use-at-your-own-risk';
import { format } from 'vite-plus/fmt';

import * as eslintConfig from '../src/configs/index.ts';
import { jsonSchemaToType } from '../src/utils/json-schema-to-type/json-schema-to-type.ts';

import type { JsonSchema } from '../src/utils/json-schema-to-type/json-schema-to-type-types.ts';
import type { Linter } from 'eslint';

/**
 * Cleans a string by removing special characters that are not valid in TypeScript identifiers.
 *
 * @param value - The string to clean
 *
 * @returns Cleaned string
 */
function cleanString(value: string): string {
  return value.replaceAll(/[/@]/g, '');
}

/**
 * Converts a kebab-case string to PascalCase, suitable for TypeScript type names.
 *
 * @param value - The kebab-case string to convert
 *
 * @returns PascalCase string suitable for TypeScript type names
 */
function kebabToPascalCase(value: string): string {
  return cleanString(value).replaceAll(/(^\w|-\w)/g, (match) => match.replace('-', '').toUpperCase());
}

/**
 * Measures the execution time of a callback function.
 *
 * @param callback - Function to execute and measure
 *
 * @returns Object with the result of the callback and elapsed time in milliseconds
 */
export function measureTime<T>(callback: () => T): { elapsedMs: number; result: T } {
  const start = performance.now();
  const result = callback();
  const elapsedMs = performance.now() - start;

  return { elapsedMs, result };
}

/**
 * Measures the execution time of an async callback function.
 *
 * @param callback - Async function to execute and measure
 *
 * @returns Object with the result of the callback and elapsed time in milliseconds
 */
export async function measureTimeAsync<T>(callback: () => Promise<T>): Promise<{ elapsedMs: number; result: T }> {
  const start = performance.now();
  const result = await callback();
  const elapsedMs = performance.now() - start;

  return { elapsedMs, result };
}

/**
 * Logs progress on the same line, overwriting previous output.
 *
 * When current equals total, shows "Completed" instead and adds newline.
 *
 * @param current - Current item number
 * @param total - Total items
 * @param message - Name of the current item
 * @param elapsedMs - Optional elapsed time in ms (shown on completion)
 */
function logProgress(current: number, total: number, message: string, elapsedMs?: number): void {
  const currentPadded = String(current).padStart(String(total).length, '0');
  const isComplete = current === total;

  const status = isComplete ? 'Completed' : 'Building';
  const suffix = isComplete ? '' : ` - ${message}`;
  const timing = isComplete && elapsedMs !== undefined ? ` in ${Math.round(elapsedMs)} ms` : '';

  const content = `> [generate-eslint-types] ${status} ${currentPadded}/${total}${suffix}${timing}`;

  if (process.stdout.isTTY) {
    const newline = isComplete ? '\n\n' : '';

    process.stdout.write(`\u{1B}[2K\r${content}${newline}`);
  } else if (isComplete) {
    process.stdout.write(`${content}\n\n`);
  }
}

/**
 * Generates TypeScript types for all ESLint rules from the configured plugins.
 * This function collects all rules, converts their JSON Schemas to TypeScript types,
 * and writes the output to eslint-rules.ts.
 */
export async function generateEslintTypes(): Promise<void> {
  const startTime = performance.now();

  const eslintBase = {
    plugins: {
      '': {
        rules: Object.fromEntries(builtinRules.entries()),
      },
    },
  };

  const configs = await Promise.all([
    eslintBase,
    eslintConfig.setup(),
    eslintConfig.antfu(),
    eslintConfig.javascript(),
    eslintConfig.typescript(),
    eslintConfig.promise(),
    eslintConfig.node(),
    eslintConfig.sonar(),
    eslintConfig.regexp(),
    eslintConfig.security(),
    eslintConfig.unicorn(),
    eslintConfig.others(),
    eslintConfig.jsonc(),
    eslintConfig.jsdoc(),
    eslintConfig.yml(),
    eslintConfig.stylistic(),
    eslintConfig.perfectionist(),
    eslintConfig.react(),
    eslintConfig.testing(),
    eslintConfig.custom(),
    eslintConfig.overrides(),
  ]) as Linter.Config[];

  const eslintRulesByPlugin = [];

  for (const config of configs.flat()) {
    const plugins = Object.entries(config.plugins ?? {});

    for (const [pluginName, plugin] of plugins) {
      const rules = Object.entries(plugin.rules ?? {});

      for (const [ruleName, rule] of rules) {
        const { defaultOptions = [], deprecated = false, docs, fixable = false, schema = [], type } = rule?.meta ?? {};

        const { description, url } = docs ?? {};

        const name = [pluginName, ruleName].filter(Boolean).join('/');

        eslintRulesByPlugin.push({
          defaultOptions,
          deprecated,
          description,
          fixable,
          name,
          pluginName,
          ruleName,
          schema,
          type,
          url,
        });
      }
    }
  }

  const disableCheckers = [
    '// @ts-nocheck',
    '/* eslint-disable */',
    '/* oxlint-disable */',
    '/* cspell: disable */',
    '/* prettier-ignore */',
  ].join('\n');

  let dtsRules = `${disableCheckers}\n\nimport type { Linter } from 'eslint';\n\n`;

  dtsRules += 'export interface RuleOptions {';

  const typeDefinitions = new Map<string, string>();
  const totalRules = eslintRulesByPlugin.length;

  let currentRule = 0;

  for (const rule of eslintRulesByPlugin) {
    currentRule += 1;

    const isLast = currentRule === totalRules;
    const elapsedMs = isLast ? performance.now() - startTime : undefined;

    logProgress(currentRule, totalRules, rule.name, elapsedMs);

    const { deprecated, description, pluginName, ruleName, schema, url } = rule;

    const jsDocHeader = '\n  /**';
    const jsDocFooter = '   */\n';

    const cleanedDescription = description?.replaceAll('*/', '* /').trim();

    const jsDocDescription = description ? `   * ${cleanedDescription}` : '';
    const jsDocDeprecated = deprecated ? '   * @deprecated' : '';
    const jsDocUrl = url ? `   * @see ${url}` : '';

    const ruleJsdoc = [jsDocHeader, jsDocDescription, jsDocDeprecated, jsDocUrl, jsDocFooter].filter(Boolean).join('\n');

    const typeRuleName = kebabToPascalCase(ruleName);
    const typePluginName = kebabToPascalCase(pluginName);

    let typeName: string;

    if (schema === false || (Array.isArray(schema) && schema.length === 0)) {
      typeName = '[]';
    } else {
      try {
        const fullTypeName = `${typePluginName}${typeRuleName}`.replaceAll('/', '');

        const result = jsonSchemaToType(schema as JsonSchema | JsonSchema[], {
          includeDescriptions: true,
          typeName: fullTypeName,
        });

        typeName = fullTypeName;

        const typeContent = result.mainType;

        typeDefinitions.set(typeName, `${typeContent}\n`);

        for (const auxType of result.auxiliaryTypes) {
          const auxTypeName = auxType.match(/^type (\w+)/)?.[1];

          if (auxTypeName && !typeDefinitions.has(auxTypeName)) {
            typeDefinitions.set(auxTypeName, `${auxType}\n`);
          }
        }
      } catch (error) {
        console.error(`Failed to convert schema for ${rule.name}:`, error);
        typeName = 'unknown[]';
      }
    }

    const name = rule.name.includes('/') || rule.name.includes('-') ? `'${rule.name}'` : rule.name;

    dtsRules += `${ruleJsdoc}  ${name}?: Linter.RuleEntry<${typeName}>;`;
  }

  dtsRules += '\n}\n';

  for (const value of typeDefinitions.values()) {
    dtsRules += value;
  }

  const formattedRules = await format('./src/rules.ts', dtsRules, {
    printWidth: 256,
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    useTabs: false,
  });

  writeFileSync('./src/rules.ts', formattedRules.code);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generateEslintTypes();
}
