import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, AlertTriangle, TrendingUp, Camera, Search, Filter, Eye, Shield, Users, Building, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const OCRQualityDashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confidenceFilter, setConfidenceFilter] = useState("all");

  // Set up real-time subscription for product_items
  useEffect(() => {
    const channel = supabase
      .channel('product-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_items'
        },
        () => {
          // Invalidate all relevant queries when product_items change
          queryClient.invalidateQueries({ queryKey: ["ocr-analytics"] });
          queryClient.invalidateQueries({ queryKey: ["items-needing-review"] });
          queryClient.invalidateQueries({ queryKey: ["vendor-analytics"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch OCR analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["ocr-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_items")
        .select("verification_status, ocr_confidence_score")
        .not("tool_number", "is", null)
        .is("deleted_at", null);

      if (error) throw error;

      const total = data.length;
      if (total === 0) {
        return {
          total: 0,
          verified: 0,
          autoDetected: 0,
          needsReview: 0,
          avgConfidence: 0,
          accuracyRate: 0
        };
      }

      const verified = data.filter(item => item.verification_status === "manual_verified").length;
      const autoDetected = data.filter(item => item.verification_status === "auto_detected").length;
      const needsReview = data.filter(item => item.verification_status === "needs_review").length;
      const avgConfidence = data.reduce((acc, item) => acc + (item.ocr_confidence_score || 0), 0) / total;

      return {
        total,
        verified,
        autoDetected,
        needsReview,
        avgConfidence,
        accuracyRate: verified / total * 100
      };
    },
    staleTime: 30000 // Cache for 30 seconds
  });

  // Fetch items needing verification with better performance
  const { data: itemsNeedingReview, isLoading: itemsLoading } = useQuery({
    queryKey: ["items-needing-review", searchQuery, statusFilter, confidenceFilter],
    queryFn: async () => {
      let query = supabase
        .from("product_items")
        .select("id, item_code, tool_number, vendor_id, verification_status, ocr_confidence_score, products!inner(name)")
        .not("tool_number", "is", null)
        .is("deleted_at", null);

      // Apply filters only if they're set to avoid unnecessary complexity
      if (searchQuery?.trim()) {
        query = query.or(`item_code.ilike.%${searchQuery}%,tool_number.ilike.%${searchQuery}%,vendor_id.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("verification_status", statusFilter);
      }

      if (confidenceFilter !== "all") {
        if (confidenceFilter === "low") {
          query = query.lt("ocr_confidence_score", 0.6);
        } else if (confidenceFilter === "medium") {
          query = query.gte("ocr_confidence_score", 0.6).lt("ocr_confidence_score", 0.8);
        } else if (confidenceFilter === "high") {
          query = query.gte("ocr_confidence_score", 0.8);
        }
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(100); // Limit results for performance

      if (error) throw error;
      return data || [];
    },
    staleTime: 10000, // Cache for 10 seconds
    enabled: true // Always enabled, but with optimizations
  });

  // Fetch vendor analytics
  const { data: vendorAnalytics, isLoading: vendorLoading } = useQuery({
    queryKey: ["vendor-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_items")
        .select("vendor_id, verification_status, ocr_confidence_score")
        .not("vendor_id", "is", null)
        .not("tool_number", "is", null)
        .is("deleted_at", null);

      if (error) throw error;

      if (data.length === 0) return [];

      const vendorStats = data.reduce((acc, item) => {
        const vendorId = item.vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = { total: 0, verified: 0, avgConfidence: 0, confidenceSum: 0 };
        }
        acc[vendorId].total++;
        if (item.verification_status === "manual_verified") {
          acc[vendorId].verified++;
        }
        acc[vendorId].confidenceSum += item.ocr_confidence_score || 0;
        acc[vendorId].avgConfidence = acc[vendorId].confidenceSum / acc[vendorId].total;
        return acc;
      }, {} as Record<string, any>);

      return Object.entries(vendorStats).map(([vendorId, stats]) => ({
        vendorId,
        ...stats,
        qualityScore: (stats.verified / stats.total) * 100
      }));
    },
    staleTime: 30000 // Cache for 30 seconds
  });

  // Review mutation - marks item as needs_review
  const reviewMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("product_items")
        .update({ verification_status: "needs_review" })
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ocr-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["items-needing-review"] });
      toast({
        title: "Review Status Updated",
        description: "Item has been marked for review",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update review status",
        variant: "destructive",
      });
    }
  });

  // Verification mutation - marks item as manually verified
  const verifyMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("product_items")
        .update({ verification_status: "manual_verified" })
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ocr-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["items-needing-review"] });
      toast({
        title: "Item Verified",
        description: "Item has been successfully verified",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to verify item",
        variant: "destructive",
      });
    }
  });

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge className="bg-green-100 text-green-700">High</Badge>;
    if (confidence >= 0.6) return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-700">Low</Badge>;
  };

  const getVerificationBadge = (status: string) => {
    const badges = {
      manual_verified: <Badge className="bg-green-100 text-green-700"><Shield className="w-3 h-3 mr-1" />Verified</Badge>,
      auto_detected: <Badge className="bg-blue-100 text-blue-700">Auto-detected</Badge>,
      needs_review: <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Needs Review</Badge>
    };
    return badges[status as keyof typeof badges] || null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Panel Scan Monitor</h2>
        <p className="text-gray-600">Monitor and verify tool tracking accuracy</p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tracked Items</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                analytics?.total || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Items with tool data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                `${Math.round(analytics?.accuracyRate || 0)}%`
              )}
            </div>
            <Progress value={analytics?.accuracyRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                `${Math.round((analytics?.avgConfidence || 0) * 100)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">OCR detection confidence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analyticsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                analytics?.needsReview || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Items requiring verification</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="verification" className="space-y-4">
        <TabsList>
          <TabsTrigger value="verification">Verification Queue</TabsTrigger>
          <TabsTrigger value="vendor-analytics">Vendor Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="verification" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search items, tool numbers, vendors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="needs_review">Needs Review</SelectItem>
                <SelectItem value="auto_detected">Auto-detected</SelectItem>
                <SelectItem value="manual_verified">Verified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Confidence</SelectItem>
                <SelectItem value="low">Low (&lt;60%)</SelectItem>
                <SelectItem value="medium">Medium (60-80%)</SelectItem>
                <SelectItem value="high">High (&gt;80%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Verification Table */}
          <Card>
            <CardHeader>
              <CardTitle>Items for Review</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Tool Number</TableHead>
                    <TableHead>Vendor ID</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        <p className="mt-2 text-muted-foreground">Loading items...</p>
                      </TableCell>
                    </TableRow>
                  ) : itemsNeedingReview?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">No items found matching your filters</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    itemsNeedingReview?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_code}</TableCell>
                        <TableCell>{item.products?.name}</TableCell>
                        <TableCell className="font-mono text-sm">{item.tool_number}</TableCell>
                        <TableCell className="font-mono text-sm">{item.vendor_id}</TableCell>
                        <TableCell>
                          {getConfidenceBadge(item.ocr_confidence_score || 0)}
                        </TableCell>
                        <TableCell>
                          {getVerificationBadge(item.verification_status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => reviewMutation.mutate(item.id)}
                              disabled={reviewMutation.isPending || item.verification_status === "needs_review"}
                            >
                              {reviewMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <Eye className="w-3 h-3 mr-1" />
                              )}
                              Review
                            </Button>
                            {item.verification_status !== "manual_verified" && (
                              <Button
                                size="sm"
                                onClick={() => verifyMutation.mutate(item.id)}
                                disabled={verifyMutation.isPending}
                              >
                                {verifyMutation.isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                )}
                                Verify
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendor-analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Vendor Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vendorLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  <p className="mt-2 text-muted-foreground">Loading vendor data...</p>
                </div>
              ) : vendorAnalytics?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No vendor performance data available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor ID</TableHead>
                      <TableHead>Total Items</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Quality Score</TableHead>
                      <TableHead>Avg Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorAnalytics?.map((vendor) => (
                      <TableRow key={vendor.vendorId}>
                        <TableCell className="font-mono">{vendor.vendorId}</TableCell>
                        <TableCell>{vendor.total}</TableCell>
                        <TableCell>{vendor.verified}/{vendor.total}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={vendor.qualityScore} className="w-16" />
                            {Math.round(vendor.qualityScore)}%
                          </div>
                        </TableCell>
                        <TableCell>{Math.round(vendor.avgConfidence * 100)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};