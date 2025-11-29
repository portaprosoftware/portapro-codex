import { describe, it, expect, vi, beforeEach } from 'vitest';
import { safeInsert, safeUpdate, safeDelete } from './supabase-helpers.js';
import { supabase } from '@/integrations/supabase/client.js';

describe('safeInsert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when orgId is null', async () => {
    await expect(
      safeInsert('test_table', { name: 'test' }, null)
    ).rejects.toThrow('Organization ID required');
  });

  it('should throw error when orgId is undefined', async () => {
    await expect(
      safeInsert('test_table', { name: 'test' }, undefined)
    ).rejects.toThrow('Organization ID required');
  });

  it('should add organization_id to single record', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    await safeInsert('test_table', { name: 'test' }, 'org-123');

    expect(mockInsert).toHaveBeenCalledWith({
      name: 'test',
      organization_id: 'org-123',
    });
  });

  it('should add organization_id to array of records', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    const records = [
      { name: 'test1' },
      { name: 'test2' },
    ];

    await safeInsert('test_table', records, 'org-123');

    expect(mockInsert).toHaveBeenCalledWith([
      { name: 'test1', organization_id: 'org-123' },
      { name: 'test2', organization_id: 'org-123' },
    ]);
  });

  it('should not override existing organization_id', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as any);

    await safeInsert('test_table', { name: 'test', organization_id: 'existing-org' }, 'org-123');

    expect(mockInsert).toHaveBeenCalledWith({
      name: 'test',
      organization_id: 'org-123', // Should use the provided orgId
    });
  });
});

describe('safeUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when orgId is null', async () => {
    await expect(
      safeUpdate('test_table', { name: 'updated' }, null, { id: '123' })
    ).rejects.toThrow('Organization ID required');
  });

  it('should filter by organization_id', async () => {
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockOrgEq = vi.fn().mockReturnValue({ eq: mockEq, update: mockUpdate });
    
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
      eq: mockOrgEq,
    } as any);

    await safeUpdate('test_table', { name: 'updated' }, 'org-123', { id: 'item-123' });

    expect(mockOrgEq).toHaveBeenCalledWith('organization_id', 'org-123');
  });

  it('should apply additional match conditions', async () => {
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockOrgEq = vi.fn().mockReturnValue({ eq: mockEq, update: mockUpdate });
    
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
      eq: mockOrgEq,
    } as any);

    await safeUpdate(
      'test_table',
      { name: 'updated' },
      'org-123',
      { id: 'item-123', status: 'active' }
    );

    expect(mockOrgEq).toHaveBeenCalledWith('organization_id', 'org-123');
    expect(mockEq).toHaveBeenCalledWith('id', 'item-123');
    expect(mockEq).toHaveBeenCalledWith('status', 'active');
  });
});

describe('safeDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error when orgId is null', async () => {
    await expect(
      safeDelete('test_table', null, { id: '123' })
    ).rejects.toThrow('Organization ID required');
  });

  it('should filter by organization_id', async () => {
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    const mockOrgEq = vi.fn().mockReturnValue({ eq: mockEq, delete: mockDelete });
    
    vi.mocked(supabase.from).mockReturnValue({
      delete: mockDelete,
      eq: mockOrgEq,
    } as any);

    await safeDelete('test_table', 'org-123', { id: 'item-123' });

    expect(mockOrgEq).toHaveBeenCalledWith('organization_id', 'org-123');
    expect(mockEq).toHaveBeenCalledWith('id', 'item-123');
  });
});
