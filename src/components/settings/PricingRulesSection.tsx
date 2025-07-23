import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Plus, Edit, Trash2, Calendar, Percent, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const pricingRuleSchema = z.object({
  rule_name: z.string().min(1, "Rule name is required"),
  rule_type: z.enum(["volume_discount", "seasonal", "customer_type", "duration_based"]),
  discount_type: z.enum(["percentage", "fixed_amount"]),
  discount_value: z.number().min(0, "Discount value must be positive"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean(),
  conditions: z.record(z.any()).optional(),
});

type PricingRuleFormData = z.infer<typeof pricingRuleSchema>;

const ruleTypeLabels = {
  volume_discount: "Volume Discount",
  seasonal: "Seasonal Pricing",
  customer_type: "Customer Type",
  duration_based: "Duration Based",
};

const ruleTypeColors = {
  volume_discount: "bg-gradient-primary",
  seasonal: "bg-gradient-secondary",
  customer_type: "bg-gradient-accent",
  duration_based: "bg-gradient-warning",
};

export function PricingRulesSection() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { isOwner, user } = useUserRole();
  const queryClient = useQueryClient();

  const { data: pricingRules = [], isLoading } = useQuery({
    queryKey: ["pricing-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_rules")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<PricingRuleFormData>({
    resolver: zodResolver(pricingRuleSchema),
    defaultValues: {
      rule_name: "",
      rule_type: "volume_discount",
      discount_type: "percentage",
      discount_value: 0,
      start_date: "",
      end_date: "",
      is_active: true,
      conditions: {},
    },
  });

  const createPricingRule = useMutation({
    mutationFn: async (data: PricingRuleFormData) => {
      const { error } = await supabase
        .from("pricing_rules")
        .insert({
          name: data.rule_name,
          rule_type: data.rule_type,
          adjustment_type: data.discount_type,
          adjustment_value: data.discount_value,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          is_active: data.is_active,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
      toast.success("Pricing rule created successfully");
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to create pricing rule");
      console.error("Error creating pricing rule:", error);
    },
  });

  const toggleRuleStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("pricing_rules")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
      toast.success("Pricing rule updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update pricing rule");
      console.error("Error updating pricing rule:", error);
    },
  });

  const deletePricingRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pricing_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-rules"] });
      toast.success("Pricing rule deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete pricing rule");
      console.error("Error deleting pricing rule:", error);
    },
  });

  const onSubmit = (data: PricingRuleFormData) => {
    createPricingRule.mutate(data);
  };

  if (!isOwner) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            Only owners can access pricing rule settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Pricing Rules</span>
            <Badge variant="secondary">{pricingRules.length} rules</Badge>
          </CardTitle>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:bg-gradient-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Pricing Rule</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="rule_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rule Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Summer Volume Discount" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rule_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rule Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="volume_discount">Volume Discount</SelectItem>
                              <SelectItem value="seasonal">Seasonal Pricing</SelectItem>
                              <SelectItem value="customer_type">Customer Type</SelectItem>
                              <SelectItem value="duration_based">Duration Based</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discount_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="discount_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Discount Value {form.watch("discount_type") === "percentage" ? "(%)" : "($)"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="10" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Active Rule</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPricingRule.isPending}>
                      {createPricingRule.isPending ? "Creating..." : "Create Rule"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : pricingRules.length === 0 ? (
          <div className="text-center py-8">
            <TrendingDown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pricing Rules</h3>
            <p className="text-muted-foreground mb-4">
              Create your first pricing rule to manage discounts and promotions.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Rule
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricingRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    {rule.name}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-white ${ruleTypeColors[rule.rule_type as keyof typeof ruleTypeColors]}`}>
                      {ruleTypeLabels[rule.rule_type as keyof typeof ruleTypeLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {rule.adjustment_type === "percentage" ? (
                        <Percent className="w-4 h-4" />
                      ) : (
                        <DollarSign className="w-4 h-4" />
                      )}
                      <span>{rule.adjustment_value}{rule.adjustment_type === "percentage" ? "%" : ""}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {rule.start_date || rule.end_date ? (
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {rule.start_date ? new Date(rule.start_date).toLocaleDateString() : "∞"} - {rule.end_date ? new Date(rule.end_date).toLocaleDateString() : "∞"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No date limits</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => 
                        toggleRuleStatus.mutate({ id: rule.id, is_active: checked })
                      }
                      disabled={toggleRuleStatus.isPending}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => deletePricingRule.mutate(rule.id)}
                        disabled={deletePricingRule.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}