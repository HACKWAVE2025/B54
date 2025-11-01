export enum Tab {
  MedicalAnalysis = 'Medical Analysis',
  MyAnalysis = 'My Analysis',
  Learn = 'Learn',
  Wellness = 'Wellness',
  DrivingMode = 'Driving Mode',
  Emergency = 'Emergency',
  Facilities = 'Facilities',
  AIAssistant = 'AI Assistant',
}

export type AnalysisResult = Record<string, any>;

export interface FacilitySuggestion {
  name: string;
  rating: string;
  address: string;
}

export interface CropAnalysisResult {
  summary: string;
  potentialDiseases: {
    name: string;
    explanation: string;
  }[];
  fertilizerSuggestions: {
    name: string;
    reason: string;
  }[];
  pesticideSuggestions: {
    name: string;
    reason: string;
  }[];
}
