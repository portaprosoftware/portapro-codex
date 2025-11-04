import { useState } from 'react';
import { Laptop, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface StickyDemoBarProps {
  onScheduleDemo: () => void;
}

export const StickyDemoBar = ({ onScheduleDemo }: StickyDemoBarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-blue text-white shadow-2xl">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/10 transition-all">
          <div className="flex items-center gap-3">
            <Laptop className="w-5 h-5" />
            <span className="font-semibold">📅 Request a Demo</span>
          </div>
          {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-6 pb-6">
          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="text-white/90 text-center">
              See PortaPro in action with a personalized demo tailored to your business.
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                variant="outline" 
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                onClick={onScheduleDemo}
              >
                <Laptop className="w-4 h-4 mr-2" />
                Schedule Demo
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
