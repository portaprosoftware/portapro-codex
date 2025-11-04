import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TechnicianPerformanceTableProps {
  technicianStats: Record<string, { 
    completed: number; 
    avgTime: number; 
    totalCost: number;
  }>;
}

export const TechnicianPerformanceTable: React.FC<TechnicianPerformanceTableProps> = ({ 
  technicianStats 
}) => {
  const sortedTechnicians = Object.entries(technicianStats)
    .sort((a, b) => b[1].completed - a[1].completed);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technician Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedTechnicians.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Technician</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Avg Time</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTechnicians.map(([techId, stats]) => (
                <TableRow key={techId}>
                  <TableCell className="font-medium">
                    {techId === "Unassigned" ? (
                      <Badge variant="outline">Unassigned</Badge>
                    ) : (
                      techId
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{stats.completed}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {stats.avgTime >= 24 
                      ? `${(stats.avgTime / 24).toFixed(1)} days`
                      : `${stats.avgTime.toFixed(1)} hrs`
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    ${stats.totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell className="text-right">
                    ${(stats.totalCost / stats.completed).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No technician data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
