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
import { useCertificationTypes, useEmployeeCertifications, useAddEmployeeCertification, useTrainingRequirements, useDeleteTrainingRequirement, useUpdateEmployeeCertification } from '@/hooks/useTraining';
import { useDriverDirectory } from '@/hooks/useDirectory';
import { CertificateUploadButton } from '@/components/training/CertificateUploadButton';

export function TrainingCertificationsTab() {
  const [addCertModalOpen, setAddCertModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // overview, individual, requirements
  const [searchQuery, setSearchQuery] = useState('');

  // Data hooks
  const { data: certTypes = [] } = useCertificationTypes();
  const { data: empCerts = [] } = useEmployeeCertifications();
  const { data: requirements = [] } = useTrainingRequirements();
  const addCert = useAddEmployeeCertification();
  const updateCert = useUpdateEmployeeCertification();
  const deleteRequirement = useDeleteTrainingRequirement();
  const { data: driverDirectory = [] } = useDriverDirectory();

  // Add cert modal state
  const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>(undefined);
  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>(undefined);
  const [issueDate, setIssueDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [newCertFileUrl, setNewCertFileUrl] = useState<string>('');

  // Upload modal state
  const [selectedEmpCertId, setSelectedEmpCertId] = useState<string>('');

  // Helper maps
  const certTypeById = React.useMemo(() => {
    const m: Record<string, any> = {};
    (certTypes || []).forEach((t: any) => { m[t.id] = t; });
    return m;
  }, [certTypes]);

  const driverByClerk = React.useMemo(() => {
    const m: Record<string, { name: string; initials: string; role: string } > = {};
    (driverDirectory || []).forEach((d: any) => {
      const name = `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() || d.email || 'Team Member';
      const initials = `${(d.first_name?.[0] ?? 'T')}${(d.last_name?.[0] ?? '')}`.toUpperCase();
      if (d.clerk_user_id) m[d.clerk_user_id] = { name, initials, role: d.role || 'Team Member' };
    });
    return m;
  }, [driverDirectory]);

  // Derived categories summary
  const categoriesSummary = React.useMemo(() => {
    const now = new Date();
    const soon = new Date();
    soon.setDate(now.getDate() + 30);

    return (certTypes || []).map((type: any) => {
      const certsForType = (empCerts as any[]).filter(c => c.certification_type_id === type.id);
      const active = certsForType.filter(c => !c.expires_on || new Date(c.expires_on) > now).length;
      const expiring = certsForType.filter(c => c.expires_on && new Date(c.expires_on) <= soon && new Date(c.expires_on) >= now).length;
      return {
        id: type.id,
        name: type.name,
        description: type.description || '',
        active,
        expiring,
        required: !!type.is_mandatory,
        roles: [],
      };
    });
  }, [certTypes, empCerts]);

  // Group certifications by driver
  const individuals = React.useMemo(() => {
    const byDriver: Record<string, { id: string; employeeName: string; role: string; certifications: any[] } > = {};
    (empCerts as any[]).forEach((c: any) => {
      const driverId = c.driver_clerk_id;
      const type = certTypeById[c.certification_type_id];
      const issueDate = c.completed_on;
      const expiryDate = c.expires_on || '';
      const now = new Date();
      const status = expiryDate ? (new Date(expiryDate) < now ? 'expired' : (new Date(expiryDate) <= new Date(now.getTime() + 30*24*60*60*1000) ? 'expiring' : 'valid')) : 'valid';
      const driverInfo = driverByClerk[driverId] || { name: driverId || 'Team Member', initials: 'TM', role: 'Team Member' };
      if (!byDriver[driverId]) {
        byDriver[driverId] = {
          id: driverId,
          employeeName: driverInfo.name,
          role: driverInfo.role,
          certifications: [],
        };
      }
      byDriver[driverId].certifications.push({
        id: c.id,
        type: type?.name || 'Certification',
        issueDate,
        expiryDate,
        status,
        authority: '',
        certificateUrl: c.certificate_url || '',
      });
    });

    let list = Object.values(byDriver);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(emp => emp.employeeName.toLowerCase().includes(q) || emp.certifications.some(c => c.type.toLowerCase().includes(q)));
    }
    return list;
  }, [empCerts, certTypeById, driverByClerk, searchQuery]);

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
    const valid = employee.certifications.filter((cert: any) => cert.status === 'valid').length;
    return total > 0 ? Math.round((valid / total) * 100) : 0;
  };

  const expiringCertifications = React.useMemo(() => {
    return individuals
      .flatMap((emp: any) => emp.certifications.map((cert: any) => ({ ...cert, employeeName: emp.employeeName })))
      .filter((cert: any) => cert.status === 'expiring')
      .slice(0, 5);
  }, [individuals]);

  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent className="p-6">
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
                    <p className="text-2xl font-bold">{empCerts.length}</p>
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
                <p className="text-2xl font-bold">{expiringCertifications.length}</p>
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
                <p className="text-2xl font-bold">—</p>
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
                <p className="text-2xl font-bold">—</p>
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
                {categoriesSummary.map((category) => (
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
                            {category.roles.map((role: string) => (
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
                        <Progress value={(category.active / Math.max(category.active + category.expiring, 1)) * 100} className="h-2" />
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
                {individuals.map((employee: any) => (
                  <Card key={employee.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {employee.employeeName.split(' ').map((n: string) => n[0]).join('')}
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
                        {employee.certifications.map((cert: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-sm">{cert.type}</h5>
                              <Badge variant={getStatusColor(cert.status)} className="text-xs">
                                {cert.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>Issued: {cert.issueDate}</p>
                              <p>Expires: {cert.expiryDate || '—'}</p>
                            </div>
                            {cert.certificateUrl && (
                              <div className="mt-2">
                                <Button asChild variant="outline" size="sm" className="w-full">
                                  <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Certificate
                                  </a>
                                </Button>
                              </div>
                            )}
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
                {requirements.map((requirement: any) => (
                  <div key={requirement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{certTypeById[requirement.certification_type_id]?.name || 'Certification'}</h4>
                        {requirement.is_required && (
                          <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">Role: {requirement.role}</div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Frequency (months): {requirement.frequency_months ?? '—'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteRequirement.mutate(requirement.id)}>
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
      <Dialog open={addCertModalOpen} onOpenChange={(v) => {
        setAddCertModalOpen(v);
        if (!v) {
          setSelectedDriverId(undefined);
          setSelectedTypeId(undefined);
          setIssueDate('');
          setExpiryDate('');
          setNewCertFileUrl('');
        }
      }}>
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
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {driverDirectory.map((d: any) => (
                    <SelectItem key={d.clerk_user_id} value={d.clerk_user_id}>
                      {(d.first_name || d.last_name) ? `${d.first_name ?? ''} ${d.last_name ?? ''}`.trim() : (d.email || d.clerk_user_id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Certification Type</Label>
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select certification type" />
                </SelectTrigger>
                <SelectContent>
                  {certTypes.map((cat: any) => (
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
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attach Certificate (optional)</Label>
              <CertificateUploadButton
                driverId={selectedDriverId}
                certificationName={certTypes.find((t: any) => t.id === selectedTypeId)?.name ?? null}
                uploadedFile={newCertFileUrl || null}
                onRemove={() => setNewCertFileUrl('')}
                onUploaded={(url) => setNewCertFileUrl(url)}
                buttonText="Upload Certificate"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddCertModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                if (!selectedDriverId || !selectedTypeId || !issueDate) return;
                await addCert.mutateAsync({
                  driver_clerk_id: selectedDriverId,
                  certification_type_id: selectedTypeId,
                  completed_on: issueDate,
                  expires_on: expiryDate || null,
                  certificate_url: newCertFileUrl || null,
                  notes: null,
                } as any);
                setAddCertModalOpen(false);
              }}>
                Add Certification
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={(v) => {
        setUploadModalOpen(v);
        if (!v) setSelectedEmpCertId('');
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Certificate</DialogTitle>
            <DialogDescription>
              Attach a certificate file to an existing certification record
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Existing Certification</Label>
              <Select value={selectedEmpCertId} onValueChange={setSelectedEmpCertId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select certification" />
                </SelectTrigger>
                <SelectContent>
                  {(empCerts as any[]).map((c) => {
                    const driverInfo = driverByClerk[c.driver_clerk_id];
                    const typeName = certTypeById[c.certification_type_id]?.name || 'Certification';
                    const label = `${driverInfo?.name || c.driver_clerk_id} — ${typeName} — issued ${c.completed_on}`;
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedEmpCertId && (() => {
              const c: any = (empCerts as any[]).find(ec => ec.id === selectedEmpCertId);
              const typeName = c ? (certTypeById[c.certification_type_id]?.name || '') : '';
              const driverId = c?.driver_clerk_id;
              return (
                <div className="space-y-2" key={selectedEmpCertId}>
                  <Label>Certificate File</Label>
                  <CertificateUploadButton
                    driverId={driverId}
                    certificationName={typeName}
                    uploadedFile={c?.certificate_url || null}
                    onUploaded={(url) => {
                      updateCert.mutate({ id: selectedEmpCertId, certificate_url: url });
                    }}
                    buttonText={c?.certificate_url ? 'Replace Certificate' : 'Upload Certificate'}
                  />
                </div>
              );
            })()}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
