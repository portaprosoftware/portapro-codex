import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, MessageSquare, Bell, Settings } from "lucide-react";

export const MaintenanceNotificationsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure email alerts for maintenance reminders and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-7day">7-day reminder</Label>
              <Switch id="email-7day" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-dayof">Day-of reminder</Label>
              <Switch id="email-dayof" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-overdue">Overdue alerts</Label>
              <Switch id="email-overdue" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-completed">Completion confirmations</Label>
              <Switch id="email-completed" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-recipients">Email Recipients</Label>
              <Input 
                id="email-recipients" 
                placeholder="fleet@company.com, manager@company.com"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="email-template">Email Template (7-day reminder)</Label>
              <Textarea 
                id="email-template"
                placeholder="Subject: Maintenance Reminder - {vehicle} {task}&#10;&#10;Hi {recipient},&#10;&#10;This is a reminder that {vehicle} has {task} scheduled for {date}.&#10;&#10;Please ensure this maintenance is completed on time."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            SMS Notifications
          </CardTitle>
          <CardDescription>
            Configure text message alerts for critical maintenance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-critical">Critical priority only</Label>
              <Switch id="sms-critical" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-overdue">Overdue alerts</Label>
              <Switch id="sms-overdue" defaultChecked />
            </div>
          </div>
          
          <div>
            <Label htmlFor="sms-recipients">SMS Recipients</Label>
            <Input 
              id="sms-recipients" 
              placeholder="+1234567890, +0987654321"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Configure in-app and browser notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-enabled">Enable push notifications</Label>
              <Switch id="push-enabled" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-sound">Enable notification sound</Label>
              <Switch id="push-sound" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quiet-start">Quiet hours start</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="10:00 PM" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                      {`${i.toString().padStart(2, '0')}:00`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quiet-end">Quiet hours end</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="6:00 AM" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                      {`${i.toString().padStart(2, '0')}:00`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            View recently sent maintenance notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No notifications sent yet
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
          <Settings className="w-4 h-4 mr-2" />
          Save Notification Settings
        </Button>
      </div>
    </div>
  );
};