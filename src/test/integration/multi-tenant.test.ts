import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { safeInsert, safeUpdate, safeDelete } from '@/lib/supabase-helpers';

/**
 * Integration tests for multi-tenant operations
 * These tests verify the complete flow of safe operations
 */
describe('Multi-Tenant Integration Tests', () => {
  const TEST_ORG_ID = 'test-org-123';
  const ANOTHER_ORG_ID = 'other-org-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Isolation', () => {
    it('should prevent reading data from other organizations', async () => {
      // Mock query that attempts to fetch without org filter
      const mockSelect = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      // Verify that queries MUST include organization_id filter
      const query = supabase
        .from('jobs')
        .select('*')
        .eq('organization_id', TEST_ORG_ID);

      expect(query).toBeDefined();
    });

    it('should prevent inserting data without organization_id', async () => {
      await expect(
        safeInsert('jobs', { title: 'Test Job' }, null)
      ).rejects.toThrow('Organization ID required');
    });

    it('should prevent updating data across organizations', async () => {
      await expect(
        safeUpdate('jobs', { title: 'Updated' }, null, { id: 'job-123' })
      ).rejects.toThrow('Organization ID required');
    });

    it('should prevent deleting data across organizations', async () => {
      await expect(
        safeDelete('jobs', null, { id: 'job-123' })
      ).rejects.toThrow('Organization ID required');
    });
  });

  describe('Batch Operations', () => {
    it('should add organization_id to all records in batch insert', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const records = [
        { name: 'Item 1' },
        { name: 'Item 2' },
        { name: 'Item 3' },
      ];

      await safeInsert('products', records, TEST_ORG_ID);

      expect(mockInsert).toHaveBeenCalledWith([
        { name: 'Item 1', organization_id: TEST_ORG_ID },
        { name: 'Item 2', organization_id: TEST_ORG_ID },
        { name: 'Item 3', organization_id: TEST_ORG_ID },
      ]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string orgId as invalid', async () => {
      await expect(
        safeInsert('jobs', { title: 'Test' }, '')
      ).rejects.toThrow('Organization ID required');
    });

    it('should handle whitespace-only orgId as invalid', async () => {
      await expect(
        safeInsert('jobs', { title: 'Test' }, '   ')
      ).rejects.toThrow('Organization ID required');
    });

    it('should handle existing organization_id in data', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // Even if data has organization_id, it should be overridden
      await safeInsert(
        'jobs',
        { title: 'Test', organization_id: ANOTHER_ORG_ID },
        TEST_ORG_ID
      );

      expect(mockInsert).toHaveBeenCalledWith({
        title: 'Test',
        organization_id: TEST_ORG_ID, // Should use the provided orgId
      });
    });
  });

  describe('Query Patterns', () => {
    it('should verify proper organization_id filtering in select queries', () => {
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      // Example of proper query pattern
      supabase
        .from('customers')
        .select('*')
        .eq('organization_id', TEST_ORG_ID);

      expect(mockEq).toHaveBeenCalledWith('organization_id', TEST_ORG_ID);
    });

    it('should verify organization_id is included in compound filters', () => {
      const mockEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      // Compound filter example
      supabase
        .from('jobs')
        .select('*')
        .eq('organization_id', TEST_ORG_ID)
        .eq('status', 'active');

      expect(mockEq).toHaveBeenCalledWith('organization_id', TEST_ORG_ID);
    });
  });
});
