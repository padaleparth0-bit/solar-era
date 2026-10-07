import { GreenCitizenProfile, EcoRecommendation } from '../types';
import { 
  saveCitizenPledgeApi, 
  fetchCitizenProfileApi, 
  updateCitizenQuizPointsApi, 
  fetchCitizenCertificateApi,
  CitizenCertificateData
} from '../services/api';

/**
 * Key stored in browser localStorage.
 * STRICT REQUIREMENT: Only the citizen's unique ID is remembered in localStorage.
 * All profile data, pledges, quiz scores, and certificate records are fetched from the backend citizens table.
 */
const CITIZEN_ID_KEY = 'solar_era_citizen_id';

// Clean up legacy entire-profile storage if present
try {
  const legacyProfile = localStorage.getItem('solar_era_green_citizen_profile');
  if (legacyProfile && !localStorage.getItem(CITIZEN_ID_KEY)) {
    const parsed = JSON.parse(legacyProfile);
    if (parsed?.id) {
      localStorage.setItem(CITIZEN_ID_KEY, parsed.id);
    }
  }
  localStorage.removeItem('solar_era_green_citizen_profile');
} catch (e) {
  // Ignore localStorage migration errors
}

export const DEFAULT_CITIZEN_PROFILE: GreenCitizenProfile = {
  id: '',
  fullName: 'Rahul Sharma',
  email: 'rahul.sharma@example.com',
  phone: '+91 98765 43210',
  city: 'New Delhi',
  stateCode: 'DL',
  housingType: 'independent_house',
  householdMembers: 4,
  monthlyElectricityBill: 3800,
  monthlyUnitsKwh: 480,
  solarSystemKw: 3.3,
  hasEv: false,
  dailyCommuteKm: 22,
  commuteMode: 'petrol_diesel',
  dietPreference: 'vegetarian',
  registeredAt: '2026-01-15',
  certificateId: 'IND-GC-2026-PENDING',
  totalQuizScore: 0,
  quizzesCompletedCount: 0,
  completedActionIds: ['rec-1'],
  unlockedBadgeIds: ['b1']
};

export const INITIAL_ECO_RECOMMENDATIONS: EcoRecommendation[] = [
  {
    id: 'rec-1',
    category: 'Solar & Energy',
    title: 'Install 3.3 kW Rooftop Solar under PM Surya Ghar',
    impact: 'Offset ~3,800 kg CO2 / year and save ₹28,000+ annually',
    annualSavingsRupees: 28000,
    difficulty: 'High Impact',
    description: 'Claim up to ₹78,000 Direct Bank Subsidy and zero-collateral loan at ~7% to achieve complete electricity bill freedom.',
    isCompleted: true
  },
  {
    id: 'rec-2',
    category: 'Appliances & Efficiency',
    title: 'Upgrade 3 Ceiling Fans to 5-Star BLDC Motor Models',
    impact: 'Save ~450 kWh / year (370 kg CO2 avoided)',
    annualSavingsRupees: 3400,
    difficulty: 'Easy',
    description: 'BLDC fans consume just 28W instead of 75W, run silent, and operate seamlessly on solar inverter power.',
    isCompleted: false
  },
  {
    id: 'rec-3',
    category: 'Mobility & EV',
    title: 'Switch Daily Commute to Solar-Charged Electric 2-Wheeler',
    impact: 'Eliminate ~850 kg CO2 tailpipe emissions & save ₹24,000 in fuel',
    annualSavingsRupees: 24000,
    difficulty: 'Medium',
    description: 'Charge your e-scooter using daytime solar surplus for virtually zero-cost transportation across city commutes.',
    isCompleted: false
  },
  {
    id: 'rec-4',
    category: 'Water & Terrace',
    title: 'Setup Rooftop Rainwater Harvesting with Filtration Pit',
    impact: 'Recharge ~45,000 Litres groundwater annually',
    annualSavingsRupees: 4200,
    difficulty: 'Medium',
    description: 'Direct rooftop runoff into recharge borewells to elevate neighborhood water tables and reduce municipal pump strain.',
    isCompleted: false
  },
  {
    id: 'rec-5',
    category: 'Waste & Lifestyle',
    title: 'Terrace Wet Waste Composting & Urban Herb Garden',
    impact: 'Divert 200 kg bio-waste from urban landfills',
    annualSavingsRupees: 1800,
    difficulty: 'Easy',
    description: 'Aerobic earthen khamba composting turns kitchen scraps into rich black gold for potted vegetables and cools roof slabs.',
    isCompleted: false
  },
  {
    id: 'rec-6',
    category: 'Solar & Energy',
    title: 'Install Smart Bi-Directional Net-Meter & Surge Protection',
    impact: 'Monetize excess solar export with monthly DISCOM bill rollover',
    annualSavingsRupees: 6500,
    difficulty: 'Easy',
    description: 'Ensure Type-2 Surge Protection Devices (SPD) and proper dual chemical earthing pits for 25+ years of trouble-free generation.',
    isCompleted: false
  }
];

// In-memory cache for synchronous render cycles
let inMemoryProfile: GreenCitizenProfile = { ...DEFAULT_CITIZEN_PROFILE };

/**
 * Read the device's remembered citizen ID from localStorage.
 */
export function getStoredCitizenId(): string | null {
  try {
    return localStorage.getItem(CITIZEN_ID_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Remember the citizen's unique ID on this device.
 */
export function setStoredCitizenId(id: string): void {
  try {
    localStorage.setItem(CITIZEN_ID_KEY, id);
  } catch (e) {
    console.error('Failed to set citizen ID in localStorage:', e);
  }
}

/**
 * Synchronous accessor for fast initial component mounting.
 */
export function getStoredProfile(): GreenCitizenProfile {
  return inMemoryProfile;
}

/**
 * Fetch the citizen profile from the backend database.
 * If a citizen ID is saved in localStorage, it queries the citizens table.
 * If not recognized, it automatically registers an initial profile to obtain a unique ID and certificate.
 */
export async function fetchStoredProfile(): Promise<GreenCitizenProfile> {
  const citizenId = getStoredCitizenId();

  if (citizenId) {
    try {
      const remote = await fetchCitizenProfileApi(citizenId);
      inMemoryProfile = remote;
      window.dispatchEvent(new CustomEvent('solar_citizen_profile_updated', { detail: remote }));
      return remote;
    } catch (err) {
      console.warn(`Could not load citizen ${citizenId} from backend, initializing new pledge:`, err);
    }
  }

  // If no citizen ID or ID was not found, create a new citizen row in the backend citizens table
  try {
    const created = await saveCitizenPledgeApi({
      fullName: inMemoryProfile.fullName || DEFAULT_CITIZEN_PROFILE.fullName,
      email: inMemoryProfile.email || DEFAULT_CITIZEN_PROFILE.email,
      phone: inMemoryProfile.phone || DEFAULT_CITIZEN_PROFILE.phone,
      city: inMemoryProfile.city || DEFAULT_CITIZEN_PROFILE.city,
      stateCode: inMemoryProfile.stateCode || DEFAULT_CITIZEN_PROFILE.stateCode,
      housingType: inMemoryProfile.housingType || DEFAULT_CITIZEN_PROFILE.housingType,
      householdMembers: inMemoryProfile.householdMembers || DEFAULT_CITIZEN_PROFILE.householdMembers,
      monthlyElectricityBill: inMemoryProfile.monthlyElectricityBill || DEFAULT_CITIZEN_PROFILE.monthlyElectricityBill,
      monthlyUnitsKwh: inMemoryProfile.monthlyUnitsKwh || DEFAULT_CITIZEN_PROFILE.monthlyUnitsKwh,
      solarSystemKw: inMemoryProfile.solarSystemKw || DEFAULT_CITIZEN_PROFILE.solarSystemKw,
      hasEv: inMemoryProfile.hasEv || DEFAULT_CITIZEN_PROFILE.hasEv,
      dailyCommuteKm: inMemoryProfile.dailyCommuteKm || DEFAULT_CITIZEN_PROFILE.dailyCommuteKm,
      commuteMode: inMemoryProfile.commuteMode || DEFAULT_CITIZEN_PROFILE.commuteMode,
      dietPreference: inMemoryProfile.dietPreference || DEFAULT_CITIZEN_PROFILE.dietPreference,
    });
    setStoredCitizenId(created.id);
    inMemoryProfile = created;
    window.dispatchEvent(new CustomEvent('solar_citizen_profile_updated', { detail: created }));
    return created;
  } catch (err) {
    console.error('Failed to initialize citizen on backend:', err);
    return inMemoryProfile;
  }
}

/**
 * Save Green Citizen pledge directly to the backend database citizens table.
 * The backend generates and assigns the unique certificate ID.
 * Only the citizen's unique ID is kept in localStorage.
 */
export async function saveStoredProfile(profile: Partial<GreenCitizenProfile>): Promise<GreenCitizenProfile> {
  const currentId = getStoredCitizenId() || profile.id;

  try {
    const payload = {
      ...profile,
      id: currentId || undefined
    };
    const saved = await saveCitizenPledgeApi(payload);
    
    // Remember only the ID in localStorage
    setStoredCitizenId(saved.id);
    inMemoryProfile = saved;
    window.dispatchEvent(new CustomEvent('solar_citizen_profile_updated', { detail: saved }));
    return saved;
  } catch (err) {
    console.error('Error saving citizen pledge to backend:', err);
    throw err;
  }
}

/**
 * Persist earned quiz points and quiz completion count to the backend citizens table.
 */
export async function recordQuizPoints(points: number, quizzesCount: number = 1): Promise<GreenCitizenProfile> {
  let citizenId = getStoredCitizenId();

  if (!citizenId) {
    const profile = await fetchStoredProfile();
    citizenId = profile.id;
  }

  try {
    const updated = await updateCitizenQuizPointsApi(citizenId, points, quizzesCount);
    inMemoryProfile = updated;
    window.dispatchEvent(new CustomEvent('solar_citizen_profile_updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.error('Error recording quiz points to backend:', err);
    throw err;
  }
}

/**
 * Fetch verified certificate record directly from backend.
 */
export async function fetchCertificateData(citizenId?: string): Promise<CitizenCertificateData> {
  const id = citizenId || getStoredCitizenId() || inMemoryProfile.id;
  if (!id) {
    const profile = await fetchStoredProfile();
    return fetchCitizenCertificateApi(profile.id);
  }
  return fetchCitizenCertificateApi(id);
}

// Auto-trigger background profile synchronization on initial module load
if (typeof window !== 'undefined') {
  fetchStoredProfile().catch((err) => {
    console.warn('Initial background citizen fetch error:', err);
  });
}
