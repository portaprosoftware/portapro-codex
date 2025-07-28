import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, PenTool } from 'lucide-react';

interface TemplateOrCustomSelectorProps {
  onSelectTemplate: () => void;
  onCreateCustom: () => void;
}

export const TemplateOrCustomSelector: React.FC<TemplateOrCustomSelectorProps> = ({
  onSelectTemplate,
  onCreateCustom
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4 font-inter">Choose Your Approach</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Use Template Option */}
        <Card 
          className="p-6 cursor-pointer border-2 hover:border-primary/50 transition-colors"
          onClick={onSelectTemplate}
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold font-inter mb-2">Use Template</h3>
              <p className="text-gray-600 font-inter">
                Choose from pre-designed templates to quickly create your campaign
              </p>
            </div>
            <Button variant="outline" className="w-full">
              Browse Templates
            </Button>
          </div>
        </Card>

        {/* Create Your Own Option */}
        <Card 
          className="p-6 cursor-pointer border-2 hover:border-primary/50 transition-colors"
          onClick={onCreateCustom}
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <PenTool className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold font-inter mb-2">Create Your Own</h3>
              <p className="text-gray-600 font-inter">
                Design a custom message with AI assistance and interactive buttons
              </p>
            </div>
            <Button variant="outline" className="w-full">
              Start Creating
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};