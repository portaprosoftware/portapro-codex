export type InternalRole = 'admin' | 'dispatcher' | 'driver' | 'customer';
export type AppRole = InternalRole | 'unknown';

export const ROLE_LABELS: Record<InternalRole, string> = {
  admin: 'Admin',
  dispatcher: 'Dispatcher',
  driver: 'Tech / Driver',
  customer: 'Customer',
};

export const ROLE_OPTIONS: { value: InternalRole; label: string }[] = [
  { value: 'admin', label: ROLE_LABELS.admin },
  { value: 'dispatcher', label: ROLE_LABELS.dispatcher },
  { value: 'driver', label: ROLE_LABELS.driver },
  { value: 'customer', label: ROLE_LABELS.customer },
];

export const getRoleLabel = (role?: string | null) => {
  if (!role) return 'Unknown';
  const normalized = normalizeRoleValue(role);
  if (normalized === 'unknown') return 'Unknown';
  return ROLE_LABELS[normalized];
};

export const normalizeRoleValue = (role: string): AppRole => {
  const stripped = role.startsWith('org:') ? role.replace('org:', '') : role;

  switch (stripped) {
    case 'owner':
      return 'admin';
    case 'admin':
      return 'admin';
    case 'dispatcher':
      return 'dispatcher';
    case 'driver':
      return 'driver';
    case 'customer':
    case 'viewer':
      return 'customer';
    default:
      return 'unknown';
  }
};
