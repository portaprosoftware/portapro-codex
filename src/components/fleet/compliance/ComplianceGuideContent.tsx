import React, { useState, useEffect } from "react";
import { FileText, Settings, Wrench, AlertTriangle, Droplet, BarChart3 } from "lucide-react";
import { RoleBadge, RoleType } from "./RoleBadge";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  roles: RoleType[];
  iconGradient: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, roles, iconGradient }) => {
  return (
    <div className="group relative p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white">
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${iconGradient}`} />
      <div className="flex gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${iconGradient} flex items-center justify-center text-white shadow-sm`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
          <p className="text-xs text-gray-600 mb-2 leading-relaxed">{description}</p>
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <RoleBadge key={role} role={role} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const tips = [
  "Drivers can log incidents on mobile in real time",
  "Dispatch can track spill kit checks without waiting for DVIRs",
  "Admins can auto-generate compliance reports anytime",
  "Use the Track Expiration tab to see all spill kit due dates",
  "Log decon records immediately after cleaning to maintain compliance",
  "Document types can be customized to match your specific requirements"
];

export const ComplianceGuideContent: React.FC = () => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Setup Phase */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-blue-600">⚙️</span> Setup Phase
        </h3>
        <div className="space-y-3">
          <FeatureCard
            icon={<Settings className="w-5 h-5" />}
            title="Document Types"
            description="Manage which compliance documents are tracked"
            roles={['admin']}
            iconGradient="bg-gradient-to-br from-green-500 to-green-600"
          />
          <FeatureCard
            icon={<FileText className="w-5 h-5" />}
            title="Documents"
            description="Track permits, registrations, and compliance paperwork"
            roles={['admin', 'dispatcher']}
            iconGradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
        </div>
      </div>

      {/* Daily Operations */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-orange-600">🔄</span> Daily Operations
        </h3>
        <div className="space-y-3">
          <FeatureCard
            icon={<Wrench className="w-5 h-5" />}
            title="Spill Kits"
            description="Drivers verify kits during DVIR; dispatch can log checks anytime"
            roles={['driver', 'dispatcher']}
            iconGradient="bg-gradient-to-br from-orange-500 to-orange-600"
          />
          <FeatureCard
            icon={<AlertTriangle className="w-5 h-5" />}
            title="Incidents"
            description="Log spills or exposures in the field or office"
            roles={['driver', 'dispatcher']}
            iconGradient="bg-gradient-to-br from-red-500 to-red-600"
          />
          <FeatureCard
            icon={<Droplet className="w-5 h-5" />}
            title="Decon Logs"
            description="Record vehicle/site decontamination after incidents"
            roles={['dispatcher', 'admin', 'safety']}
            iconGradient="bg-gradient-to-br from-cyan-500 to-cyan-600"
          />
        </div>
      </div>

      {/* Reporting & Analysis */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-green-600">📊</span> Reporting & Analysis
        </h3>
        <div className="space-y-3">
          <FeatureCard
            icon={<BarChart3 className="w-5 h-5" />}
            title="Reports"
            description="Generate compliance summaries when needed"
            roles={['admin']}
            iconGradient="bg-gradient-to-br from-purple-500 to-purple-600"
          />
        </div>
      </div>

      {/* Quick Tips Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">💡</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900 mb-1">Quick Tip</h4>
              <p className="text-sm text-gray-700 transition-opacity duration-300">
                {tips[currentTipIndex]}
              </p>
            </div>
          </div>
          <div className="flex justify-center gap-1.5 mt-3">
            {tips.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTipIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === currentTipIndex 
                    ? 'bg-blue-600 w-4' 
                    : 'bg-blue-300 hover:bg-blue-400'
                }`}
                aria-label={`Go to tip ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
