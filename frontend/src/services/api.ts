import { 
  IndianStateSolarData, 
  GovernmentScheme, 
  CertifiedSolarInstaller, 
  SolarMyth, 
  SolarQuizQuestion,
  SolarCalculationInput,
  SolarCalculationResult,
  GreenCitizenProfile
} from '../types';

export interface InstallerFilters {
  state?: string;
  badge?: string;
  verified?: boolean;
  search?: string;
}

/**
 * Fetch solar potential, DISCOM tariff, and subsidy data for all Indian states.
 */
export async function fetchStates(): Promise<IndianStateSolarData[]> {
  const res = await fetch('/api/states');
  if (!res.ok) {
    throw new Error(`Failed to fetch states (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch PM Surya Ghar, state solar policies, and concessional loan schemes.
 */
export async function fetchGovernmentSchemes(): Promise<GovernmentScheme[]> {
  const res = await fetch('/api/schemes');
  if (!res.ok) {
    throw new Error(`Failed to fetch schemes (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch empanelled installers with optional state, badge, and search filters.
 */
export async function fetchInstallers(filters?: InstallerFilters): Promise<CertifiedSolarInstaller[]> {
  const params = new URLSearchParams();
  if (filters?.state && filters.state !== 'ALL') {
    params.append('state', filters.state);
  }
  if (filters?.badge && filters.badge !== 'all') {
    params.append('badge', filters.badge);
  }
  if (filters?.verified !== undefined) {
    params.append('verified', String(filters.verified));
  }
  if (filters?.search && filters.search.trim() !== '') {
    params.append('search', filters.search.trim());
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/installers${query}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch installers (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch common rooftop solar myths and facts with optional category filter.
 */
export async function fetchMyths(category?: string): Promise<SolarMyth[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') {
    params.append('category', category);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/myths${query}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch myths (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch interactive quiz questions from the database.
 */
export async function fetchQuizQuestions(category?: string): Promise<SolarQuizQuestion[]> {
  const params = new URLSearchParams();
  if (category && category !== 'all') {
    params.append('category', category);
  }
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`/api/quiz${query}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch quiz questions (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

/**
 * Calculate solar potential via FastAPI backend and log to calculation_logs.
 */
export async function calculateSolar(input: SolarCalculationInput): Promise<SolarCalculationResult> {
  const res = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) {
    throw new Error(`Calculation failed (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

export interface QuoteRequestPayload {
  installerId: string;
  clientName: string;
  clientPhone: string;
  clientCity: string;
  pincode: string;
  stateCode?: string;
  estimatedKw?: string;
}

export interface QuoteSubmissionResult {
  success: boolean;
  message: string;
  quoteId: number;
  clientName: string;
  installerName?: string;
}

/**
 * Submit a verified solar quote and doorstep site survey request to FastAPI backend.
 */
export async function submitQuoteRequest(payload: QuoteRequestPayload): Promise<QuoteSubmissionResult> {
  const res = await fetch('/api/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let msg = 'Failed to submit quote request';
    if (typeof errorData.detail === 'string') {
      msg = errorData.detail;
    } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
      msg = errorData.detail[0].msg || msg;
    }
    throw new Error(msg);
  }
  return res.json();
}

export interface CitizenCertificateData {
  citizenId: string;
  certificateId: string;
  fullName: string;
  city: string;
  stateCode: string;
  stateName: string;
  registeredAt: string;
  solarSystemKw: number;
  totalQuizScore: number;
  quizzesCompletedCount: number;
  verified: boolean;
  totalCo2SavedKg: number;
  treesEquivalent: number;
  coalSavedKg: number;
  totalUnitsGenerated: number;
}

/**
 * Save or update a Green Citizen pledge in the citizens table via backend.
 * Generates and returns a unique, official certificate ID from the backend.
 */
export async function saveCitizenPledgeApi(payload: Partial<GreenCitizenProfile>): Promise<GreenCitizenProfile> {
  const res = await fetch('/api/citizens/pledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    let msg = 'Failed to save citizen pledge';
    if (typeof errorData.detail === 'string') {
      msg = errorData.detail;
    } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
      msg = errorData.detail[0].msg || msg;
    }
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Fetch a citizen profile by citizen ID from the backend.
 */
export async function fetchCitizenProfileApi(citizenId: string): Promise<GreenCitizenProfile> {
  const res = await fetch(`/api/citizens/${encodeURIComponent(citizenId)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch citizen profile (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

/**
 * Update quiz points and completed quizzes count for a citizen in the backend database.
 */
export async function updateCitizenQuizPointsApi(
  citizenId: string, 
  points: number, 
  quizzesCompletedCount: number = 1
): Promise<GreenCitizenProfile> {
  const res = await fetch(`/api/citizens/${encodeURIComponent(citizenId)}/quiz-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points, quizzesCompletedCount })
  });
  if (!res.ok) {
    throw new Error(`Failed to update quiz points (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetch official verified certificate data and calculated impacts for a citizen from the backend.
 */
export async function fetchCitizenCertificateApi(citizenId: string): Promise<CitizenCertificateData> {
  const res = await fetch(`/api/citizens/${encodeURIComponent(citizenId)}/certificate`);
  if (!res.ok) {
    throw new Error(`Failed to fetch citizen certificate (${res.status}): ${res.statusText}`);
  }
  return res.json();
}

export interface RoofAssessmentRequest {
  address?: string;
  monthlyBill?: number;
  roofAreaSqFt?: number;
  state?: string;
  roofType?: string;
  obstacles?: string;
  panelType?: string;
}

export interface RoofAssessmentData {
  recommendedCapacityKw: number;
  estimatedCost: number;
  centralSubsidy: number;
  netCost: number;
  annualGenerationUnits: number;
  annualSavings: number;
  paybackYears: number;
  co2OffsetAnnualKg: number;
  treesEquivalent: number;
  roofSuitabilityScore: number;
  orientationRecommendation: string;
  shadingAnalysis: string;
  inverterRecommendation: string;
  discomNotice: string;
  aiNotes: string;
}

export interface RoofAssessmentResponse {
  success: boolean;
  data: RoofAssessmentData;
  source: string;
}

/**
 * Perform AI Rooftop solar potential assessment via FastAPI backend (powered by Gemini with MNRE fallback).
 */
export async function assessRoofApi(payload: RoofAssessmentRequest): Promise<RoofAssessmentData> {
  const res = await fetch('/api/ai/assess-roof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Roof assessment failed (${res.status}): ${res.statusText}`);
  }
  const result: RoofAssessmentResponse = await res.json();
  return result.data;
}

export interface CarbonFootprintCalculationRequest {
  systemCapacityKw: number;
  yearsInstalled: number;
  monthlyUnitsKwh: number;
  commuteMode: string;
  dailyCommuteKm: number;
  dietPreference: string;
  householdMembers: number;
}

export interface CarbonFootprintCalculationResponse {
  success: boolean;
  annualSolarUnits: number;
  totalUnitsGenerated: number;
  annualSolarOffsetKg: number;
  totalCo2OffsetKg: number;
  totalCo2OffsetTonnes: string;
  treesEquivalent: number;
  coalSavedKg: number;
  carKmOffset: number;
  annualHouseholdUnits: number;
  annualElectricityEmissionsKg: number;
  annualCommuteKm: number;
  annualTransportEmissionsKg: number;
  annualWasteDietEmissionsKg: number;
  annualGrossEmissionsKg: number;
  netAnnualBalanceKg: number;
  isNetZeroOrNegative: boolean;
  gridEmissionFactorUsed: number;
  dataSource: string;
}

/**
 * Calculate household carbon footprint and rooftop solar offsets via FastAPI
 * using Central Electricity Authority (CEA) 0.82 kg CO2/kWh national grid baseline.
 */
export async function calculateCarbonFootprintApi(
  payload: CarbonFootprintCalculationRequest
): Promise<CarbonFootprintCalculationResponse> {
  const res = await fetch('/api/carbon/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Carbon calculation failed (${res.status}): ${res.statusText}`);
  }
  return res.json();
}


