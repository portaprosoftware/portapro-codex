import React from "react";
import { FileText, Settings, Wrench, AlertTriangle, Droplet, BarChart3, Lightbulb } from "lucide-react";
import { RoleBadge, RoleType } from "./RoleBadge";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  roles: RoleType[];
  tips?: string[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, roles, tips }) => {
  return (
    <div className="group relative p-4 rounded-lg border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg bg-gradient-to-br from-blue-500 to-blue-600" />
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-blue-600">
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
          {tips && tips.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-gray-600">
                  <Lightbulb className="h-3 w-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ComplianceGuideContent: React.FC = () => {
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
            tips={[
              "Document types can be customized to match your specific requirements"
            ]}
          />
          <FeatureCard
            icon={<FileText className="w-5 h-5" />}
            title="Documents"
            description="Track permits, registrations, and compliance paperwork"
            roles={['admin', 'dispatcher']}
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
            tips={[
              "Dispatch can track spill kit checks without waiting for DVIRs",
              "Use the Track Expiration tab to see all spill kit due dates"
            ]}
          />
          <FeatureCard
            icon={<AlertTriangle className="w-5 h-5" />}
            title="Incidents"
            description="Log spills or exposures in the field or office"
            roles={['driver', 'dispatcher']}
            tips={[
              "Drivers can log incidents on mobile in real time"
            ]}
          />
          <FeatureCard
            icon={<Droplet className="w-5 h-5" />}
            title="Decon Logs"
            description="Record vehicle/site decontamination after incidents"
            roles={['dispatcher', 'admin', 'safety']}
            tips={[
              "Log decon records immediately after cleaning to maintain compliance"
            ]}
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
            tips={[
              "Admins can auto-generate compliance reports anytime"
            ]}
          />
        </div>
      </div>
    </div>
  );
};
