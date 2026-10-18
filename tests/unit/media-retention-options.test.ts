import { expect, it } from 'vitest';
import { retentionOptions } from '../../scripts/media-retention-options.mjs';
it('bounds review windows and page sizes and validates continuation', () => {
  expect(retentionOptions([])).toEqual({ hours: 24, limit: 100, cursor: null });
  const id = crypto.randomUUID(); expect(retentionOptions(['--hours', '48', '--limit', '1', '--cursor', id])).toEqual({ hours: 48, limit: 1, cursor: id });
  for (const args of [['--hours', '0'], ['--hours', '1.5'], ['--limit', '501'], ['--cursor', 'bad'], ['--limit'], ['--delete', 'true'], ['--hours', '1', '--hours', '2']]) expect(() => retentionOptions(args)).toThrow();
});
