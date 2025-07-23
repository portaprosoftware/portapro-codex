import React, { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Building2, Users, Bell, DollarSign, Clock } from "lucide-react";
import { SimplifiedSettings } from "@/components/settings/SimplifiedSettings";
import { useUserRole } from "@/hooks/useUserRole";

export default function Settings() {
  return (
    <Layout>
      <SimplifiedSettings />
    </Layout>
  );
}
