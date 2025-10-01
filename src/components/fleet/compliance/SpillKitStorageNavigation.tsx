import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building, BarChart3, Plus } from "lucide-react";
import { TabNav } from "@/components/ui/TabNav";
import { Button } from "@/components/ui/button";

interface SpillKitStorageNavigationProps {
  onAddStorage: () => void;
}

export const SpillKitStorageNavigation: React.FC<SpillKitStorageNavigationProps> = ({ onAddStorage }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      title: "Storage Locations",
      value: "locations",
      icon: Building
    },
    {
      title: "Stock by Location", 
      value: "stock",
      icon: BarChart3
    }
  ];

  const activeTab = location.hash === "#stock" ? "stock" : "locations";

  const handleNavigation = (value: string) => {
    navigate(`/fleet/spill-kit-storage${value === "stock" ? "#stock" : ""}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">
              Spill Kit Storage Locations
            </h1>
            <p className="text-gray-600 mt-1">
              Manage storage locations and track spill kit inventory across facilities
            </p>
          </div>
          <Button onClick={onAddStorage} className="bg-gradient-to-r from-blue-700 to-blue-800 text-white hover:from-blue-800 hover:to-blue-900 gap-2">
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        </div>
        
        <TabNav ariaLabel="Spill Kit Storage Navigation">
          {navigationItems.map((item) => (
            <TabNav.Item
              key={item.value}
              to={`/fleet/spill-kit-storage${item.value === "stock" ? "#stock" : ""}`}
              isActive={activeTab === item.value}
              onClick={() => handleNavigation(item.value)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </TabNav.Item>
          ))}
        </TabNav>
      </div>
    </div>
  );
};
