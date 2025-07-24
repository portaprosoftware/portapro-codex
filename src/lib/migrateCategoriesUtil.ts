// Utility to migrate existing consumables from old categories to new consolidated categories

import { supabase } from '@/integrations/supabase/client';
import { LEGACY_CATEGORY_MAPPING } from './consumableCategories';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  details: Array<{
    id: string;
    name: string;
    oldCategory: string;
    newCategory: string;
  }>;
}

export const migrateConsumableCategories = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: [],
    details: []
  };

  try {
    // First, get all consumables
    const { data: consumables, error: fetchError } = await supabase
      .from('consumables')
      .select('id, name, category');

    if (fetchError) {
      result.success = false;
      result.errors.push(`Failed to fetch consumables: ${fetchError.message}`);
      return result;
    }

    if (!consumables || consumables.length === 0) {
      return result; // No consumables to migrate
    }

    // Process each consumable that needs migration
    for (const consumable of consumables) {
      const oldCategory = consumable.category;
      const newCategory = LEGACY_CATEGORY_MAPPING[oldCategory];

      // Only migrate if there's a mapping and it's different
      if (newCategory && newCategory !== oldCategory) {
        try {
          const { error: updateError } = await supabase
            .from('consumables')
            .update({ category: newCategory })
            .eq('id', consumable.id);

          if (updateError) {
            result.errors.push(`Failed to update ${consumable.name}: ${updateError.message}`);
            result.success = false;
          } else {
            result.migratedCount++;
            result.details.push({
              id: consumable.id,
              name: consumable.name,
              oldCategory,
              newCategory
            });
          }
        } catch (error) {
          result.errors.push(`Error updating ${consumable.name}: ${error}`);
          result.success = false;
        }
      }
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
  }

  return result;
};

// Helper function to check if migration is needed
export const checkMigrationNeeded = async (): Promise<{ needed: boolean; count: number; categories: string[] }> => {
  try {
    const { data: consumables, error } = await supabase
      .from('consumables')
      .select('category');

    if (error) {
      console.error('Error checking migration status:', error);
      return { needed: false, count: 0, categories: [] };
    }

    if (!consumables) {
      return { needed: false, count: 0, categories: [] };
    }

    // Get unique categories that need migration
    const categoriesToMigrate = [...new Set(
      consumables
        .map(c => c.category)
        .filter(category => LEGACY_CATEGORY_MAPPING[category] && LEGACY_CATEGORY_MAPPING[category] !== category)
    )];

    return {
      needed: categoriesToMigrate.length > 0,
      count: consumables.filter(c => LEGACY_CATEGORY_MAPPING[c.category] && LEGACY_CATEGORY_MAPPING[c.category] !== c.category).length,
      categories: categoriesToMigrate
    };

  } catch (error) {
    console.error('Error checking migration status:', error);
    return { needed: false, count: 0, categories: [] };
  }
};