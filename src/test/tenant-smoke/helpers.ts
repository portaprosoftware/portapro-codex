import { expect } from 'vitest';

export function expectNoCrossTenantLeak<T extends { organization_id?: string | null } | null | undefined>(
  result: T | T[] | null | undefined,
  orgId: string
) {
  if (!result) {
    expect(result).toBeFalsy();
    return;
  }

  const rows = Array.isArray(result) ? result : [result];

  if (rows.length === 0) {
    expect(rows.length).toBe(0);
    return;
  }

  const mismatches = rows.filter(
    (row) => row && 'organization_id' in row && row.organization_id && row.organization_id !== orgId
  );

  expect(mismatches, 'Expected all rows to be scoped to the requesting organization').toHaveLength(0);
}

export function expectForbidden(result: { data?: unknown; error?: unknown } | null | undefined) {
  if (!result) {
    expect(result).toBeFalsy();
    return;
  }

  const hasError = Boolean((result as any).error);
  const data = (result as any).data;
  const isEmptyData = Array.isArray(data) ? data.length === 0 : data === null || data === undefined;

  expect(hasError || isEmptyData).toBe(true);
}
