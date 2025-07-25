/**
 * Timezone utilities for mapping ZIP codes to timezones
 * Handles all US states including split-timezone states
 */

interface TimezoneMapping {
  [key: string]: string;
}

// ZIP code to timezone mappings for split-timezone states and major cities
const zipToTimezone: TimezoneMapping = {
  // Idaho (Mountain/Pacific)
  '83': 'America/Boise', // Most of Idaho
  '832': 'America/Los_Angeles', // Northern Idaho panhandle
  
  // Oregon (Mountain/Pacific) 
  '97': 'America/Los_Angeles', // Most of Oregon
  '979': 'America/Boise', // Eastern Oregon (Malheur County)
  
  // Nevada (Mountain/Pacific)
  '89': 'America/Los_Angeles', // Most of Nevada
  '893': 'America/Boise', // West Wendover area
  
  // Kansas (Central/Mountain)
  '66': 'America/Chicago', // Most of Kansas
  '678': 'America/Denver', // Western Kansas counties
  '679': 'America/Denver',
  
  // Nebraska (Central/Mountain)
  '68': 'America/Chicago', // Most of Nebraska
  '691': 'America/Denver', // Western Nebraska
  
  // North Dakota (Central/Mountain)
  '58': 'America/Chicago', // Most of North Dakota
  '586': 'America/Denver', // Western North Dakota
  
  // South Dakota (Central/Mountain)
  '57': 'America/Chicago', // Most of South Dakota
  '577': 'America/Denver', // Western South Dakota
  
  // Texas (Central/Mountain)
  '75': 'America/Chicago', // Dallas area
  '76': 'America/Chicago', // Fort Worth area  
  '77': 'America/Chicago', // Houston area
  '78': 'America/Chicago', // Austin/San Antonio area
  '79': 'America/Denver', // El Paso area (Mountain time)
  
  // Florida (Eastern/Central)
  '32': 'America/New_York', // Most of Florida
  '325': 'America/Chicago', // Western Florida panhandle
  
  // Indiana (Eastern/Central)
  '46': 'America/New_York', // Most of Indiana
  '47': 'America/Chicago', // Northwestern and southwestern Indiana
  
  // Kentucky (Eastern/Central)
  '40': 'America/New_York', // Eastern Kentucky
  '41': 'America/New_York', // Central Kentucky  
  '42': 'America/Chicago', // Western Kentucky
  
  // Michigan (Eastern/Central)
  '48': 'America/New_York', // Most of Michigan
  '49': 'America/New_York', // Western Michigan
  '498': 'America/Chicago', // Upper Peninsula western counties
  
  // Tennessee (Eastern/Central)
  '37': 'America/New_York', // Eastern Tennessee (Gatlinburg, Knoxville)
  '38': 'America/Chicago', // Western Tennessee (Nashville, Memphis)
  
  // Alaska (Alaska/Hawaii-Aleutian)
  '99': 'America/Anchorage', // Most of Alaska
  '996': 'America/Adak', // Aleutian Islands
};

// State-wide timezone defaults for non-split states
const stateTimezones: TimezoneMapping = {
  // Eastern Time
  'ME': 'America/New_York', 'NH': 'America/New_York', 'VT': 'America/New_York',
  'MA': 'America/New_York', 'RI': 'America/New_York', 'CT': 'America/New_York',
  'NY': 'America/New_York', 'NJ': 'America/New_York', 'PA': 'America/New_York',
  'DE': 'America/New_York', 'MD': 'America/New_York', 'DC': 'America/New_York',
  'VA': 'America/New_York', 'WV': 'America/New_York', 'NC': 'America/New_York',
  'SC': 'America/New_York', 'GA': 'America/New_York', 'OH': 'America/New_York',
  
  // Central Time
  'WI': 'America/Chicago', 'IL': 'America/Chicago', 'MN': 'America/Chicago',
  'IA': 'America/Chicago', 'MO': 'America/Chicago', 'AR': 'America/Chicago',
  'LA': 'America/Chicago', 'MS': 'America/Chicago', 'AL': 'America/Chicago',
  'OK': 'America/Chicago',
  
  // Mountain Time
  'MT': 'America/Denver', 'WY': 'America/Denver', 'CO': 'America/Denver',
  'NM': 'America/Denver', 'UT': 'America/Denver', 'AZ': 'America/Phoenix',
  
  // Pacific Time
  'WA': 'America/Los_Angeles', 'CA': 'America/Los_Angeles',
  
  // Alaska/Hawaii
  'HI': 'America/Adak',
};

export const getTimezoneFromZip = (zipCode: string, state?: string): string => {
  if (!zipCode) return 'America/New_York'; // Default to Eastern
  
  // Clean ZIP code (remove +4 extension)
  const cleanZip = zipCode.replace(/[^0-9]/g, '').substring(0, 5);
  
  // Check specific ZIP code mappings first (for split-timezone states)
  for (const [zipPrefix, timezone] of Object.entries(zipToTimezone)) {
    if (cleanZip.startsWith(zipPrefix)) {
      return timezone;
    }
  }
  
  // Fall back to state-wide timezone if provided
  if (state) {
    const stateCode = state.toUpperCase();
    return stateTimezones[stateCode] || 'America/New_York';
  }
  
  // Last resort: guess by ZIP code ranges
  const zipNum = parseInt(cleanZip);
  
  if (zipNum >= 10001 && zipNum <= 14999) return 'America/New_York'; // NY, NJ, CT area
  if (zipNum >= 15001 && zipNum <= 19999) return 'America/New_York'; // PA, DE, MD area
  if (zipNum >= 20001 && zipNum <= 24999) return 'America/New_York'; // DC, MD, VA area
  if (zipNum >= 25001 && zipNum <= 26999) return 'America/New_York'; // WV area
  if (zipNum >= 27001 && zipNum <= 28999) return 'America/New_York'; // NC area
  if (zipNum >= 29001 && zipNum <= 29999) return 'America/New_York'; // SC area
  if (zipNum >= 30001 && zipNum <= 31999) return 'America/New_York'; // GA area
  if (zipNum >= 32001 && zipNum <= 34999) return 'America/New_York'; // FL area
  if (zipNum >= 35001 && zipNum <= 36999) return 'America/Chicago'; // AL area
  if (zipNum >= 38001 && zipNum <= 38999) return 'America/Chicago'; // TN area
  if (zipNum >= 39001 && zipNum <= 39999) return 'America/Chicago'; // MS area
  if (zipNum >= 40001 && zipNum <= 42999) return 'America/New_York'; // KY area
  if (zipNum >= 43001 && zipNum <= 45999) return 'America/New_York'; // OH area
  if (zipNum >= 46001 && zipNum <= 47999) return 'America/New_York'; // IN area
  if (zipNum >= 48001 && zipNum <= 49999) return 'America/New_York'; // MI area
  if (zipNum >= 50001 && zipNum <= 52999) return 'America/Chicago'; // IA area
  if (zipNum >= 53001 && zipNum <= 54999) return 'America/Chicago'; // WI area
  if (zipNum >= 55001 && zipNum <= 56999) return 'America/Chicago'; // MN area
  if (zipNum >= 57001 && zipNum <= 57999) return 'America/Chicago'; // SD area
  if (zipNum >= 58001 && zipNum <= 58999) return 'America/Chicago'; // ND area
  if (zipNum >= 59001 && zipNum <= 59999) return 'America/Denver'; // MT area
  if (zipNum >= 60001 && zipNum <= 62999) return 'America/Chicago'; // IL area
  if (zipNum >= 63001 && zipNum <= 65999) return 'America/Chicago'; // MO area
  if (zipNum >= 66001 && zipNum <= 67999) return 'America/Chicago'; // KS area
  if (zipNum >= 68001 && zipNum <= 69999) return 'America/Chicago'; // NE area
  if (zipNum >= 70001 && zipNum <= 71999) return 'America/Chicago'; // LA area
  if (zipNum >= 72001 && zipNum <= 72999) return 'America/Chicago'; // AR area
  if (zipNum >= 73001 && zipNum <= 74999) return 'America/Chicago'; // OK area
  if (zipNum >= 75001 && zipNum <= 79999) return 'America/Chicago'; // TX area
  if (zipNum >= 80001 && zipNum <= 81999) return 'America/Denver'; // CO area
  if (zipNum >= 82001 && zipNum <= 83999) return 'America/Denver'; // WY, ID area
  if (zipNum >= 84001 && zipNum <= 84999) return 'America/Denver'; // UT area
  if (zipNum >= 85001 && zipNum <= 86999) return 'America/Phoenix'; // AZ area
  if (zipNum >= 87001 && zipNum <= 88999) return 'America/Denver'; // NM area
  if (zipNum >= 89001 && zipNum <= 89999) return 'America/Los_Angeles'; // NV area
  if (zipNum >= 90001 && zipNum <= 96999) return 'America/Los_Angeles'; // CA area
  if (zipNum >= 97001 && zipNum <= 97999) return 'America/Los_Angeles'; // OR area
  if (zipNum >= 98001 && zipNum <= 99999) return 'America/Los_Angeles'; // WA area
  
  return 'America/New_York'; // Default fallback
};

export const timezoneOptions = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: '-05:00' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: '-06:00' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: '-07:00' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: '-08:00' },
  { value: 'America/Phoenix', label: 'Arizona Time (AZ)', offset: '-07:00' },
  { value: 'America/Anchorage', label: 'Alaska Time (AK)', offset: '-09:00' },
  { value: 'America/Adak', label: 'Hawaii-Aleutian Time (HAT)', offset: '-10:00' },
];

export const getCompanyTimezone = (): string => {
  // Default to Eastern Time - this should be enhanced to fetch from company settings
  return 'America/New_York';
};

export const formatTimezoneLabel = (timezone: string): string => {
  const option = timezoneOptions.find(tz => tz.value === timezone);
  return option?.label || timezone;
};