import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Lightbulb, X } from 'lucide-react';
import { FilterData } from '@/hooks/useFilterPresets';

interface FilterRecommendation {
  id: string;
  title: string;
  description: string;
  filters: FilterData;
  type: 'frequent' | 'trending' | 'suggested';
  confidence: number;
}

interface FilterRecommendationsProps {
  onApplyFilter: (filters: FilterData) => void;
  currentFilters: FilterData;
}

export const FilterRecommendations: React.FC<FilterRecommendationsProps> = ({
  onApplyFilter,
  currentFilters
}) => {
  const [recommendations, setRecommendations] = useState<FilterRecommendation[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateRecommendations();
  }, [currentFilters]);

  const generateRecommendations = () => {
    // Generate smart recommendations based on common patterns
    const recs: FilterRecommendation[] = [];

    // Today's jobs
    if (!currentFilters.dateRange) {
      recs.push({
        id: 'today-jobs',
        title: "Today's Jobs",
        description: 'View all jobs scheduled for today',
        filters: {
          dateRange: {
            from: new Date(),
            to: new Date()
          }
        },
        type: 'suggested',
        confidence: 0.9
      });
    }

    // Overdue jobs if no status filter
    if (!currentFilters.selectedStatus || currentFilters.selectedStatus === 'all') {
      recs.push({
        id: 'overdue-jobs',
        title: 'Overdue Jobs',
        description: 'Jobs that are past their scheduled date',
        filters: {
          selectedStatus: 'overdue'
        },
        type: 'trending',
        confidence: 0.8
      });
    }

    // Unassigned jobs
    if (!currentFilters.selectedDriver || currentFilters.selectedDriver === 'all') {
      recs.push({
        id: 'unassigned-jobs',
        title: 'Unassigned Jobs',
        description: 'Jobs that need driver assignment',
        filters: {
          selectedStatus: 'unassigned'
        },
        type: 'frequent',
        confidence: 0.7
      });
    }

    // This week's deliveries
    if (!currentFilters.selectedJobType || currentFilters.selectedJobType === 'all') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      recs.push({
        id: 'week-deliveries',
        title: 'This Week\'s Deliveries',
        description: 'All delivery jobs for this week',
        filters: {
          selectedJobType: 'delivery',
          dateRange: {
            from: startOfWeek,
            to: endOfWeek
          }
        },
        type: 'frequent',
        confidence: 0.6
      });
    }

    setRecommendations(recs.slice(0, 3)); // Show top 3
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'frequent':
        return <Clock className="h-4 w-4" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getRecommendationLabel = (type: string) => {
    switch (type) {
      case 'frequent':
        return 'Frequent';
      case 'trending':
        return 'Trending';
      default:
        return 'Suggested';
    }
  };

  const handleApplyRecommendation = (rec: FilterRecommendation) => {
    onApplyFilter(rec.filters);
  };

  const handleDismissRecommendation = (recId: string) => {
    setDismissedIds(prev => new Set([...prev, recId]));
  };

  const visibleRecommendations = recommendations.filter(rec => !dismissedIds.has(rec.id));

  if (visibleRecommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Recommended Filters
        </CardTitle>
        <CardDescription className="text-xs">
          Quick filters based on common usage patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleRecommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center gap-2 flex-1">
              <Badge variant="outline" className="text-xs h-5">
                <span className="flex items-center gap-1">
                  {getRecommendationIcon(rec.type)}
                  {getRecommendationLabel(rec.type)}
                </span>
              </Badge>
              
              <div className="flex-1">
                <div className="text-xs font-medium">{rec.title}</div>
                <div className="text-xs text-muted-foreground">{rec.description}</div>
              </div>
              
              {rec.confidence > 0.7 && (
                <Badge variant="secondary" className="text-xs h-4">
                  Popular
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => handleApplyRecommendation(rec)}
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-muted-foreground"
                onClick={() => handleDismissRecommendation(rec.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};