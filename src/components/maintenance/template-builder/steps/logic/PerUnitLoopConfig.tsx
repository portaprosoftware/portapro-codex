import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { UnitLoopConfig } from '../../types';

interface PerUnitLoopConfigProps {
  config: UnitLoopConfig;
  onChange: (config: UnitLoopConfig) => void;
}

export const PerUnitLoopConfig: React.FC<PerUnitLoopConfigProps> = ({
  config,
  onChange,
}) => {
  return (
    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="scan-first">Scan-First Mode</Label>
            <p className="text-sm text-muted-foreground">
              Require QR/NFC scan before starting each unit
            </p>
          </div>
          <Switch
            id="scan-first"
            checked={config.scan_first_mode}
            onCheckedChange={(checked) =>
              onChange({ ...config, scan_first_mode: checked })
            }
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="limit-list">Limit to Job's Unit List</Label>
            <p className="text-sm text-muted-foreground">
              Block ad-hoc unit additions not on the job
            </p>
          </div>
          <Switch
            id="limit-list"
            checked={config.limit_to_job_list}
            onCheckedChange={(checked) =>
              onChange({ ...config, limit_to_job_list: checked })
            }
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allow-duplicate">Allow Duplicate Scans</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, scanning a serviced unit jumps to it
            </p>
          </div>
          <Switch
            id="allow-duplicate"
            checked={config.allow_duplicate_scans}
            onCheckedChange={(checked) =>
              onChange({ ...config, allow_duplicate_scans: checked })
            }
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-base">Auto-Capture Settings</Label>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="timestamp">Timestamp In/Out</Label>
              <p className="text-sm text-muted-foreground">
                Capture start and end time per unit
              </p>
            </div>
            <Switch
              id="timestamp"
              checked={config.auto_capture.timestamp_in_out}
              onCheckedChange={(checked) =>
                onChange({
                  ...config,
                  auto_capture: { ...config.auto_capture, timestamp_in_out: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="gps">GPS Location</Label>
              <p className="text-sm text-muted-foreground">
                Capture GPS coordinates per unit
              </p>
            </div>
            <Switch
              id="gps"
              checked={config.auto_capture.gps_location}
              onCheckedChange={(checked) =>
                onChange({
                  ...config,
                  auto_capture: { ...config.auto_capture, gps_location: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="time-tracking">Time Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Calculate time spent on each unit
              </p>
            </div>
            <Switch
              id="time-tracking"
              checked={config.auto_capture.time_tracking}
              onCheckedChange={(checked) =>
                onChange({
                  ...config,
                  auto_capture: { ...config.auto_capture, time_tracking: checked },
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
