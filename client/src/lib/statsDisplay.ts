export function buildEntriesLabel(totalCount?: number) {
  if (typeof totalCount !== 'number') return null;
  return `Entries: ${totalCount}`;
}

export function buildResultsSummary({
  currentCount,
  totalCount,
  institutionCount,
}: {
  currentCount: number;
  totalCount?: number;
  institutionCount?: number;
}) {
  const parts = [`当前页 ${currentCount} 条`];

  if (typeof totalCount === 'number') {
    parts.push(`共 ${totalCount} 个条目`);
  }

  if (typeof institutionCount === 'number') {
    parts.push(`${institutionCount} 所高校`);
  }

  return parts
    .map((part, index) => (index === 2 ? `· ${part}` : part))
    .join('，')
    .replace('，· ', ' · ');
}
