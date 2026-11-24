import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { format } from 'prettier';
import { htmlElementAttributes } from 'html-element-attributes';
import { svgElementAttributes } from 'svg-element-attributes';
import { find, html, svg, type Schema } from 'property-information';
import htmlRulesExport from 'html-validate/elements/html5';
import webData from '@vscode/web-custom-data/data/browsers.html-data.json' with { type: 'json' };
import lockfile from './package-lock.json' with { type: 'json' };
import type { MetaAttribute, MetaDataTable } from 'html-validate';

// step 1 - index the imported metadata and record the sources' locked versions.
// Type the imported metadata as a table keyed by tag name.
type WebAttribute = { name: string; valueSet?: string };

const htmlRules: MetaDataTable = htmlRulesExport;
const webGlobals = new Map<string, WebAttribute>(
  webData.globalAttributes.map((attribute) => [attribute.name, attribute]),
);
const webTags = new Map<string, Map<string, WebAttribute>>(
  webData.tags.map((tag) => [tag.name, new Map(tag.attributes.map((a) => [a.name, a]))]),
);
const valueSets = new Map(
  webData.valueSets.map((set) => [set.name, set.values.map((v) => v.name)]),
);
const sources = [
  'html-element-attributes',
  'svg-element-attributes',
  'property-information',
  'html-validate',
  '@vscode/web-custom-data',
] as const;
const provenance = sources
  .map((name) => `${name}@${lockfile.packages[`node_modules/${name}`].version}`)
  .join(', ');
const output = new URL('./src/jsx-attributes.d.ts', import.meta.url);

// step 2 - read HTML and SVG tag names from TypeScript's DOM declarations.
const domPath = fileURLToPath(import.meta.resolve('typescript/lib/lib.dom.d.ts'));
const dom = ts.createSourceFile(
  domPath,
  await fs.readFile(domPath, 'utf8'),
  ts.ScriptTarget.Latest,
);
function tags(name: string): string[] {
  const declaration = dom.statements.find(
    (node): node is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(node) && node.name.text === name,
  );

  if (!declaration) throw new Error(`Missing TypeScript DOM interface: ${name}`);

  return declaration.members.map((member) => {
    if (!member.name || (!ts.isIdentifier(member.name) && !ts.isStringLiteral(member.name)))
      throw new Error(`Unexpected tag declaration in ${name}`);
    return member.name.text;
  });
}

// step 3 - add missing attributes and identify attributes that need more than a fixed list of values.
// HTML+RDFa 1.1: https://www.w3.org/TR/html-rdfa/#extensions-to-the-html5-syntax
// These global attributes include Open Graph's <meta property="...">.
const rdfa = [
  'about',
  'content',
  'datatype',
  'inlist',
  'prefix',
  'property',
  'rel',
  'resource',
  'rev',
  'typeof',
  'vocab',
];
const aria = Object.values(html.property).filter((info) => info.attribute.startsWith('aria-'));
const shared = [...rdfa, 'role', ...aria.map((info) => info.attribute)];
// Completion suggestions are not necessarily a closed grammar. These sets
// contain open names or space-separated tokens, not single fixed keywords.
const openValueSets = new Set([
  'target',
  'sb',
  'inputautocomplete',
  'dropeffect',
  'relevant',
  'roles',
  'metanames',
]);
// Standards corrections for gaps in the upstream data
const keywordCorrections: Record<string, MetaAttribute> = {
  // https://html.spec.whatwg.org/multipage/interaction.html#the-contenteditable-attribute
  contenteditable: { enum: ['', 'true', 'false', 'plaintext-only'] },
  // https://w3c.github.io/virtual-keyboard/#the-virtualkeyboardpolicy-attribute
  virtualkeyboardpolicy: { enum: ['', 'auto', 'manual'] },
  // https://html.spec.whatwg.org/multipage/popover.html#attr-popovertargetaction
  popovertargetaction: { enum: ['show', 'hide', 'toggle'] },
  // https://www.w3.org/TR/wai-aria-1.2/#aria-hidden
  'aria-hidden': { enum: ['true', 'false', 'undefined'] },
};

// step 4 - select each attribute's rule: corrections, validator, then completion data.
function attributeRule(tag: string, name: string): MetaAttribute | undefined {
  if (keywordCorrections[name]) return keywordCorrections[name];

  const rule = htmlRules[tag]?.attributes?.[name] ?? htmlRules['*'].attributes?.[name];
  if (Array.isArray(rule)) return { enum: rule };

  // Even non-finite validator rules take precedence over completion data.
  if (rule?.enum || rule?.boolean) return rule;

  const completion = webTags.get(tag)?.get(name) ?? webGlobals.get(name);
  const set = completion?.valueSet ?? name;
  if (openValueSets.has(set)) return undefined;

  const values = valueSets.get(set);
  return values && { enum: values };
}

// step 5 - identify attributes that accept both boolean and string values in JSX.
const overloadedBooleanNames = new Set([
  ...Object.values(html.property)
    .filter((info) => info.overloadedBoolean)
    .map((info) => info.attribute),
  'popover',
]);

// step 6 - turn attribute rules into TypeScript property declarations.
function valueType(schema: Schema, name: string, tag: string): string {
  const info = find(schema, name);
  // ARIA uses the same keywords in HTML and SVG.
  // HTML-specific enums must not constrain unrelated SVG attributes such as <animate type="rotate">.
  const rule = schema === html || name.startsWith('aria-') ? attributeRule(tag, name) : undefined;

  if (rule?.boolean) return `boolean | '' | ${JSON.stringify(name)} | null`;

  if (
    rule?.enum?.length &&
    !rule.list &&
    rule.enum.every((value) => typeof value === 'string' && !value.startsWith('/'))
  ) {
    const types = new Set(rule.enum.map((value) => JSON.stringify(value)));

    if (rule.omit || overloadedBooleanNames.has(name)) types.add("''");

    if (
      (rule.enum.includes('true') && rule.enum.includes('false')) ||
      overloadedBooleanNames.has(name)
    )
      types.add('boolean');

    return [...types, 'null'].join(' | ');
  }

  if (['value', 'min', 'max', 'step'].includes(name)) return 'string | number | null';
  if (info.boolean) return `boolean | '' | ${JSON.stringify(name)} | null`;
  if (info.booleanish || info.overloadedBoolean) return 'string | boolean | null';
  if (info.number || schema.space === 'svg') return 'string | number | null';

  return 'string | null';
}

function members(names: readonly string[], schema: Schema, tag = '*'): string {
  return [...new Set(names)]
    .sort()
    .map((name) => `${JSON.stringify(name)}?: ${valueType(schema, name, tag)};`)
    .join('\n');
}

// step 7 - assemble global attributes and the HTML/SVG attribute map for each tag.
const lines = [
  '// Generated by npm run jsx-types:generate. Do not edit directly.',
  `// Sources: ${provenance} (MIT).`,
  '// TypeScript DOM maps supply tag names only, never attribute names or values.',
];

for (const [prefix, map, schema, domMap] of [
  ['Html', htmlElementAttributes, html, 'HTMLElementTagNameMap'],
  ['Svg', svgElementAttributes, svg, 'SVGElementTagNameMap'],
] as const) {
  const globals = [...map['*'], ...shared, 'xmlns'];

  if (prefix === 'Html')
    globals.push(
      ...Object.keys(htmlRules['*'].attributes ?? {}),
      ...webData.globalAttributes.filter((a) => !a.name.startsWith('on')).map((a) => a.name),
    );

  // XML and XLink vocabularies are excluded by svg-element-attributes.
  if (prefix === 'Svg')
    globals.push(
      ...Object.values(svg.property)
        .filter((info) => ['xml', 'xlink', 'xmlns'].includes(info.space ?? ''))
        .map((info) => info.attribute),
    );

  lines.push(
    `interface ${prefix}GlobalAttributes { ${members(globals, schema)}\n [name: \`data-\${string}\`]: string | number | boolean | null | undefined; }`,
  );
  lines.push(`export interface ${prefix}Attributes {`);

  for (const tag of [
    ...new Set([...tags(domMap), ...Object.keys(map).filter((tag) => tag !== '*')]),
  ].sort()) {
    const own = [
      ...new Set([
        ...(map[tag] ?? []),
        ...(prefix === 'Html' ? Object.keys(htmlRules[tag]?.attributes ?? {}) : []),
      ]),
    ].filter(
      (name) =>
        !globals.includes(name) || valueType(schema, name, tag) !== valueType(schema, name, '*'),
    );
    // A tag-specific value rule overrides the corresponding global definition.
    const overrides = own.filter((name) => globals.includes(name));
    const base = overrides.length
      ? `Omit<${prefix}GlobalAttributes, ${overrides.map((n) => JSON.stringify(n)).join(' | ')}>`
      : `${prefix}GlobalAttributes`;

    lines.push(`${JSON.stringify(tag)}: ${base} & { ${members(own, schema, tag)} };`);
  }

  lines.push('}');
}

// step 8 - format the output, then write it or check that the committed file matches.
const result = await format(lines.join('\n'), {
  filepath: output.pathname,
  printWidth: 100,
  singleQuote: true,
});

if (process.argv.includes('--check')) {
  const current = await fs.readFile(output, 'utf8').catch(() => '');
  if (current !== result) {
    console.error('Generated JSX attributes are stale. Run npm run jsx-types:generate.');
    process.exitCode = 1;
  }
} else {
  await fs.writeFile(output, result);
}
