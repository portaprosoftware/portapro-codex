// Vehicle type mapping for display purposes
const vehicleTypeDisplayNames: Record<string, string> = {
  // Light & Utility Vehicles
  "pickup": "Pickup Truck",
  "cargo-van": "Cargo Van",
  "service-truck": "Service / Utility Truck",
  "suv-car": "SUV / Car",

  // Heavy & Fleet Vehicles
  "box-truck": "Box Truck / Straight Truck",
  "flatbed-truck": "Flatbed Truck",
  "semi-truck": "Semi-Truck / Tractor",
  "dump-truck": "Dump Truck",
  "step-van": "Step Van / Delivery Van",
  "bus": "Bus / Shuttle",

  // Sanitation & Waste Vehicles
  "vacuum-truck": "Vacuum Truck",
  "pumper-truck": "Pumper Truck",
  "septic-tank-truck": "Septic Tank Truck",
  "combination-unit": "Combination Unit (Vac + Jet)",
  "sludge-tanker": "Sludge Tanker",
  "grease-trap-truck": "Grease Trap Pump Truck",

  // Trailers
  "enclosed-trailer": "Enclosed Trailer",
  "flatbed-trailer": "Flatbed Trailer",
  "tank-trailer": "Tank Trailer",
  "vacuum-trailer": "Vacuum Trailer",
  "lowboy-trailer": "Lowboy Trailer",

  // Other / Special
  "golf-cart": "Golf Cart / Utility Cart",
  "atv": "ATV / UTV",
  "heavy-equipment": "Heavy Equipment",
  "custom": "Custom",

  // Legacy vehicle types for backward compatibility
  "truck": "Truck",
  "van": "Van",
  "trailer": "Trailer",
  "suv": "SUV",
  "other": "Other",
};

/**
 * Get the display name for a vehicle type
 * @param vehicleType - The vehicle type ID from the database
 * @returns The user-friendly display name
 */
export function getVehicleTypeDisplayName(vehicleType: string | null | undefined): string {
  if (!vehicleType) return "Unknown";
  
  // Check if we have a specific mapping
  if (vehicleTypeDisplayNames[vehicleType]) {
    return vehicleTypeDisplayNames[vehicleType];
  }
  
  // Fallback to formatted version of the ID
  return vehicleType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get the category for a vehicle type (for styling purposes)
 * @param vehicleType - The vehicle type ID
 * @returns The category name
 */
export function getVehicleTypeCategory(vehicleType: string | null | undefined): string {
  if (!vehicleType) return "other";

  const lightVehicles = ["pickup", "cargo-van", "service-truck", "suv-car"];
  const heavyVehicles = ["box-truck", "flatbed-truck", "semi-truck", "dump-truck", "step-van", "bus"];
  const sanitationVehicles = ["vacuum-truck", "pumper-truck", "septic-tank-truck", "combination-unit", "sludge-tanker", "grease-trap-truck"];
  const trailers = ["enclosed-trailer", "flatbed-trailer", "tank-trailer", "vacuum-trailer", "lowboy-trailer"];

  if (lightVehicles.includes(vehicleType)) return "light";
  if (heavyVehicles.includes(vehicleType)) return "heavy";
  if (sanitationVehicles.includes(vehicleType)) return "sanitation";
  if (trailers.includes(vehicleType)) return "trailers";
  
  return "other";
}
