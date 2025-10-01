import React, { createContext, useContext, useState, ReactNode } from 'react';

interface VehicleContextValue {
  vehicleId: string | null;
  vehicleName: string | null;
  setVehicle: (id: string | null, name?: string | null) => void;
  clearVehicle: () => void;
  isVehicleContext: boolean;
}

const VehicleContext = createContext<VehicleContextValue | undefined>(undefined);

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [vehicleName, setVehicleName] = useState<string | null>(null);

  const setVehicle = (id: string | null, name?: string | null) => {
    setVehicleId(id);
    setVehicleName(name || null);
  };

  const clearVehicle = () => {
    setVehicleId(null);
    setVehicleName(null);
  };

  const value: VehicleContextValue = {
    vehicleId,
    vehicleName,
    setVehicle,
    clearVehicle,
    isVehicleContext: vehicleId !== null,
  };

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicleContext() {
  const context = useContext(VehicleContext);
  if (context === undefined) {
    throw new Error('useVehicleContext must be used within a VehicleProvider');
  }
  return context;
}
