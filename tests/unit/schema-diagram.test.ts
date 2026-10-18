import { expect, it } from 'vitest';
import { schemaDiagram } from '../../scripts/schema-diagram.mjs';
const snapshot = () => ({ captured_at: '2026-10-16T00:00:00Z', tables: [{ name: 'orders' }, { name: 'standalone' }], migrations: [{}], constraints: [{ schema_name: 'public', table_name: 'orders', name: 'orders_customer_fk', kind: 'f', validated: true, parent_schema: 'auth', parent_table: 'users', columns: ['tenant_id', 'customer_id'], parent_columns: ['tenant_id', 'id'], definition: 'FOREIGN KEY (tenant_id, customer_id) REFERENCES auth.users(tenant_id, id) ON DELETE RESTRICT' }] });
it('preserves external references, composite column order and isolated tables without inventing cardinality', () => {
  const output = schemaDiagram(snapshot());
  expect(output).toContain('public_standalone["public.standalone"]');
  expect(output).toContain('auth_users["auth.users"]');
  expect(output).toContain('public_orders -->|"tenant_id, customer_id → tenant_id, id"| auth_users');
  expect(output).toContain('ON DELETE RESTRICT'); expect(output).toContain('2 public tables, 1 foreign keys, 1 applied migrations');
});
it('rejects unknown source tables and unsafe identifiers before writing generated Markdown', () => {
  const data = snapshot(); data.constraints[0].table_name = 'missing'; expect(() => schemaDiagram(data)).toThrow('source');
  data.constraints[0].table_name = 'orders'; data.constraints[0].parent_table = 'users[unsafe]'; expect(() => schemaDiagram(data)).toThrow('identifier');
});
