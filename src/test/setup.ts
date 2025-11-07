import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({ 
    user: { id: 'test-user-id' }, 
    isLoaded: true 
  })),
  useOrganization: vi.fn(() => ({ 
    organization: { id: 'test-org-id' }, 
    isLoaded: true 
  })),
  useAuth: vi.fn(() => ({ 
    isLoaded: true, 
    isSignedIn: true 
  })),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
    },
  },
}));
