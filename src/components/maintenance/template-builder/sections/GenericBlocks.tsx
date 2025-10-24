import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  FileText, 
  Calendar, 
  Hash, 
  ChevronDown, 
  CheckSquare, 
  Camera, 
  PenTool, 
  Upload,
  Package
} from 'lucide-react';
import { SectionBlockType } from '../types';

interface GenericBlock {
  type: SectionBlockType;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'generic';
}

export const genericBlocks: GenericBlock[] = [
  {
    type: 'text_input',
    title: 'Text Input',
    description: 'Single-line text field',
    icon: <Type className="w-5 h-5" />,
    category: 'generic',
  },
  {
    type: 'text_area',
    title: 'Text Area',
    description: 'Multi-line text field for notes',
    icon: <FileText className="w-5 h-5" />,
    category: 'generic',
  },
  {
    type: 'date_time',
    title: 'Date / Time',
    description: 'Date and time picker',
    icon: <Calendar className="w-5 h-5" />,
    category: 'generic',
  },
  {
    type: 'number',
    title: 'Number',
    description: 'Numeric input field',
    icon: <Hash className="w-5 h-5" />,
    category: 'generic',
  },
  {
    type: 'dropdown',
    title: 'Dropdown',
    description: 'Single-select dropdown menu',
    icon: <ChevronDown className="w-5 h-5" />,
    category: 'generic',
  },
  {
    type: 'multi_select',
    title: 'Multi-Select',
    description: 'Multiple choice selection',
    icon: <CheckSquare className="w-5 h-5" />,
    category: 'generic',
  },
  {
    type: 'checklist',
    title: 'Checklist',
    description: 'List of checkboxes',
    icon: <CheckSquare className="w-5 h-5" />,
    category: 'generic',
  },
  {
    type: 'photo',
    title: 'Photo',
    description: 'Camera capture or upload',
    icon: <Camera className="w-5 h-5" />,
    category: 'generic',
  },
  {
    type: 'signature',
    title: 'Signature',
    description: 'Digital signature pad',
    icon: <PenTool className="w-5 h-5" />,
    category: 'generic',
  },
  {
    type: 'file_upload',
    title: 'File Upload',
    description: 'Attach documents or files',
    icon: <Upload className="w-5 h-5" />,
    category: 'generic',
  },
  {
    type: 'parts_used',
    title: 'Parts / Items Used',
    description: 'Track parts and quantities',
    icon: <Package className="w-5 h-5" />,
    category: 'generic',
  },
];

interface GenericBlockCardProps {
  block: GenericBlock;
  onAdd: (blockType: SectionBlockType, selectedFeatures?: string[]) => void;
}

export const GenericBlockCard: React.FC<GenericBlockCardProps> = ({ block, onAdd }) => {
  const [isSelected, setIsSelected] = useState(false);

  const handleCardClick = () => {
    setIsSelected(!isSelected);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(block.type, []); // Generic blocks have no features
    setIsSelected(false);
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-all group border ${
        isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
            {block.icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-sm">{block.title}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {block.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <button
          onClick={handleAddClick}
          className={`text-sm font-medium transition-all ${
            isSelected 
              ? 'text-primary underline' 
              : 'text-muted-foreground group-hover:text-primary group-hover:underline'
          }`}
        >
          Click to add →
        </button>
      </CardContent>
    </Card>
  );
};
