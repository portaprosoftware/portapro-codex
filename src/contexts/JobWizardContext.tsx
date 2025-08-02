import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface JobWizardData {
  // Step 1: Customer Selection
  customer_id?: string;
  
  // Step 2: Job Type & Scheduling  
  job_type?: 'delivery' | 'pickup' | 'service' | 'on-site-survey';
  scheduled_date?: string;
  scheduled_time?: string | null;
  timezone: string;
  notes?: string;
  is_priority?: boolean;
  
  // Step 3: Location Selection
  special_instructions?: string;
  selected_coordinate_ids: string[];
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
    is_priority: false,
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
        break;
      case 3:
        // Location validation can be added here if needed
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