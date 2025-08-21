import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface JobItemSelection {
  product_id: string;
  quantity: number;
  strategy: 'bulk' | 'specific';
  specific_item_ids?: string[];
  attributes?: Record<string, string | boolean>;
  bulk_additional?: number; // Additional bulk units when mixing specific + bulk
}

export interface JobWizardData {
  // Step 1: Customer Selection
  customer_id?: string;
  
  // Step 2: Job Type & Scheduling  
  job_type?: 'delivery' | 'pickup' | 'service' | 'on-site-survey';
  scheduled_date?: string;
  scheduled_time?: string | null;
  timezone: string;
  return_date?: string | null;
  rental_duration_days?: number;
  rental_duration_hours?: number;
  notes?: string;
  is_priority?: boolean;
  
  // Step 3: Location Selection
  special_instructions?: string;
  selected_coordinate_ids: string[];

  // Step 4-5: Assignment & Items
  driver_id?: string | null;
  vehicle_id?: string | null;
  items?: JobItemSelection[];
  create_daily_assignment?: boolean;
  // Services selection (from Service Hub)
  servicesData?: {
    selectedServices: any[];
    servicesSubtotal: number;
  };

  // Pickup job details (when scheduling delivery + pickup)
  create_pickup_job?: boolean;
  pickup_date?: string | null;
  pickup_time?: string | null;
  pickup_notes?: string;
  pickup_is_priority?: boolean;
  
  // Partial pickup details (multiple partial pickups between delivery and final pickup)
  create_partial_pickups?: boolean;
  partial_pickups?: Array<{
    id: string;
    date: string;
    time?: string | null;
    notes?: string;
    is_priority?: boolean;
  }>;
}

interface JobWizardState {
  currentStep: number;
  data: JobWizardData;
  errors: Record<string, string>;
  isLoading: boolean;
}

type JobWizardAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'UPDATE_DATA'; payload: Partial<JobWizardData> }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET' };

const initialState: JobWizardState = {
  currentStep: 1,
  data: {
    timezone: 'America/New_York',
    selected_coordinate_ids: [],
    scheduled_time: null,
    return_date: null,
    rental_duration_days: 1,
    rental_duration_hours: 0,
    is_priority: false,
    items: [],
    create_daily_assignment: true,
    servicesData: { selectedServices: [], servicesSubtotal: 0 },
    create_pickup_job: false,
    pickup_date: null,
    pickup_time: null,
    pickup_notes: '',
    pickup_is_priority: false,
    create_partial_pickups: false,
    partial_pickups: [],
  },
  errors: {},
  isLoading: false,
};

function jobWizardReducer(state: JobWizardState, action: JobWizardAction): JobWizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'UPDATE_DATA':
      return { 
        ...state, 
        data: { ...state.data, ...action.payload },
        errors: {} // Clear errors when data is updated
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface JobWizardContextType {
  state: JobWizardState;
  dispatch: React.Dispatch<JobWizardAction>;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateData: (data: Partial<JobWizardData>) => void;
  setErrors: (errors: Record<string, string>) => void;
  setLoading: (loading: boolean) => void;
  validateCurrentStep: () => boolean;
  reset: () => void;
}

const JobWizardContext = createContext<JobWizardContextType | undefined>(undefined);

export function JobWizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(jobWizardReducer, initialState);

  const goToStep = (step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
    }
  };

  const previousStep = () => {
    dispatch({ type: 'SET_STEP', payload: Math.max(1, state.currentStep - 1) });
  };

  const updateData = (data: Partial<JobWizardData>) => {
    dispatch({ type: 'UPDATE_DATA', payload: data });
  };

  const setErrors = (errors: Record<string, string>) => {
    dispatch({ type: 'SET_ERRORS', payload: errors });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};

    switch (state.currentStep) {
      case 1:
        if (!state.data.customer_id) {
          errors.customer = 'Please select a customer';
        }
        break;
      case 2:
        if (!state.data.job_type) {
          errors.job_type = 'Please select a job type';
        }
        if (!state.data.scheduled_date) {
          errors.scheduled_date = 'Please select a scheduled date';
        }
        if (state.data.job_type === 'delivery') {
          const days = state.data.rental_duration_days || 0;
          const hours = state.data.rental_duration_hours || 0;
          
          // Validate rental duration: must have either days ≥ 1 OR hours > 0 (but not both zero)
          if (days === 0 && hours === 0) {
            errors.rental_duration = 'Please specify rental duration (minimum 1 day or 1 hour)';
          }
          
          // If days ≥ 1, hours are ignored (daily billing)
          // If days = 0, must have hours > 0 (hourly billing)
          if (days === 0 && hours > 0 && hours > 23) {
            errors.rental_duration = 'Hours must be 23 or less when using hourly billing';
          }
        }
        break;
      case 3:
        // Optional: validate location/coordinates here
        break;
      case 4:
        // Driver and vehicle selection is now optional
        break;
      case 5:
        // Products & services optional (service-only jobs allowed)
        // If provided, ensure quantities are positive
        if (state.data.items && state.data.items.some(i => i.quantity <= 0)) {
          errors.items = 'All selected quantities must be greater than 0';
        }
        // Require at least one service when job type is 'service'
        if (state.data.job_type === 'service' && (!state.data.servicesData || state.data.servicesData.selectedServices.length === 0)) {
          errors.services = 'Please select at least one service for a service job';
        }
        break;
      case 6:
        // Services & Frequency step: no additional validation (optional)
        break;
      case 7:
        // Review step: no additional validation
        break;
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return false;
    }

    return true;
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  const value: JobWizardContextType = {
    state,
    dispatch,
    goToStep,
    nextStep,
    previousStep,
    updateData,
    setErrors,
    setLoading,
    validateCurrentStep,
    reset,
  };

  return (
    <JobWizardContext.Provider value={value}>
      {children}
    </JobWizardContext.Provider>
  );
}

export function useJobWizard() {
  const context = useContext(JobWizardContext);
  if (context === undefined) {
    throw new Error('useJobWizard must be used within a JobWizardProvider');
  }
  return context;
}