import React from 'react';
import { IconProcessor } from '@/components/IconProcessor';

const IconProcessorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Icon Background Removal Tool</h1>
          <p className="text-muted-foreground">
            Process your PortaPro favicon and PWA icons to create transparent versions
          </p>
        </div>
        <IconProcessor />
      </div>
    </div>
  );
};

export default IconProcessorPage;