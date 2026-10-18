export function retentionOptions(args) {
  const values = new Map();
  for (let i = 0; i < args.length; i += 2) {
    if (!['--hours', '--limit', '--cursor'].includes(args[i]) || !args[i + 1] || values.has(args[i])) throw new Error('Use unique --hours, --limit or --cursor options');
    values.set(args[i], args[i + 1]);
  }
  const integer = (value, minimum, maximum) => {
    if (!/^\d+$/.test(value)) throw new Error('Expected a bounded integer');
    const number = Number(value); if (!Number.isSafeInteger(number) || number < minimum || number > maximum) throw new Error('Option is outside its safe bound'); return number;
  };
  const hours = integer(values.get('--hours') ?? '24', 1, 87600), limit = integer(values.get('--limit') ?? '100', 1, 500), cursor = values.get('--cursor') ?? null;
  if (cursor && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursor)) throw new Error('Invalid review cursor');
  return { hours, limit, cursor };
}
