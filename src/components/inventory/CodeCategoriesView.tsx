import React from 'react';
import { ItemCodeCategoryPopup } from './ItemCodeCategoryPopup';

export const CodeCategoriesView: React.FC = () => {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Code Categories Management</h2>
          <p className="text-muted-foreground mt-2">
            Manage your item code categories and prefixes for better inventory organization.
          </p>
        </div>
        <ItemCodeCategoryPopup />
      </div>
    </div>
  );
};