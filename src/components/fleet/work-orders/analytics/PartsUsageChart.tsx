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

interface PartsUsageChartProps {
  partsUsage: Record<string, { quantity: number; cost: number; count: number }>;
}

export const PartsUsageChart: React.FC<PartsUsageChartProps> = ({ partsUsage }) => {
  const sortedParts = Object.entries(partsUsage)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 20); // Top 20 parts by cost

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Top Parts by Cost</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedParts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedParts.slice(0, 10).map(([partName, stats]) => (
                  <TableRow key={partName}>
                    <TableCell className="font-medium">{partName}</TableCell>
                    <TableCell className="text-right">
                      ${stats.cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{stats.quantity}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No parts data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Frequently Used Parts</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedParts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead className="text-right">Used In</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(partsUsage)
                  .sort((a, b) => b[1].count - a[1].count)
                  .slice(0, 10)
                  .map(([partName, stats]) => (
                    <TableRow key={partName}>
                      <TableCell className="font-medium">{partName}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{stats.count} WOs</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {stats.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No parts data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
