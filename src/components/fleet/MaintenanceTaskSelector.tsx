import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Search } from "lucide-react";

interface MaintenanceTaskSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskSelect: (taskId: string, taskName: string) => void;
  selectedTaskId?: string;
}

const maintenanceCategories = [
  {
    id: "routine",
    name: "Routine Maintenance & Wear Items",
    icon: "🔧",
    color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
    tasks: [
      { id: "oil-change", name: "Oil Change" },
      { id: "tire-rotation", name: "Tire Rotation" },
      { id: "brake-inspection", name: "Brake Inspection" },
      { id: "suspension-service", name: "Suspension / Shock Service" },
      { id: "steering-check", name: "Steering System Check" },
      { id: "wiper-replacement", name: "Wiper Blade Replacement" },
      { id: "lighting-replacement", name: "Lighting / Bulb Replacement" },
      { id: "fluid-topoffs", name: "Fluid Top-offs (windshield, power steering, etc.)" },
    ]
  },
  {
    id: "engine",
    name: "Engine & Powertrain Services",
    icon: "🛠️",
    color: "bg-gradient-to-r from-green-500 to-green-600 text-white",
    tasks: [
      { id: "transmission-service", name: "Transmission Service" },
      { id: "air-filter", name: "Air Filter Replacement" },
      { id: "coolant-flush", name: "Coolant Flush" },
      { id: "battery-check", name: "Battery Check / Replacement" },
      { id: "spark-plug", name: "Spark Plug Replacement" },
      { id: "timing-belt", name: "Timing Belt / Chain Service" },
      { id: "fuel-filter", name: "Fuel Filter Replacement" },
      { id: "dpf-cleaning", name: "Diesel Particulate Filter (DPF) Cleaning / Regen" },
      { id: "exhaust-inspection", name: "Exhaust System Inspection" },
    ]
  },
  {
    id: "electrical",
    name: "Electrical & Systems",
    icon: "⚡",
    color: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
    tasks: [
      { id: "alternator-check", name: "Alternator Check" },
      { id: "starter-service", name: "Starter Motor Service" },
      { id: "diagnostic-scan", name: "Diagnostic Scan (OBD-II / Engine Codes)" },
    ]
  },
  {
    id: "compliance",
    name: "Compliance & Safety",
    icon: "🧾",
    color: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
    tasks: [
      { id: "dot-inspection", name: "DOT Inspection" },
      { id: "safety-inspection", name: "Annual / Quarterly Safety Inspection" },
      { id: "emissions-test", name: "Emissions Test / Smog Check" },
      { id: "safety-equipment", name: "Safety Equipment Check (first aid kit, fire extinguisher, warning triangles)" },
      { id: "license-renewal", name: "License / Registration Renewal Reminder" },
      { id: "recall-service", name: "Recall Service (OEM compliance)" },
    ]
  },
  {
    id: "cleaning",
    name: "Cleaning & Upkeep",
    icon: "🚿",
    color: "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white",
    tasks: [
      { id: "deep-cleaning", name: "Interior / Exterior Deep Cleaning" },
      { id: "detailing", name: "Detailing / Sanitization" },
    ]
  },
  {
    id: "custom",
    name: "Custom & Miscellaneous",
    icon: "🔩",
    color: "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
    tasks: [
      { id: "accident-repair", name: "Accident / Damage Repair" },
      { id: "body-work", name: "Body Work / Paint" },
      { id: "glass-replacement", name: "Glass / Windshield Replacement" },
      { id: "custom-task", name: "Custom Task (user-defined)" },
    ]
  }
];

export const MaintenanceTaskSelector: React.FC<MaintenanceTaskSelectorProps> = ({
  open,
  onOpenChange,
  onTaskSelect,
  selectedTaskId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<{ id: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleTaskSelect = (task: { id: string; name: string }) => {
    setSelectedTask(task);
  };

  const handleConfirm = () => {
    if (selectedTask) {
      onTaskSelect(selectedTask.id, selectedTask.name);
      onOpenChange(false);
      setSelectedCategory(null);
      setSelectedTask(null);
      setSearchTerm("");
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setSelectedTask(null);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedCategory(null);
    setSelectedTask(null);
    setSearchTerm("");
  };

  // Get all tasks from all categories for search
  const allTasks = maintenanceCategories.flatMap(category => 
    category.tasks.map(task => ({
      ...task,
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color
    }))
  );

  // Filter tasks based on search term
  const filteredTasks = searchTerm.trim() 
    ? allTasks.filter(task => 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const currentCategory = selectedCategory ? maintenanceCategories.find(cat => cat.id === selectedCategory) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedCategory && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="mr-2 p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {selectedCategory ? (
              <>
                <span className="text-2xl">{currentCategory?.icon}</span>
                Select Task from {currentCategory?.name}
              </>
            ) : (
              <>
                🔧 Select Maintenance Category
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search maintenance tasks across all categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Show search results if user is searching */}
          {searchTerm.trim() && filteredTasks.length > 0 && (
            <div className="space-y-3 overflow-y-auto pr-2 max-h-96">
              <div className="text-sm text-muted-foreground mb-3">
                Found {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </div>
              {filteredTasks.map((task) => (
                <Card
                  key={`${task.categoryId}-${task.id}`}
                  className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
                    selectedTask?.id === task.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleTaskSelect(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                          <span className="text-lg">{task.categoryIcon}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{task.name}</span>
                          <div className="text-xs text-muted-foreground mt-1">
                            from {task.categoryName}
                          </div>
                        </div>
                      </div>
                      {selectedTask?.id === task.id && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Show "no results" if searching but no matches */}
          {searchTerm.trim() && filteredTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No tasks found matching "{searchTerm}"</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm("")}
                className="mt-2"
              >
                Clear Search
              </Button>
            </div>
          )}

          {/* Category Selection View (only show if not searching) */}
          {!searchTerm.trim() && !selectedCategory && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 max-h-96">
              {maintenanceCategories.map((category) => (
                <Card
                  key={category.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:bg-gray-50"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {category.name}
                    </h3>
                    <Badge className={category.color}>
                      {category.tasks.length} tasks
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Task Selection View (only show if category selected and not searching) */}
          {!searchTerm.trim() && selectedCategory && (
            <div className="space-y-3 overflow-y-auto pr-2 max-h-96">
              {currentCategory?.tasks.map((task) => (
                <Card
                  key={task.id}
                  className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
                    selectedTask?.id === task.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleTaskSelect(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center">
                          <span className="text-lg">{currentCategory.icon}</span>
                        </div>
                        <span className="font-medium text-gray-900">{task.name}</span>
                      </div>
                      {selectedTask?.id === task.id && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-2 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {searchTerm.trim() ? (
              <>
                {filteredTasks.length} result{filteredTasks.length !== 1 ? 's' : ''} found
              </>
            ) : selectedCategory ? (
              <>
                {currentCategory?.tasks.length} tasks in {currentCategory?.name}
              </>
            ) : (
              <>
                {maintenanceCategories.length} categories available
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {selectedTask && (
              <Button onClick={handleConfirm} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                Select Task
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};