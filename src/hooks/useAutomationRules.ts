import { useQuery } from '@tanstack/react-query';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AutomationRulesDB extends DBSchema {
  'automation-rules': {
    key: string;
    value: {
      template_id: string;
      logic_rules: any;
      fee_catalog: any[];
      cached_at: string;
    };
  };
}

const initDB = async (): Promise<IDBPDatabase<AutomationRulesDB>> => {
  return openDB<AutomationRulesDB>('maintenance-templates-db', 2);
};

export const useAutomationRules = (templateId: string) => {
  return useQuery({
    queryKey: ['automation-rules', templateId],
    queryFn: async () => {
      try {
        const db = await initDB();
        const rules = await db.get('automation-rules', templateId);
        return rules || null;
      } catch (error) {
        console.error('Failed to load automation rules:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
