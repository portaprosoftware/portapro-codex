import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useVehicleMetrics } from '@/hooks/vehicle/useVehicleMetrics';
import { useVehicleActivity } from '@/hooks/vehicle/useVehicleActivity';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wrench, 
  FileText, 
  AlertTriangle, 
  Calendar, 
  Clock,
  ExternalLink,
  Truck,
  Edit,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getVehicleTypeDisplayName } from '@/lib/vehicleTypeUtils';

interface VehicleOverviewTabProps {
  vehicleId: string;
  licensePlate: string;
  vehicleData?: any;
  isActive?: boolean;
}

export function VehicleOverviewTab({ vehicleId, licensePlate, vehicleData, isActive = true }: VehicleOverviewTabProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: metrics, isLoading: metricsLoading } = useVehicleMetrics(vehicleId);
  const { data: activity, isLoading: activityLoading } = useVehicleActivity(vehicleId, 10);
  
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentVehicleImage, setCurrentVehicleImage] = useState(vehicleData?.vehicle_image);

  // Fetch full vehicle data if not provided
  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
      if (error) throw error;
      if (data?.vehicle_image) {
        setCurrentVehicleImage(data.vehicle_image);
      }
      return data;
    },
    enabled: !vehicleData,
  });

  const vehicleInfo = vehicleData || vehicle;

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${vehicleId}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: vehicleData, error: updateError } = await supabase
        .from("vehicles")
        .update({ vehicle_image: uploadData.path })
        .eq("id", vehicleId)
        .select()
        .single();

      if (updateError) throw updateError;
      return { uploadData, vehicleData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
      setCurrentVehicleImage(data.uploadData.path);
      setVehicleImage(null);
      setImagePreview(null);
      setIsUploadingImage(false);
      toast.success("Vehicle photo uploaded successfully!");
    },
    onError: (error: any) => {
      setIsUploadingImage(false);
      toast.error(error.message || "Failed to upload photo");
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async () => {
      if (!currentVehicleImage) return;
      
      const { error: storageError } = await supabase.storage
        .from('vehicle-images')
        .remove([currentVehicleImage]);
      
      if (storageError) throw storageError;
      
      const { error: updateError } = await supabase
        .from("vehicles")
        .update({ vehicle_image: null })
        .eq("id", vehicleId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
      setCurrentVehicleImage(null);
      toast.success("Vehicle photo deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete photo");
    }
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setVehicleImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setVehicleImage(null);
    setImagePreview(null);
  };

  const handleUploadPhoto = () => {
    if (vehicleImage) {
      uploadImageMutation.mutate(vehicleImage);
    }
  };

  const getVehicleImageUrl = (imagePath: string) => {
    const { data } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(imagePath);
    return data.publicUrl;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      case "maintenance":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case "retired":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
    }
  };

  const quickStats = [
    {
      label: 'Open Work Orders',
      value: metrics?.open_work_orders || 0,
      icon: Wrench,
      gradient: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-700',
    },
    {
      label: 'DVIRs (30 days)',
      value: metrics?.dvirs_last_30d || 0,
      icon: FileText,
      gradient: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-700',
    },
    {
      label: 'Incidents (30 days)',
      value: metrics?.incidents_last_30d || 0,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-red-600',
      textColor: 'text-red-700',
    },
    {
      label: 'Docs Expiring',
      value: metrics?.docs_expiring_30d || 0,
      icon: Calendar,
      gradient: 'from-yellow-500 to-yellow-600',
      textColor: 'text-yellow-700',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'work_order':
        return Wrench;
      case 'dvir':
        return FileText;
      case 'incident':
        return AlertTriangle;
      case 'fuel':
        return Clock;
      default:
        return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Metrics - Moved to top */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-2 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs sm:text-sm font-bold text-muted-foreground">{stat.label}</p>
                    <p className={cn("text-2xl sm:text-3xl font-bold", stat.textColor)}>
                      {metricsLoading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className={cn(
                    "p-2 sm:p-3 rounded-lg bg-gradient-to-r",
                    stat.gradient
                  )}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Vehicle Information and Photo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">License Plate:</span>
              <span className="font-medium">{vehicleInfo?.license_plate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <Badge variant="outline" className="bg-transparent border-blue-500 text-blue-600 text-xs">
                {vehicleInfo?.vehicle_type ? getVehicleTypeDisplayName(vehicleInfo.vehicle_type) : 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Make:</span>
              <span className="font-medium">{vehicleInfo?.make || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Model:</span>
              <span className="font-medium">{vehicleInfo?.model || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Year:</span>
              <span className="font-medium">{vehicleInfo?.year || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">VIN:</span>
              <span className="font-medium">{vehicleInfo?.vin || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge className={cn(getStatusColor(vehicleInfo?.status || 'active'))}>
                {vehicleInfo?.status ? vehicleInfo.status.charAt(0).toUpperCase() + vehicleInfo.status.slice(1) : 'Active'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Mileage:</span>
              <span className="font-medium">{vehicleInfo?.current_mileage?.toLocaleString() || "N/A"} miles</span>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Photo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Vehicle Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentVehicleImage ? (
              <div className="space-y-3">
                <img 
                  src={getVehicleImageUrl(currentVehicleImage)} 
                  alt={`${licensePlate} vehicle`}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => deleteImageMutation.mutate()}
                  disabled={deleteImageMutation.isPending}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Photo
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No photo available</p>
                </div>
              </div>
            )}

            {/* Upload new photo */}
            <div className="mt-4 space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="vehicle-image-upload"
              />
              <label htmlFor="vehicle-image-upload" className="block">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-2 border-dashed border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-600"
                  asChild
                >
                  <span className="flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Click to upload new photo
                  </span>
                </Button>
              </label>

              {imagePreview && (
                <div className="space-y-3">
                  <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleUploadPhoto}
                      disabled={isUploadingImage}
                      className="flex-1"
                    >
                      {isUploadingImage ? "Uploading..." : "Upload Photo"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={removeImage}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes section */}
      {vehicleInfo?.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{vehicleInfo.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Last DVIR Status */}
      {metrics?.last_dvir_date && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Last DVIR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(metrics.last_dvir_date), 'MMM d, yyyy h:mm a')}
                </p>
                <Badge className={cn(
                  "mt-2 font-bold",
                  metrics.last_dvir_status === 'pass' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                )}>
                  {metrics.last_dvir_status?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/fleet?vehicle_id=${vehicleId}&vehicle_name=${encodeURIComponent(licensePlate)}`)}
            title="View all activity"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-100 rounded" />
              ))}
            </div>
          ) : activity && activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item) => {
                const Icon = getActivityIcon(item.activity_type);
                return (
                  <div
                    key={item.activity_id}
                    className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {item.activity_summary}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {format(new Date(item.activity_date), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
