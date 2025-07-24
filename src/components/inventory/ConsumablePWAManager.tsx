import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Zap, Globe, Settings, Bell, Download } from 'lucide-react';
import { toast } from 'sonner';

interface PWAFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  config?: any;
}

export const ConsumablePWAManager: React.FC = () => {
  const [pwaFeatures, setPwaFeatures] = useState<PWAFeature[]>([
    {
      id: 'offline-mode',
      name: 'Offline Mode',
      description: 'Allow app to work offline with local storage sync',
      enabled: true,
      config: { syncInterval: 5 }
    },
    {
      id: 'push-notifications',
      name: 'Push Notifications',
      description: 'Send push notifications for stock alerts and requests',
      enabled: true,
      config: { allowCritical: true, quietHours: '22:00-06:00' }
    },
    {
      id: 'geolocation',
      name: 'Geolocation Services',
      description: 'Track consumable usage by location',
      enabled: false,
      config: { accuracy: 'high', trackingInterval: 10 }
    },
    {
      id: 'camera-integration',
      name: 'Camera Integration',
      description: 'QR code scanning and photo attachments',
      enabled: true,
    },
    {
      id: 'voice-commands',
      name: 'Voice Commands',
      description: 'Voice-activated consumable requests',
      enabled: false,
      config: { language: 'en-US', confidence: 0.8 }
    }
  ]);

  const [installPrompt, setInstallPrompt] = useState({
    enabled: true,
    timing: 'after-login',
    message: 'Install PortaPro Consumables for quick access to inventory management!'
  });

  const toggleFeature = (featureId: string) => {
    setPwaFeatures(prev => 
      prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, enabled: !feature.enabled }
          : feature
      )
    );
    toast.success('PWA feature updated');
  };

  const generateManifest = () => {
    const manifest = {
      name: "PortaPro Consumables",
      short_name: "PP Consumables",
      description: "Advanced consumables management for PortaPro",
      start_url: "/consumables",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#3b82f6",
      icons: [
        {
          src: "/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ],
      shortcuts: [
        {
          name: "Quick Request",
          short_name: "Request",
          description: "Quickly request consumables",
          url: "/consumables?tab=requests",
          icons: [{ src: "/icons/request-96x96.png", sizes: "96x96" }]
        },
        {
          name: "Scan QR",
          short_name: "Scan",
          description: "Scan QR code for instant requests",
          url: "/consumables?tab=qr-codes",
          icons: [{ src: "/icons/qr-96x96.png", sizes: "96x96" }]
        }
      ]
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('PWA manifest downloaded');
  };

  const testPushNotification = () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('PortaPro Consumables', {
            body: 'Test notification: Low stock alert for Toilet Paper',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'consumables-alert',
            requireInteraction: true
          });
          toast.success('Test notification sent');
        } else {
          toast.error('Notification permission denied');
        }
      });
    } else {
      toast.error('Notifications not supported');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            PWA & Mobile Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="features" className="space-y-4">
            <TabsList>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="install">Installation</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="manifest">Manifest</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="space-y-4">
              <div className="grid gap-4">
                {pwaFeatures.map(feature => (
                  <Card key={feature.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{feature.name}</h4>
                            <Badge variant={feature.enabled ? 'default' : 'secondary'}>
                              {feature.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                          
                          {feature.config && feature.enabled && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs font-medium mb-2">Configuration:</p>
                              <div className="space-y-2">
                                {Object.entries(feature.config).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-xs">
                                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                    <span className="font-mono">{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Switch 
                          checked={feature.enabled}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="install" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Install Prompt</h4>
                      <p className="text-sm text-muted-foreground">Configure when users see the install prompt</p>
                    </div>
                    <Switch checked={installPrompt.enabled} />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Timing</Label>
                      <Select value={installPrompt.timing}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediately</SelectItem>
                          <SelectItem value="after-login">After Login</SelectItem>
                          <SelectItem value="after-usage">After 3 Uses</SelectItem>
                          <SelectItem value="manual">Manual Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Custom Message</Label>
                      <Input 
                        value={installPrompt.message}
                        onChange={(e) => setInstallPrompt(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Custom install message..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm">Test Install Prompt</Button>
                    <Button size="sm" variant="outline">Reset to Defaults</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Push Notification Settings</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Stock Alerts</Label>
                        <Switch defaultChecked />
                        <p className="text-xs text-muted-foreground">Low stock and out of stock alerts</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Request Updates</Label>
                        <Switch defaultChecked />
                        <p className="text-xs text-muted-foreground">Status updates for requests</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Job Notifications</Label>
                        <Switch />
                        <p className="text-xs text-muted-foreground">Job-related consumable alerts</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Reorder Suggestions</Label>
                        <Switch defaultChecked />
                        <p className="text-xs text-muted-foreground">AI-powered reorder recommendations</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={testPushNotification}>
                        <Bell className="w-4 h-4 mr-2" />
                        Test Notification
                      </Button>
                      <Button variant="outline">Configure Templates</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manifest" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">PWA Manifest Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>App Name</Label>
                        <Input defaultValue="PortaPro Consumables" />
                      </div>
                      <div>
                        <Label>Short Name</Label>
                        <Input defaultValue="PP Consumables" />
                      </div>
                      <div>
                        <Label>Theme Color</Label>
                        <Input type="color" defaultValue="#3b82f6" />
                      </div>
                      <div>
                        <Label>Background Color</Label>
                        <Input type="color" defaultValue="#ffffff" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2">App Shortcuts</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>Quick Request</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>Scan QR Code</span>
                        <Badge variant="outline">Enabled</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>View Analytics</span>
                        <Badge variant="secondary">Disabled</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={generateManifest}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Manifest
                    </Button>
                    <Button variant="outline">
                      <Globe className="w-4 h-4 mr-2" />
                      Validate PWA
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};