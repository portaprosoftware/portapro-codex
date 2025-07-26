import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Upload, AlertTriangle, CheckCircle, Plus, FileText, Calendar, Bell, Download, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react';

export function TrainingCertificationsTab() {
  const [addCertModalOpen, setAddCertModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // overview, individual, requirements
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const certificationCategories = [
    { 
      id: 'cdl', 
      name: 'CDL Licenses', 
      description: 'Commercial driver\'s licenses',
      active: 15, 
      expiring: 2,
      required: true,
      roles: ['Driver']
    },
    { 
      id: 'safety', 
      name: 'Safety Training', 
      description: 'OSHA and safety certifications',
      active: 23, 
      expiring: 1,
      required: true,
      roles: ['Driver', 'Warehouse Tech']
    },
    { 
      id: 'equipment', 
      name: 'Equipment Operation', 
      description: 'Specialized equipment certifications',
      active: 9, 
      expiring: 2,
      required: false,
      roles: ['Warehouse Tech']
    },
    { 
      id: 'hazmat', 
      name: 'HAZMAT Certification', 
      description: 'Hazardous materials handling',
      active: 5, 
      expiring: 0,
      required: false,
      roles: ['Driver']
    }
  ];

  const individualCertifications = [
    {
      id: '1',
      employeeName: 'John Smith',
      employeeId: '1',
      role: 'Driver',
      certifications: [
        { type: 'CDL Class A', issueDate: '2023-01-15', expiryDate: '2025-01-15', status: 'valid', authority: 'DMV' },
        { type: 'Safety Training', issueDate: '2023-06-01', expiryDate: '2024-06-01', status: 'expiring', authority: 'OSHA' },
        { type: 'HAZMAT', issueDate: '2023-03-10', expiryDate: '2025-03-10', status: 'valid', authority: 'TSA' }
      ]
    },
    {
      id: '2',
      employeeName: 'Emily Davis',
      employeeId: '4',
      role: 'Warehouse Tech',
      certifications: [
        { type: 'Forklift Operation', issueDate: '2023-02-20', expiryDate: '2024-02-20', status: 'expired', authority: 'OSHA' },
        { type: 'Safety Training', issueDate: '2023-07-15', expiryDate: '2024-07-15', status: 'valid', authority: 'OSHA' }
      ]
    }
  ];

  const trainingRequirements = [
    { 
      id: '1', 
      name: 'CDL License', 
      roles: ['Driver'], 
      frequency: 'Every 4 years', 
      mandatory: true,
      description: 'Valid commercial driver\'s license required for all driving positions'
    },
    { 
      id: '2', 
      name: 'Annual Safety Training', 
      roles: ['Driver', 'Warehouse Tech'], 
      frequency: 'Annually', 
      mandatory: true,
      description: 'Comprehensive safety training covering workplace hazards'
    },
    { 
      id: '3', 
      name: 'Equipment Training', 
      roles: ['Warehouse Tech'], 
      frequency: 'Every 2 years', 
      mandatory: true,
      description: 'Forklift and heavy equipment operation certification'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      'valid': 'default',
      'expiring': 'secondary',
      'expired': 'destructive'
    };
    return colors[status] || 'outline';
  };

  const getComplianceRate = (employee) => {
    const total = employee.certifications.length;
    const valid = employee.certifications.filter(cert => cert.status === 'valid').length;
    return total > 0 ? Math.round((valid / total) * 100) : 0;
  };

  const expiringCertifications = individualCertifications
    .flatMap(emp => emp.certifications.map(cert => ({ ...cert, employeeName: emp.employeeName })))
    .filter(cert => cert.status === 'expiring')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Training & Certifications</h2>
          <p className="text-muted-foreground">Manage team training requirements and certification tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Certificate
          </Button>
          <Button onClick={() => setAddCertModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Active Certs</p>
                <p className="text-2xl font-bold">52</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Expiring Soon</p>
                <p className="text-2xl font-bold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Training Hours</p>
                <p className="text-2xl font-bold">156</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Compliance</p>
                <p className="text-2xl font-bold">94.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="individual">Individual</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search certifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Expiring Certifications Alert */}
          {expiringCertifications.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Certifications Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiringCertifications.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                      <div>
                        <span className="font-medium">{cert.employeeName}</span>
                        <span className="text-muted-foreground ml-2">{cert.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-yellow-700">Expires {cert.expiryDate}</span>
                        <Button size="sm" variant="outline">
                          <Bell className="h-4 w-4 mr-1" />
                          Remind
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certification Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Certification Categories</CardTitle>
              <CardDescription>Manage different types of certifications and training</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {certificationCategories.map((category) => (
                  <Card key={category.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{category.name}</h4>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {category.required && (
                              <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            {category.roles.map(role => (
                              <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                            ))}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Active: {category.active}</span>
                          <span className="text-yellow-600">Expiring: {category.expiring}</span>
                        </div>
                        <Progress value={(category.active / (category.active + category.expiring)) * 100} className="h-2" />
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Plus className="h-4 w-4 mr-1" />
                          Add New
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Certifications</CardTitle>
              <CardDescription>View and manage certifications by team member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {individualCertifications.map((employee) => (
                  <Card key={employee.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {employee.employeeName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{employee.employeeName}</h4>
                            <p className="text-sm text-muted-foreground">{employee.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {getComplianceRate(employee)}% Compliant
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {employee.certifications.map((cert, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-sm">{cert.type}</h5>
                              <Badge variant={getStatusColor(cert.status)} className="text-xs">
                                {cert.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Issued: {cert.issueDate}</p>
                              <p>Expires: {cert.expiryDate}</p>
                              <p>Authority: {cert.authority}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Requirements</CardTitle>
              <CardDescription>Manage role-based training and certification requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingRequirements.map((requirement) => (
                  <div key={requirement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{requirement.name}</h4>
                        {requirement.mandatory && (
                          <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{requirement.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Frequency: {requirement.frequency}</span>
                        <span>Roles: {requirement.roles.join(', ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>Generate and download compliance reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Expiration Report</h4>
                  <p className="text-sm text-muted-foreground mb-3">All certifications expiring in the next 90 days</p>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Compliance Report</h4>
                  <p className="text-sm text-muted-foreground mb-3">Overall compliance status by team member</p>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Training History</h4>
                  <p className="text-sm text-muted-foreground mb-3">Complete training and certification history</p>
                  <Button variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Certification Modal */}
      <Dialog open={addCertModalOpen} onOpenChange={setAddCertModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Certification</DialogTitle>
            <DialogDescription>
              Add a new certification for a team member
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Team Member</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {individualCertifications.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.employeeName} - {emp.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Certification Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select certification type" />
                </SelectTrigger>
                <SelectContent>
                  {certificationCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Issuing Authority</Label>
              <Input placeholder="e.g., DMV, OSHA, TSA" />
            </div>
            
            <div className="space-y-2">
              <Label>Certificate Number</Label>
              <Input placeholder="Certification number or ID" />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddCertModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setAddCertModalOpen(false)}>
                Add Certification
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Certificate</DialogTitle>
            <DialogDescription>
              Upload a certificate document for verification
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag and drop files here, or click to select
              </p>
              <Button variant="outline" className="mt-2">
                Select Files
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>Related Certification</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Link to existing certification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john-cdl">John Smith - CDL Class A</SelectItem>
                  <SelectItem value="emily-safety">Emily Davis - Safety Training</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setUploadModalOpen(false)}>
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}