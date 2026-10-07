import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  TreePine, 
  Award, 
  Flame, 
  Car, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Globe,
  Zap,
  Edit3,
  Lightbulb,
  PlusCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GreenCitizenProfile, EcoRecommendation } from '../types';
import { getStoredProfile, saveStoredProfile, fetchStoredProfile, INITIAL_ECO_RECOMMENDATIONS } from '../utils/citizenStorage';
import { calculateCarbonFootprintApi, CarbonFootprintCalculationResponse } from '../services/api';
import { GreenCitizenModal } from './GreenCitizenModal';
import { GreenCitizenCertificateModal } from './GreenCitizenCertificateModal';

export const CarbonFootprintTracker: React.FC = () => {
  const [profile, setProfile] = useState<GreenCitizenProfile>(getStoredProfile());
  const [yearsInstalled, setYearsInstalled] = useState(2.5);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [recommendations, setRecommendations] = useState<EcoRecommendation[]>(INITIAL_ECO_RECOMMENDATIONS);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiCustomSummary, setAiCustomSummary] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [backendMetrics, setBackendMetrics] = useState<CarbonFootprintCalculationResponse | null>(null);

  // Sync profile when updated anywhere in app and fetch on mount
  useEffect(() => {
    fetchStoredProfile()
      .then(setProfile)
      .catch((err) => console.warn('Could not load citizen profile in carbon tracker:', err));

    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
      }
    };
    window.addEventListener('solar_citizen_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('solar_citizen_profile_updated', handleProfileUpdate);
  }, []);

  const systemCapacityKw = profile.solarSystemKw || 3.3;

  // Fetch carbon footprint metrics from FastAPI backend using CEA baseline factor (0.82 kg CO2/kWh)
  useEffect(() => {
    let isMounted = true;
    calculateCarbonFootprintApi({
      systemCapacityKw,
      yearsInstalled,
      monthlyUnitsKwh: profile.monthlyUnitsKwh || 450,
      commuteMode: profile.commuteMode || 'petrol_diesel',
      dailyCommuteKm: profile.dailyCommuteKm || 20,
      dietPreference: profile.dietPreference || 'vegetarian',
      householdMembers: profile.householdMembers || 4,
    })
      .then((data) => {
        if (isMounted) {
          setBackendMetrics(data);
        }
      })
      .catch((err) => {
        console.warn('Backend carbon calculation notice (using local calculation):', err);
      });

    return () => {
      isMounted = false;
    };
  }, [
    systemCapacityKw,
    yearsInstalled,
    profile.monthlyUnitsKwh,
    profile.commuteMode,
    profile.dailyCommuteKm,
    profile.dietPreference,
    profile.householdMembers,
  ]);

  // 1. Solar Generation & Offset (1 kW in India ~ 1,450 kWh/year)
  const annualSolarUnits = backendMetrics ? backendMetrics.annualSolarUnits : Math.round(systemCapacityKw * 1450);
  const totalUnitsGenerated = backendMetrics ? backendMetrics.totalUnitsGenerated : Math.round(annualSolarUnits * yearsInstalled);
  
  // Grid emission factor for India: 0.82 kg CO2 / kWh (CEA Baseline Database)
  const totalCo2OffsetKg = backendMetrics ? backendMetrics.totalCo2OffsetKg : Math.round(totalUnitsGenerated * 0.82);
  const annualSolarOffsetKg = backendMetrics ? backendMetrics.annualSolarOffsetKg : Math.round(annualSolarUnits * 0.82);
  const totalCo2OffsetTonnes = backendMetrics ? backendMetrics.totalCo2OffsetTonnes : (totalCo2OffsetKg / 1000).toFixed(2);
  
  // 1 mature tree absorbs ~20 kg CO2 / year
  const treesEquivalent = backendMetrics ? backendMetrics.treesEquivalent : Math.round(totalCo2OffsetKg / 20);
  // 0.45 kg thermal coal burned per kWh
  const coalSavedKg = backendMetrics ? backendMetrics.coalSavedKg : Math.round(totalUnitsGenerated * 0.45);
  // Car distance offset
  const carKmOffset = backendMetrics ? backendMetrics.carKmOffset : Math.round(totalCo2OffsetKg * 5.26);

  // 2. Individual Annual Gross Footprint Breakdown (Baseline consumption)
  const annualHouseholdUnits = backendMetrics ? backendMetrics.annualHouseholdUnits : (profile.monthlyUnitsKwh || 450) * 12;
  const annualElectricityEmissionsKg = backendMetrics ? backendMetrics.annualElectricityEmissionsKg : Math.round(annualHouseholdUnits * 0.82);
  
  // Transportation emissions
  const commuteFactor = profile.commuteMode === 'ev' 
    ? 0.03 
    : profile.commuteMode === 'two_wheeler' 
    ? 0.07 
    : profile.commuteMode === 'public_metro' 
    ? 0.02 
    : 0.19; // petrol car
  const annualCommuteKm = backendMetrics ? backendMetrics.annualCommuteKm : (profile.dailyCommuteKm || 20) * 300;
  const annualTransportEmissionsKg = backendMetrics ? backendMetrics.annualTransportEmissionsKg : Math.round(annualCommuteKm * commuteFactor);

  // Diet & Household Waste factor
  const annualWasteDietEmissionsKg = backendMetrics 
    ? backendMetrics.annualWasteDietEmissionsKg 
    : (profile.dietPreference === 'vegetarian' ? 700 : 1200) * (profile.householdMembers || 4);

  // Total gross household emissions per year
  const annualGrossEmissionsKg = backendMetrics 
    ? backendMetrics.annualGrossEmissionsKg 
    : annualElectricityEmissionsKg + annualTransportEmissionsKg + annualWasteDietEmissionsKg;
  
  // Net Personal Carbon Balance (Gross - Solar Offsets)
  const netAnnualBalanceKg = backendMetrics ? backendMetrics.netAnnualBalanceKg : annualGrossEmissionsKg - annualSolarOffsetKg;
  const isNetZeroOrNegative = backendMetrics ? backendMetrics.isNetZeroOrNegative : netAnnualBalanceKg <= 0;

  // Badges
  const badges = [
    {
      id: 'b1',
      title: 'Solar Pioneer',
      threshold: '1 Tonne CO2',
      description: 'Offset your first 1,000 kg of greenhouse gas emissions.',
      unlocked: totalCo2OffsetKg >= 1000,
      icon: '🌱',
    },
    {
      id: 'b2',
      title: 'Forest Guardian',
      threshold: '100 Trees Equiv',
      description: 'Planted the equivalent of 100 mature absorbing trees.',
      unlocked: treesEquivalent >= 100,
      icon: '🌳',
    },
    {
      id: 'b3',
      title: 'Coal Eliminator',
      threshold: '2,000 kg Coal',
      description: 'Prevented 2 tonnes of toxic thermal coal combustion.',
      unlocked: coalSavedKg >= 2000,
      icon: '⛏️',
    },
    {
      id: 'b4',
      title: 'Surya Mitra Champion',
      threshold: '5 Tonnes CO2',
      description: 'Achieved elite Net-Zero residential carbon neutrality status.',
      unlocked: totalCo2OffsetKg >= 5000,
      icon: '☀️',
    },
    {
      id: 'b5',
      title: 'Diamond Green Legend',
      threshold: '10 Tonnes CO2',
      description: 'Lifetime sustainability pioneer for clean Indian skies.',
      unlocked: totalCo2OffsetKg >= 10000,
      icon: '💎',
    },
  ];

  const handleToggleAction = (recId: string) => {
    const updated = recommendations.map(r => {
      if (r.id === recId) {
        return { ...r, isCompleted: !r.isCompleted };
      }
      return r;
    });
    setRecommendations(updated);

    const completedIds = updated.filter(r => r.isCompleted).map(r => r.id);
    const updatedProfile: GreenCitizenProfile = {
      ...profile,
      completedActionIds: completedIds
    };
    setProfile(updatedProfile);
    saveStoredProfile(updatedProfile);

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 }
      });
    } catch (e) {}
  };

  const handleGenerateAiEcoRoadmap = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/personalized-eco-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          footprintSummary: {
            annualGrossEmissionsKg,
            annualSolarOffsetKg,
            netAnnualBalanceKg,
            totalCo2OffsetTonnes,
            treesEquivalent
          }
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
        if (data.summary) {
          setAiCustomSummary(data.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching AI eco advice:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleOpenCertificate = () => {
    setShowCertificateModal(true);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6']
      });
    } catch (e) {}
  };

  const filteredRecommendations = selectedCategoryFilter === 'all'
    ? recommendations
    : recommendations.filter(r => r.category === selectedCategoryFilter);

  const completedCount = recommendations.filter(r => r.isCompleted).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Citizen Profile Banner & Registration Action */}
      <div className="bg-white border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-extrabold shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-stone-900">
                {profile.fullName || 'Registered Green Citizen'}
              </h3>
              <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                {profile.certificateId || 'ID: IND-GC-ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-stone-600">
              Location: <strong>{profile.city}, {profile.stateCode}</strong> • Solar: <strong>{systemCapacityKw} kW System</strong> • Quizzes Completed: <strong>{profile.quizzesCompletedCount || 0}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold transition-all hover:text-emerald-800 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Edit / Register Profile</span>
          </button>
          
          <button
            onClick={handleOpenCertificate}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>Green Citizen Certificate</span>
          </button>
        </div>
      </div>

      {/* Main Header & Description */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-0.5 rounded-full text-xs font-semibold shadow-2xs">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Solar Emissions & Personal Carbon Footprint Ledger</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Personal <span className="text-emerald-600">Carbon Balance & Solar Ledger</span>
          </h2>
          <p className="text-xs text-stone-600">
            Track individual electricity, mobility, and solar emissions offsets aligned with India's National Clean Energy Goals (Panchamrit 2070).
          </p>
        </div>

        {/* Timeline Duration Selector */}
        <div className="flex items-center gap-2 bg-white border border-stone-200 p-1.5 rounded-xl text-xs shadow-2xs">
          <label className="text-stone-600 font-medium px-1">Solar Active Period:</label>
          <select
            value={yearsInstalled}
            onChange={(e) => setYearsInstalled(Number(e.target.value))}
            className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-emerald-700 font-bold focus:outline-none cursor-pointer"
          >
            <option value={0.5}>6 Months</option>
            <option value={1}>1 Year</option>
            <option value={2.5}>2.5 Years (Current)</option>
            <option value={5}>5 Years</option>
            <option value={10}>10 Years</option>
            <option value={25}>25 Years (Lifetime)</option>
          </select>
        </div>
      </div>

      {/* Main Environmental Impact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CO2 Emissions Avoided */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-700">
            <Globe className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              Emissions
            </span>
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-mono block">
            {totalCo2OffsetTonnes} <span className="text-base text-stone-600 font-sans">Tonnes</span>
          </span>
          <span className="text-xs font-semibold text-stone-900 block">
            CO2 Greenhouse Gases Avoided
          </span>
          <p className="text-[11px] text-stone-600">
            {totalCo2OffsetKg.toLocaleString('en-IN')} kg of carbon dioxide eliminated through {systemCapacityKw} kW rooftop solar.
          </p>
        </div>

        {/* Trees Equivalent */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-700">
            <TreePine className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              Forestry
            </span>
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 font-mono block">
            {treesEquivalent.toLocaleString('en-IN')} <span className="text-base text-stone-600 font-sans">Trees</span>
          </span>
          <span className="text-xs font-semibold text-stone-900 block">
            Equivalent Trees Planted
          </span>
          <p className="text-[11px] text-stone-600">
            Equal to the carbon absorption of a dense forest grove of {treesEquivalent} trees growing for 1 year.
          </p>
        </div>

        {/* Coal Combustion Prevented */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-700">
            <Flame className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full border border-stone-200">
              Fossil Fuel
            </span>
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-stone-800 font-mono block">
            {coalSavedKg.toLocaleString('en-IN')} <span className="text-base text-stone-600 font-sans">kg</span>
          </span>
          <span className="text-xs font-semibold text-stone-900 block">
            Thermal Coal Unburned
          </span>
          <p className="text-[11px] text-stone-600">
            Saved thermal power plants from burning dirty coal, preventing heavy smog and toxic PM2.5 emissions.
          </p>
        </div>

        {/* Car Distance Offset */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-teal-700">
            <Car className="w-6 h-6" />
            <span className="text-[10px] uppercase font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
              Clean Mobility
            </span>
          </div>
          <span className="text-3xl sm:text-4xl font-extrabold text-teal-700 font-mono block">
            {carKmOffset.toLocaleString('en-IN')} <span className="text-base text-stone-600 font-sans">km</span>
          </span>
          <span className="text-xs font-semibold text-stone-900 block">
            Petrol Car Distance Offset
          </span>
          <p className="text-[11px] text-stone-600">
            Equivalent to driving across India {Math.max(1, Math.round(carKmOffset / 3200))} times without tailpipe emissions.
          </p>
        </div>
      </div>

      {/* INDIVIDUAL CARBON FOOTPRINT & SOLAR EMISSIONS BALANCE BREAKDOWN */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" /> Individual Household Annual Footprint vs Solar Balance
            </span>
            <h3 className="text-xl font-extrabold text-stone-900 mt-1">
              Your Annual Emissions Balance
            </h3>
          </div>

          <div className={`px-4 py-2 rounded-xl border text-right ${
            isNetZeroOrNegative 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-stone-50 border-stone-200 text-stone-800'
          }`}>
            <span className="text-[10px] uppercase tracking-wider block font-semibold">Net Annual Status</span>
            <span className="text-base font-extrabold font-mono">
              {isNetZeroOrNegative ? '🌿 100% Net Zero Champion' : `+${(netAnnualBalanceKg / 1000).toFixed(2)} Tonnes CO2 Net`}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gross Household Emissions */}
          <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-3">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
              1. Gross Annual Emissions
            </span>
            <div className="space-y-1.5 text-xs text-stone-700">
              <div className="flex justify-between">
                <span className="text-stone-500">Home Grid Power ({annualHouseholdUnits} kWh):</span>
                <span className="font-mono font-semibold text-stone-800">{annualElectricityEmissionsKg.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Daily Commute ({profile.commuteMode.replace('_', ' ')}):</span>
                <span className="font-mono font-semibold text-stone-800">{annualTransportEmissionsKg.toLocaleString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Food & Waste ({profile.householdMembers} persons):</span>
                <span className="font-mono font-semibold text-stone-800">{annualWasteDietEmissionsKg.toLocaleString()} kg</span>
              </div>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-rose-700 text-xs">
              <span>Total Gross Baseline:</span>
              <span className="font-mono">{(annualGrossEmissionsKg / 1000).toFixed(2)} Tonnes/yr</span>
            </div>
          </div>

          {/* Solar Emissions Offset */}
          <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl space-y-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              2. Solar Clean Energy Offset
            </span>
            <div className="space-y-1.5 text-xs text-stone-700">
              <div className="flex justify-between">
                <span className="text-stone-500">Rooftop Solar Rating:</span>
                <span className="font-mono font-semibold text-stone-800">{systemCapacityKw} kW Peak</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Clean Units Generated:</span>
                <span className="font-mono font-semibold text-stone-800">~{annualSolarUnits.toLocaleString()} kWh/yr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Thermal Grid Factor (India):</span>
                <span className="font-mono font-semibold text-stone-800">0.82 kg CO2 / kWh</span>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-emerald-700 text-xs">
              <span>Solar CO2 Eliminated:</span>
              <span className="font-mono">-{(annualSolarOffsetKg / 1000).toFixed(2)} Tonnes/yr</span>
            </div>
          </div>

          {/* Net Carbon Balance & Action summary */}
          <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2.5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                3. Net Footprint & Climate Target
              </span>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {isNetZeroOrNegative 
                  ? `Congratulations! Your ${systemCapacityKw} kW rooftop solar generates more clean energy than your household's total emissions, making you a certified carbon-negative leader in ${profile.city}!`
                  : `Your ${systemCapacityKw} kW solar offsets ${( (annualSolarOffsetKg / annualGrossEmissionsKg) * 100 ).toFixed(0)}% of your gross household emissions. Check our AI suggestions below to reach 100% Net Zero!`}
              </p>
            </div>
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-stone-500">Mission LiFE Tier:</span>
              <span className="font-bold text-emerald-700">
                {isNetZeroOrNegative ? '🌟 Surya Ratna' : '🌱 Green Citizen'}
              </span>
            </div>
          </div>
        </div>

        {/* Official CEA CO2 Baseline Database Citation Banner */}
        <div className="mt-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-700">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Official Emission Factor: 0.82 kg CO₂/kWh</strong> — Central Electricity Authority (CEA), Ministry of Power, Govt. of India (<em>CO₂ Baseline Database for the Indian Power Sector, User Guide Ver. 19/20</em>).
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-300">
            ✓ CEA National Grid Baseline
          </span>
        </div>
      </div>

      {/* WHAT BETTER CAN THEY DO TO CONTRIBUTE TO THE ENVIRONMENT (SUGGESTIONS & ROADMAP) */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Personalized Environmental Action Plan</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 mt-1">
              What Better Can You Do To Contribute?
            </h3>
            <p className="text-xs text-stone-600">
              High-impact, actionable steps tailored to your {profile.city} home, lifestyle, and solar setup to slash emissions and boost green savings.
            </p>
          </div>

          <button
            onClick={handleGenerateAiEcoRoadmap}
            disabled={isAiLoading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAiLoading ? 'Analyzing with Gemini AI...' : '✨ Generate AI Green Roadmap'}</span>
          </button>
        </div>

        {/* AI Custom Summary Box if generated */}
        {aiCustomSummary && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-stone-700 leading-relaxed flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900 block mb-0.5">Surya AI Custom Environmental Analysis:</span>
              <p>{aiCustomSummary}</p>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-1">
          <div className="flex items-center gap-2">
            {['all', 'Solar & Energy', 'Mobility & EV', 'Appliances & Efficiency', 'Water & Terrace', 'Waste & Lifestyle'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === cat
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {cat === 'all' ? '🌿 All Recommendations' : cat}
              </button>
            ))}
          </div>

          <span className="text-xs text-stone-600 whitespace-nowrap hidden sm:inline">
            Completed: <strong className="text-emerald-700">{completedCount}</strong> of <strong>{recommendations.length}</strong>
          </span>
        </div>

        {/* Action Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecommendations.map((rec) => {
            const isDone = rec.isCompleted;
            return (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isDone 
                    ? 'bg-emerald-50/60 border-emerald-400 shadow-xs' 
                    : 'bg-white border-stone-200 hover:border-emerald-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {rec.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      rec.difficulty === 'High Impact' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : rec.difficulty === 'Medium' 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {rec.difficulty}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 leading-snug">
                    {rec.title}
                  </h4>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {rec.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-semibold">{rec.impact}</span>
                    {rec.annualSavingsRupees && (
                      <span className="text-emerald-800 font-mono font-bold">
                        Save ₹{rec.annualSavingsRupees.toLocaleString('en-IN')}/yr
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleAction(rec.id)}
                    className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Action Completed ✓</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark as Completed (+50 Pts)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Environmental Badges Section */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Green Citizen Badges & Milestones</span>
          </h3>
          <span className="text-xs text-stone-600">
            {badges.filter(b => b.unlocked).length} of {badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border transition-all text-center space-y-2 ${
                badge.unlocked
                  ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                  : 'bg-stone-50 border-stone-200 opacity-60'
              }`}
            >
              <div className="text-3xl">{badge.icon}</div>
              <div>
                <h4 className="text-xs font-bold text-stone-900">{badge.title}</h4>
                <span className="text-[10px] text-emerald-700 font-mono font-semibold block">
                  {badge.threshold}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 leading-tight">
                {badge.description}
              </p>
              {badge.unlocked ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Unlocked
                </span>
              ) : (
                <span className="text-[10px] text-stone-500 block">
                  In Progress
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <GreenCitizenModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={profile}
        onProfileUpdated={(updated) => setProfile(updated)}
      />

      <GreenCitizenCertificateModal
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        profile={profile}
        totalCo2SavedKg={totalCo2OffsetKg}
        treesEquivalent={treesEquivalent}
        coalSavedKg={coalSavedKg}
        totalUnitsGenerated={totalUnitsGenerated}
      />
    </div>
  );
};
