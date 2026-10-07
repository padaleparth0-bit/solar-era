export interface IndianStateSolarData {
  code: string;
  name: string;
  capital: string;
  avgSunHoursPerDay: number; // e.g. 5.2
  avgTariffPerKwh: number; // in ₹, e.g. 7.5
  discoms: string[];
  stateSubsidyPerKw?: number; // Additional state-specific subsidy if any
  statePolicyHighlight: string;
  netMeteringPolicy: string;
  portalUrl: string;
}

export interface SolarCalculationInput {
  address: string;
  pincode: string;
  stateCode: string;
  monthlyBill: number; // in ₹ INR
  roofAreaSqFt: number; // available rooftop area
  roofType: 'rcc_flat' | 'tin_metal_shed' | 'tile_roof' | 'asbestos_shed';
  panelType: 'mono_perc_540' | 'bifacial_550' | 'poly_335';
  shadingCondition: 'none' | 'light' | 'moderate' | 'heavy';
  batteryStorageNeeded: boolean;
  sanctionedLoadKw?: number;
}

export interface SolarCalculationResult {
  recommendedCapacityKw: number;
  panelCount: number;
  requiredAreaSqFt: number;
  totalSystemCost: number; // Gross cost in ₹
  centralSubsidy: number; // PM Surya Ghar DBT in ₹
  stateSubsidy: number; // State incentive in ₹
  netPayableCost: number; // Out of pocket cost
  dailyGenerationUnits: number; // kWh units
  monthlyGenerationUnits: number;
  annualGenerationUnits: number;
  monthlyBillBeforeSolar: number;
  estimatedNewMonthlyBill: number;
  monthlySavings: number;
  annualSavings: number;
  twentyFiveYearSavings: number;
  paybackPeriodYears: number;
  co2AnnualOffsetKg: number;
  treesEquivalentAnnual: number;
  coalSavedAnnualKg: number;
  carKmEquivalentAnnual: number;
  sbiLoanEmiEstimate: number; // ~7% p.a. for 5 years
}

export interface RoofObstacle {
  id: string;
  name: string;
  type: 'staircase' | 'watertank' | 'ac_unit' | 'chimney' | 'tree' | 'skylight';
  x: number; // percentage 0-100 on roof
  y: number; // percentage 0-100 on roof
  width: number;
  height: number;
  shadowFactor: number; // 0.1 to 0.8
  structureHeightFt?: number; // e.g. 8ft, 10ft, 12ft for staircase/tank
  rotation?: number; // 0, 90, 180, 270
}

export interface RoofPanelLayout {
  id: string;
  row: number;
  col: number;
  x: number; // px or %
  y: number;
  rotation: number; // deg
  wattage: number;
  isShadowed: boolean;
  isActive: boolean;
}

export interface CertifiedSolarInstaller {
  id: string;
  name: string;
  brand: string;
  badge: 'MNRE Empanelled' | 'DISCOM Approved Tier-1' | 'National EPC Leader' | 'Certified Surya Mitra Partner';
  rating: number;
  reviewsCount: number;
  completedInstallations: number;
  statesServed: string[];
  contactPhone: string;
  email: string;
  locationCity: string;
  headquarters: string;
  avgQuotePerKw: number; // in ₹
  warrantyYears: number;
  financePartner: string;
  features: string[];
  verified: boolean;
}

export interface SolarMyth {
  id: string;
  myth: string;
  fact: string;
  detailedTruth: string;
  category: 'Weather & Monsoon' | 'Cost & Subsidies' | 'Roof & Structure' | 'Battery & Grid' | 'Maintenance';
  icon: string;
}

export interface SolarQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  shortName: string;
  targetAudience: string;
  ministry: string;
  subsidyStructure: {
    slab: string;
    subsidyAmount: string;
    eligibility: string;
  }[];
  keyBenefits: string[];
  applicationSteps: string[];
  officialPortalUrl: string;
  helpline?: string;
  directApplyUrl: string;
  badgeText: string;
}

export interface EcoRecommendation {
  id: string;
  category: 'Solar & Energy' | 'Mobility & EV' | 'Water & Terrace' | 'Appliances & Efficiency' | 'Waste & Lifestyle';
  title: string;
  impact: string; // e.g. "Save ~850 kg CO2 / yr"
  annualSavingsRupees?: number;
  difficulty: 'Easy' | 'Medium' | 'High Impact';
  description: string;
  isCompleted: boolean;
}

export interface GreenCitizenProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  city: string;
  stateCode: string;
  housingType: 'independent_house' | 'villa' | 'apartment_society' | 'farmhouse';
  householdMembers: number;
  monthlyElectricityBill: number; // in ₹
  monthlyUnitsKwh: number; // in kWh
  solarSystemKw: number; // 0 if none yet
  hasEv: boolean;
  dailyCommuteKm: number;
  commuteMode: 'petrol_diesel' | 'ev' | 'public_metro' | 'two_wheeler';
  dietPreference: 'vegetarian' | 'mixed';
  registeredAt: string;
  certificateId: string;
  
  // Progress & Gamification
  totalQuizScore: number;
  quizzesCompletedCount: number;
  completedActionIds: string[];
  unlockedBadgeIds: string[];
}

