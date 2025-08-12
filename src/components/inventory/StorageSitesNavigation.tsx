import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building, BarChart3, Plus } from "lucide-react";
import { TabNav } from "@/components/ui/TabNav";
import { Button } from "@/components/ui/button";

interface StorageSitesNavigationProps {
  onAddStorage: () => void;
}

export const StorageSitesNavigation: React.FC<StorageSitesNavigationProps> = ({ onAddStorage }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      title: "Storage Locations",
      value: "locations",
      icon: Building
    },
    {
      title: "Location Reporting", 
      value: "reporting",
      icon: BarChart3
    }
  ];

  const activeTab = location.hash === "#reporting" ? "reporting" : "locations";

  const handleNavigation = (value: string) => {
    navigate(`/storage-sites${value === "reporting" ? "#reporting" : ""}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mt-6 mb-6">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">
              Storage Sites
            </h1>
            <p className="text-gray-600 mt-1">
              Manage storage locations and view location analytics
            </p>
          </div>
          <Button onClick={onAddStorage} className="bg-gradient-primary text-white hover:bg-gradient-primary/90 gap-2">
            <Plus className="h-4 w-4" />
            Add Storage Site
          </Button>
        </div>
        
        <TabNav ariaLabel="Storage Sites Navigation">
          {navigationItems.map((item) => (
            <TabNav.Item
              key={item.value}
              to={`/storage-sites${item.value === "reporting" ? "#reporting" : ""}`}
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