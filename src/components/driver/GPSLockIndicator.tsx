import React, { useEffect, useState } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface GPSLockIndicatorProps {
  required?: boolean;
  minAccuracy?: number;
  onLock?: (coords: GPSCoordinates) => void;
  className?: string;
}

export const GPSLockIndicator: React.FC<GPSLockIndicatorProps> = ({
  required = false,
  minAccuracy = 50,
  onLock,
  className = '',
}) => {
  const [status, setStatus] = useState<'idle' | 'acquiring' | 'locked' | 'failed'>('idle');
  const [coords, setCoords] = useState<GPSCoordinates | null>(null);
  const [error, setError] = useState<string>('');

  const acquireGPS = () => {
    setStatus('acquiring');
    setError('');

    if (!navigator.geolocation) {
      setStatus('failed');
      setError('GPS not available on this device');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const gpsData: GPSCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };

        setCoords(gpsData);

        if (gpsData.accuracy <= minAccuracy) {
          setStatus('locked');
          onLock?.(gpsData);
        } else {
          setStatus('failed');
          setError(`Low accuracy (${Math.round(gpsData.accuracy)}m). Required: ${minAccuracy}m`);
        }
      },
      (err) => {
        setStatus('failed');
        setError(err.message || 'Unable to get GPS location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    if (required && status === 'idle') {
      acquireGPS();
    }
  }, [required]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        {status === 'acquiring' && (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-muted-foreground">Acquiring GPS lock...</span>
          </>
        )}
        {status === 'locked' && (
          <>
            <MapPin className="w-4 h-4 text-green-500" />
            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold">
              GPS Locked
            </Badge>
            {coords && (
              <span className="text-xs text-muted-foreground">
                ±{Math.round(coords.accuracy)}m
              </span>
            )}
          </>
        )}
        {status === 'failed' && (
          <>
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-600">{error}</span>
          </>
        )}
        {status === 'idle' && !required && (
          <Button variant="outline" size="sm" onClick={acquireGPS} className="gap-2">
            <MapPin className="w-4 h-4" />
            Capture GPS Location
          </Button>
        )}
      </div>

      {coords && status === 'locked' && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border">
          <div>Lat: {coords.latitude.toFixed(6)}</div>
          <div>Lng: {coords.longitude.toFixed(6)}</div>
          <div>Time: {new Date(coords.timestamp).toLocaleTimeString()}</div>
        </div>
      )}

      {status === 'failed' && (
        <Button variant="outline" size="sm" onClick={acquireGPS} className="w-full">
          Retry GPS Lock
        </Button>
      )}
    </div>
  );
};
