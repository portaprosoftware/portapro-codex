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
    useSameDriverForAll: boolean;
    useSameVehicleForAll: boolean;
    groupAssignmentsByDay: boolean;
    dayAssignments?: {
      [dateKey: string]: {
        driver?: any;
        vehicle?: any;
      }
    };
    individualServiceAssignments?: {
      [serviceId: string]: {
        [dateKey: string]: {
          driver?: any;
          vehicle?: any;
        }
      }
    };
    expandedDays?: Set<string>;
    scheduledDriverForAll?: any;
    scheduledVehicleForAll?: any;
    package_override?: {
      enabled: boolean;
      amount: number;
    };
  };

  // Pickup job details (when scheduling delivery + pickup)
  create_pickup_job?: boolean;
  pickup_date?: string | null;
  pickup_time?: string | null;
  pickup_notes?: string;
  pickup_is_priority?: boolean;
  pickup_driver_id?: string | null;
  pickup_vehicle_id?: string | null;
  
  // Partial pickup details (multiple partial pickups between delivery and final pickup)
  create_partial_pickups?: boolean;
  partial_pickups?: Array<{
    id: string;
    date: string;
    time?: string | null;
    notes?: string;
    is_priority?: boolean;
  }>;
  
  // Partial pickup driver/vehicle assignments
  partial_pickup_assignments?: {
    [pickupId: string]: {
      driver_id?: string | null;
      vehicle_id?: string | null;
    };
  };
  
  // Pickup inventory selections (for delivery jobs with pickups)
  pickup_inventory_selections?: {
    main_pickup?: JobItemSelection[];
    partial_pickups?: {
      [pickupId: string]: JobItemSelection[];
    };
  };
}

interface JobWizardState {
  currentStep: number;
  data: JobWizardData;
  errors: Record<string, string>;
  isLoading: boolean;
  wizardMode: 'job' | 'quote' | 'job_and_quote';
}

type JobWizardAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'UPDATE_DATA'; payload: Partial<JobWizardData> }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_WIZARD_MODE'; payload: 'job' | 'quote' | 'job_and_quote' }
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
    servicesData: { 
      selectedServices: [], 
      servicesSubtotal: 0,
      useSameDriverForAll: false,
      useSameVehicleForAll: false,
      groupAssignmentsByDay: true,
      dayAssignments: {},
      individualServiceAssignments: {},
      expandedDays: new Set()
    },
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
  wizardMode: 'job',
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
    case 'SET_WIZARD_MODE':
      return { ...state, wizardMode: action.payload };
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
  setWizardMode: (mode: 'job' | 'quote' | 'job_and_quote') => void;
  validateCurrentStep: () => boolean;
  reset: () => void;
}

const JobWizardContext = createContext<JobWizardContextType | undefined>(undefined);

export function JobWizardProvider({ 
  children, 
  initialDraftData,
  initialMode = 'job'
}: { 
  children: ReactNode;
  initialDraftData?: any;
  initialMode?: 'job' | 'quote' | 'job_and_quote';
}) {
  const [state, dispatch] = useReducer(jobWizardReducer, {
    ...initialState,
    wizardMode: initialMode
  });

  // Load draft data when provider mounts
  React.useEffect(() => {
    if (initialDraftData?.job_data) {
      console.log('Loading draft data into wizard:', initialDraftData.job_data);
      dispatch({ 
        type: 'UPDATE_DATA', 
        payload: initialDraftData.job_data 
      });
    }
  }, [initialDraftData]);

  const goToStep = (step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      let nextStepNumber = state.currentStep + 1;
      
      // Skip step 5 (Products & Inventory) for service jobs
      if (state.currentStep === 4 && state.data.job_type === 'service') {
        nextStepNumber = 6; // Go directly to Services & Frequency
      }
      
      // Skip both steps 5 and 6 for survey/estimate jobs
      if (state.currentStep === 4 && state.data.job_type === 'on-site-survey') {
        nextStepNumber = 7; // Go directly to Review & Confirmation
      }
      
      // Skip step 6 (Services & Frequency) for pickup jobs
      if (state.currentStep === 5 && state.data.job_type === 'pickup') {
        nextStepNumber = 7; // Go directly to Review & Confirmation
      }
      
      dispatch({ type: 'SET_STEP', payload: nextStepNumber });
    }
  };

  const previousStep = () => {
    let prevStepNumber = state.currentStep - 1;
    
    // Skip step 5 (Products & Inventory) when going back from step 6 for service jobs
    if (state.currentStep === 6 && state.data.job_type === 'service') {
      prevStepNumber = 4; // Go back to Assignment step
    }
    
    // Skip both steps 5 and 6 when going back from step 7 for survey/estimate jobs
    if (state.currentStep === 7 && state.data.job_type === 'on-site-survey') {
      prevStepNumber = 4; // Go back to Assignment step
    }
    
    // Skip step 6 (Services & Frequency) when going back from step 7 for pickup jobs  
    if (state.currentStep === 7 && state.data.job_type === 'pickup') {
      prevStepNumber = 5; // Go back to Products step
    }
    
    dispatch({ type: 'SET_STEP', payload: Math.max(1, prevStepNumber) });
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

  const setWizardMode = (mode: 'job' | 'quote' | 'job_and_quote') => {
    dispatch({ type: 'SET_WIZARD_MODE', payload: mode });
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
        // Skip validation for step 5 if it's a service or survey job (this step is skipped)
        if (state.data.job_type === 'service' || state.data.job_type === 'on-site-survey') {
          break;
        }
        
        // Products step - no validation here, allow proceeding to services
        // If provided, ensure quantities are positive
        if (state.data.items && state.data.items.some(i => i.quantity <= 0)) {
          errors.items = 'All selected quantities must be greater than 0';
        }
        
        // Validate pickup inventory allocation for delivery jobs with pickups
        if (state.data.job_type === 'delivery' && 
            (state.data.create_pickup_job || state.data.create_partial_pickups) && 
            state.data.items && state.data.items.length > 0) {
          
          const hasMainPickup = state.data.create_pickup_job;
          const hasPartialPickups = state.data.create_partial_pickups && state.data.partial_pickups && state.data.partial_pickups.length > 0;
          
          // Check if any pickup inventory has been allocated
          const mainPickupItems = state.data.pickup_inventory_selections?.main_pickup || [];
          const partialPickupItems = state.data.pickup_inventory_selections?.partial_pickups || {};
          
          const hasMainPickupItems = hasMainPickup && mainPickupItems.length > 0 && mainPickupItems.some(item => item.quantity > 0);
          const hasPartialPickupItems = hasPartialPickups && Object.values(partialPickupItems).some(items => 
            items.length > 0 && items.some(item => item.quantity > 0)
          );
          
          if ((hasMainPickup || hasPartialPickups) && !hasMainPickupItems && !hasPartialPickupItems) {
            errors.pickup_inventory = 'Please allocate inventory quantities for your scheduled pickup jobs. Scroll down to the "Pickup Inventory Allocation" section.';
          }
        }
        break;
      case 6:
        // Skip validation for step 6 if it's a pickup or survey job (this step is skipped)
        if (state.data.job_type === 'pickup' || state.data.job_type === 'on-site-survey') {
          break;
        }
        
        // Services & Frequency step: validate both products and services together
        // If provided, ensure quantities are positive
        if (state.data.items && state.data.items.some(i => i.quantity <= 0)) {
          errors.items = 'All selected quantities must be greater than 0';
        }
        // Require at least one service when job type is 'service'
        if (state.data.job_type === 'service' && (!state.data.servicesData || state.data.servicesData.selectedServices.length === 0)) {
          errors.services = 'Please select at least one service for a service job';
        }
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
    setWizardMode,
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