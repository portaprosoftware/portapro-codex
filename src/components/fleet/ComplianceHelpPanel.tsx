
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const ComplianceHelpPanel: React.FC = () => {
  const [open, setOpen] = useState<boolean>(true);

  return (
    <Card className="p-4 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">How this works</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Quick guide for roles and usage:
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <span className="font-medium">Documents</span> — Track permits and required paperwork. Audience: Dispatch, Admins.
            </li>
            <li>
              <span className="font-medium">Types</span> — Manage the list of compliance document types. Audience: Admins.
            </li>
            <li>
              <span className="font-medium">Spill Kits</span> — Check which vehicles have spill kits. Drivers verify in DVIR; Dispatch can record checks directly.
            </li>
            <li>
              <span className="font-medium">Incidents</span> — Log spills or exposures. Audience: Dispatch; Drivers may report in field.
            </li>
            <li>
              <span className="font-medium">Decon Logs</span> — Record decontamination after incidents. Audience: Dispatch, Safety.
            </li>
            <li>
              <span className="font-medium">Reports</span> — Generate daily compliance summaries when needed. Audience: Admins.
            </li>
          </ul>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Show"}
        </Button>
      </div>

      {!open ? null : (
        <div className="mt-4 text-sm text-muted-foreground">
          Tip: Use “Log Incident” and “Record Spill Kit Check” to add data without waiting on DVIRs.
        </div>
      )}
    </Card>
  );
};
