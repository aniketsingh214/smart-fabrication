const identifier = /^[a-z_][a-z0-9_]*$/;
function node(schema, table) {
  if (!identifier.test(schema) || !identifier.test(table)) throw new Error('Unexpected schema identifier');
  return `${schema}_${table}`;
}
export function schemaDiagram({ tables, constraints, migrations, captured_at }) {
  const nodes = new Map(tables.map(table => [node('public', table.name), `public.${table.name}`]));
  const foreignKeys = constraints.filter(constraint => constraint.kind === 'f');
  const edges = foreignKeys.map(constraint => {
    const source = node(constraint.schema_name, constraint.table_name);
    const target = node(constraint.parent_schema, constraint.parent_table);
    if (!nodes.has(source)) throw new Error('Foreign key source is not a captured table');
    nodes.set(target, `${constraint.parent_schema}.${constraint.parent_table}`);
    const label = `${constraint.columns.join(', ')} → ${constraint.parent_columns.join(', ')}`;
    if (!/^[a-z0-9_, →]+$/.test(label)) throw new Error('Unexpected foreign key column');
    return `  ${source} -->|"${label}"| ${target}`;
  });
  const lines = [...nodes].sort(([a], [b]) => a.localeCompare(b)).map(([id, name]) => `  ${id}["${name}"]`);
  const escape = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
  return '# Applied database relationship diagram\n\n'
    + `Generated from PostgreSQL catalog metadata captured at ${captured_at}. ${tables.length} public tables, ${foreignKeys.length} foreign keys, ${migrations.length} applied migrations. No application records are included.\n\n`
    + 'Arrows point from referencing table to referenced table. Labels preserve the ordered child and parent columns, including composite foreign keys. External referenced tables are included explicitly. Cardinality is not inferred from names; exact nullability, uniqueness, checks, referential actions and validation state are recorded in the schema dictionary and constraint table below.\n\n'
    + '```mermaid\nflowchart LR\n' + [...lines, ...edges].join('\n') + '\n```\n\n'
    + '## Applied constraints\n\n| Table | Constraint | Kind | Validated | Definition |\n| --- | --- | --- | --- | --- |\n'
    + constraints.map(c => `| ${escape(c.schema_name)}.${escape(c.table_name)} | ${escape(c.name)} | ${escape(c.kind)} | ${c.validated} | ${escape(c.definition)} |`).join('\n')
    + '\n\nKinds: p = primary key, u = unique, f = foreign key, c = check, x = exclusion. These are physical constraints, not a claim that every source-plan entity or business acceptance gate is complete. See [schema dictionary](schema-dictionary.md), [migration ledger](migrations-log.md) and [phase 02](../phases/phase-02.md). Regenerate with `npm.cmd run db:document`.\n';
}
