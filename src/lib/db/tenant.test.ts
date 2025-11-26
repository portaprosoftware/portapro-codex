import { describe, expect, it, vi } from 'vitest';
import { tenantTable } from './tenant';

describe('tenantTable', () => {
  it('applies organization_id filter on select', () => {
    const mockEq = vi.fn();
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    });

    const mockClient = {
      from: mockFrom,
    } as any;

    const table = tenantTable(mockClient, 'org-123', 'test_table');

    table.select('*');

    expect(mockFrom).toHaveBeenCalledWith('test_table');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('organization_id', 'org-123');
  });

  it('adds organization_id on insert', () => {
    const mockInsert = vi.fn();
    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert,
    });

    const mockClient = {
      from: mockFrom,
    } as any;

    const table = tenantTable(mockClient, 'org-123', 'test_table');

    table.insert({ name: 'Test' }, { returning: 'representation' });

    expect(mockInsert).toHaveBeenCalledWith(
      { name: 'Test', organization_id: 'org-123' },
      { returning: 'representation' }
    );
  });
});
