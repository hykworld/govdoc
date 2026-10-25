export type DocumentType = 'TYPE_A' | 'TYPE_B' | 'TYPE_C';

export interface KeyBadge {
  label: string;
  value: string;
  variant?: 'default' | 'warning' | 'success' | 'info';
}

export interface ScheduleItem {
  phase: string;
  date: string;
  isImportant?: boolean;
  note?: string;
}

export interface EligibilityItem {
  category: string;
  criteria: string;
}

export interface ConditionTableItem {
  type: string;
  deposit: string;
  rent: string;
  notes?: string;
}

export interface SelfCheckItem {
  id: string;
  question: string;
  isCritical?: boolean;
}

export interface LocationItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type?: string;
  units?: string;
  deposit?: string;
  rent?: string;
  distanceKm?: number;
  travelTimeMin?: number;
}

export interface TypeAData {
  projectName: string;
  schedules: ScheduleItem[];
  eligibility: EligibilityItem[];
  supplyAndTerms: {
    totalUnits: string;
    leasePeriod: string;
    depositAndRent: string;
    conditionsTable?: ConditionTableItem[];
  };
  applicationMethod: {
    channel: string;
    urlOrApp?: string;
    steps?: string[];
    requiredDocuments?: string[];
  };
  selfChecklist?: SelfCheckItem[];
  locations?: LocationItem[];
}

export interface ComparisonItem {
  item: string;
  before: string;
  after: string;
  highlight?: string;
}

export interface TypeBData {
  coreOneLiner: string;
  targetBeneficiaries: string[];
  comparisonTable: ComparisonItem[];
  effectiveDate: string;
  keyNotes?: string[];
}

export interface KeyPointItem {
  title: string;
  detail: string;
}

export interface ActionChecklistItem {
  action: string;
  target?: string;
  timing?: string;
}

export interface TypeCData {
  summaryLines: string[];
  keyPoints: KeyPointItem[];
  actionChecklist: ActionChecklistItem[];
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  documentType: DocumentType;
  typeLabel: string;
  title: string;
  issuingAgency?: string;
  announcementDate?: string;
  markdownReport: string;
  keyBadges?: KeyBadge[];
  typeAData?: TypeAData;
  typeBData?: TypeBData;
  typeCData?: TypeCData;
  locations?: LocationItem[];
  rawInputSnippet?: string;
}

export interface QAMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  suggestedFollowUps?: string[];
}
