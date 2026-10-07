import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  IndianRupee, 
  Sun, 
  Zap, 
  TrendingUp, 
  Building2 
} from 'lucide-react';
import { SolarCalculationInput, SolarCalculationResult, IndianStateSolarData } from '../types';
import { calculateSolarPotential } from '../data/solarData';
import { fetchStates } from '../services/api';

interface SolarCalculatorProps {
  selectedStateCode: string;
  setSelectedStateCode: (code: string) => void;
}

export const SolarCalculator: React.FC<SolarCalculatorProps> = ({
  selectedStateCode,
  setSelectedStateCode,
}) => {
  const [states, setStates] = useState<IndianStateSolarData[]>([]);
  const [address, setAddress] = useState('Sector 62, Noida / Bengaluru / Mumbai');
  const [pincode, setPincode] = useState('201309');
  const [monthlyBill, setMonthlyBill] = useState(3800);
  const [roofAreaSqFt, setRoofAreaSqFt] = useState(450);
  const [roofType, setRoofType] = useState<'rcc_flat' | 'tin_metal_shed' | 'tile_roof' | 'asbestos_shed'>('rcc_flat');
  const [panelType, setPanelType] = useState<'mono_perc_540' | 'bifacial_550' | 'poly_335'>('mono_perc_540');
  const [shadingCondition, setShadingCondition] = useState<'none' | 'light' | 'moderate' | 'heavy'>('none');
  const [batteryStorageNeeded, setBatteryStorageNeeded] = useState(false);

  useEffect(() => {
    fetchStates()
      .then(setStates)
      .catch((err) => console.warn('Could not load states in calculator:', err));
  }, []);

  const currentState = states.find(s => s.code === selectedStateCode) || states[0] || {
    code: 'DL',
    name: 'Delhi (NCT)',
    avgTariffPerKwh: 6.8,
    discoms: ['BSES Rajdhani (BRPL)', 'BSES Yamuna (BYPL)', 'Tata Power DDL (TPDDL)']
  };


  const calculationInput: SolarCalculationInput = {
    address,
    pincode,
    stateCode: selectedStateCode,
    monthlyBill,
    roofAreaSqFt,
    panelType,
    roofType,
    shadingCondition,
    batteryStorageNeeded,
  };

  // State holds the calculation results returned from the FastAPI backend
  const [results, setResults] = useState<SolarCalculationResult>(() => {
    // Initial fallback calculation
    return calculateSolarPotential(calculationInput);
  });
  const [isCalculating, setIsCalculating] = useState(false);

  // Call the backend POST /api/calculate endpoint with debounce
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        setIsCalculating(true);
        const response = await fetch('/api/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calculationInput),
          signal: controller.signal,
        });

        if (response.ok) {
          const data: SolarCalculationResult = await response.json();
          setResults(data);
        } else {
          setResults(calculateSolarPotential(calculationInput));
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setResults(calculateSolarPotential(calculationInput));
        }
      } finally {
        setIsCalculating(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    address,
    pincode,
    selectedStateCode,
    monthlyBill,
    roofAreaSqFt,
    panelType,
    roofType,
    shadingCondition,
    batteryStorageNeeded
  ]);


  // Quick Indian City Presets
  const cityPresets = [
    { name: 'Delhi NCR', state: 'DL', avgBill: 4200, area: 500 },
    { name: 'Mumbai', state: 'MH', avgBill: 5500, area: 400 },
    { name: 'Bengaluru', state: 'KA', avgBill: 3500, area: 450 },
    { name: 'Ahmedabad', state: 'GJ', avgBill: 3800, area: 600 },
    { name: 'Lucknow', state: 'UP', avgBill: 3600, area: 550 },
    { name: 'Hyderabad', state: 'TG', avgBill: 4000, area: 480 },
    { name: 'Jaipur', state: 'RJ', avgBill: 3400, area: 650 },
    { name: 'Chennai', state: 'TN', avgBill: 3900, area: 420 },
  ];

  const handleApplyPreset = (preset: typeof cityPresets[0]) => {
    setSelectedStateCode(preset.state);
    setAddress(`${preset.name}, India`);
    setMonthlyBill(preset.avgBill);
    setRoofAreaSqFt(preset.area);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero Headline */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1 rounded-full text-xs font-semibold shadow-xs">
          <Sun className="w-3.5 h-3.5 text-emerald-600" />
          <span>India’s Precision Rooftop Solar & PM Surya Ghar Calculator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          Calculate Your <span className="text-emerald-600">Solar Energy Savings</span> & Government Subsidy
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          Accurate estimation for Indian homeowners based on DISCOM tariff slabs, local solar insolation, and the central 
          <strong className="text-stone-900 font-semibold"> PM Surya Ghar Muft Bijli Yojana</strong> (up to ₹78,000 direct bank transfer).
        </p>
      </div>

      {/* City Presets Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs text-stone-500 whitespace-nowrap font-medium">Quick Presets:</span>
        {cityPresets.map((preset) => (
          <button
            key={preset.name}
            id={`preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => handleApplyPreset(preset)}
            className="text-xs px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 transition-colors whitespace-nowrap shadow-xs font-medium"
          >
            📍 {preset.name}
          </button>
        ))}
      </div>

      {/* Main Grid: Inputs on Left, Real-time Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Inputs Form */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <span>Rooftop & Consumption Details</span>
            </h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold border border-emerald-200">
              ₹ INR
            </span>
          </div>

          {/* Location & DISCOM info */}
          <div className="space-y-4">
            <div>
              <label htmlFor="input-address" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Rooftop Address / Colony
              </label>
              <input
                id="input-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Sector 62, Noida or Koramangala, Bengaluru"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="input-pincode" className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Pin Code
                </label>
                <input
                  id="input-pincode"
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 560034"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label htmlFor="input-state-select" className="block text-xs font-semibold text-stone-700 mb-1.5">
                  State / DISCOM
                </label>
                <select
                  id="input-state-select"
                  value={selectedStateCode}
                  onChange={(e) => setSelectedStateCode(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors cursor-pointer"
                >
                  {(states.length > 0 ? states : [currentState]).map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name} (₹{st.avgTariffPerKwh}/u)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current DISCOM note */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-[11px] text-stone-700 space-y-1">
              <div className="flex items-center justify-between text-emerald-800 font-semibold">
                <span>DISCOMs in {currentState.name}:</span>
                <span className="text-emerald-700 font-bold">Avg Tariff: ₹{currentState.avgTariffPerKwh}/unit</span>
              </div>
              <p className="text-stone-600">
                {currentState.discoms.join(', ')}
              </p>
            </div>
          </div>

          {/* Monthly Electricity Bill Slider */}
          <div className="space-y-2 bg-stone-50/80 p-4 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <label htmlFor="bill-range" className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                <span>Monthly Electricity Bill</span>
              </label>
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg font-bold text-sm border border-emerald-200">
                <span>₹</span>
                <input
                  id="bill-number-input"
                  type="number"
                  value={monthlyBill}
                  min={500}
                  max={50000}
                  step={100}
                  onChange={(e) => setMonthlyBill(Math.max(Number(e.target.value), 500))}
                  className="w-20 bg-transparent text-emerald-800 font-bold focus:outline-none text-right"
                />
              </div>
            </div>
            <input
              id="bill-range"
              type="range"
              min={1000}
              max={30000}
              step={200}
              value={monthlyBill}
              onChange={(e) => setMonthlyBill(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>₹1,000</span>
              <span>₹10,000</span>
              <span>₹20,000</span>
              <span>₹30,000+</span>
            </div>
          </div>

          {/* Available Rooftop Area Slider */}
          <div className="space-y-2 bg-stone-50/80 p-4 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <label htmlFor="area-range" className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Shadow-Free Roof Area</span>
              </label>
              <span className="bg-white text-stone-800 px-2.5 py-1 rounded-lg font-bold text-xs font-mono border border-stone-200 shadow-2xs">
                {roofAreaSqFt} sq.ft (~{Math.round(roofAreaSqFt / 10.76)} m²)
              </span>
            </div>
            <input
              id="area-range"
              type="range"
              min={100}
              max={2500}
              step={25}
              value={roofAreaSqFt}
              onChange={(e) => setRoofAreaSqFt(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>100 sq.ft</span>
              <span>800 sq.ft</span>
              <span>1,500 sq.ft</span>
              <span>2,500 sq.ft</span>
            </div>
          </div>

          {/* Roof Type & Panel Technology */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="select-roof-type" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Roof Construction
              </label>
              <select
                id="select-roof-type"
                value={roofType}
                onChange={(e) => setRoofType(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              >
                <option value="rcc_flat">Flat RCC Terrace (Most Common)</option>
                <option value="tin_metal_shed">Pitched Metal / Tin Shed</option>
                <option value="tile_roof">Clay Tile Roof</option>
                <option value="asbestos_shed">Asbestos Sheet Shed</option>
              </select>
            </div>

            <div>
              <label htmlFor="select-panel-type" className="block text-xs font-semibold text-stone-700 mb-1.5">
                Panel Technology
              </label>
              <select
                id="select-panel-type"
                value={panelType}
                onChange={(e) => setPanelType(e.target.value as any)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-xs text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              >
                <option value="mono_perc_540">Mono PERC 540W (Recommended)</option>
                <option value="bifacial_550">Bifacial TopCon 550W (+15% gain)</option>
                <option value="poly_335">Polycrystalline 335W (Budget)</option>
              </select>
            </div>
          </div>

          {/* Hybrid Battery Toggle */}
          <div className="flex items-center justify-between bg-stone-50 p-3.5 rounded-xl border border-stone-200">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Add Battery Storage (Hybrid System)</span>
              </div>
              <p className="text-[11px] text-stone-500">
                Provides backup power during city power outages.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={batteryStorageNeeded}
                onChange={(e) => setBatteryStorageNeeded(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Right Column: Calculated Savings, Subsidy & ROI Breakdown */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Key Highlights Box */}
          <div className="bg-white border-2 border-emerald-500/30 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            {/* Subtle Green Flare Effect */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-50 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Recommended System Sizing
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-center gap-2">
                  <span>{results.recommendedCapacityKw} kW</span>
                  <span className="text-sm font-medium text-stone-500">
                    ({results.panelCount} panels × {panelType === 'mono_perc_540' ? '540W' : panelType === 'bifacial_550' ? '550W' : '335W'})
                  </span>
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs text-stone-500 block">Required Roof Space</span>
                <span className="text-sm font-bold text-stone-800">
                  ~{results.requiredAreaSqFt} sq.ft ({Math.round(results.requiredAreaSqFt / 10.76)} m²)
                </span>
              </div>
            </div>

            {/* Price & Subsidy Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
              {/* Total Cost */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
                <span className="text-[11px] text-stone-500 block">Total System Cost</span>
                <span className="text-lg font-bold text-stone-900">
                  ₹{results.totalSystemCost.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Turnkey with mounting & inverter</span>
              </div>

              {/* PM Surya Ghar Subsidy (Highlighted in Emerald) */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 relative">
                <span className="absolute -top-2 right-2 bg-emerald-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full shadow-xs">
                  Govt DBT
                </span>
                <span className="text-[11px] text-emerald-800 block font-bold">
                  PM Surya Ghar Subsidy
                </span>
                <span className="text-lg font-extrabold text-emerald-700">
                  - ₹{results.centralSubsidy.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Direct to Bank Account</span>
              </div>

              {/* Net Payable Out of Pocket */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5">
                <span className="text-[11px] text-teal-800 block font-bold">
                  Net Out-of-Pocket Cost
                </span>
                <span className="text-xl font-extrabold text-teal-900">
                  ₹{results.netPayableCost.toLocaleString('en-IN')}
                </span>
                {results.stateSubsidy > 0 && (
                  <span className="text-[10px] text-teal-700 block mt-0.5 font-medium">
                    Includes ₹{results.stateSubsidy.toLocaleString('en-IN')} State Subsidy
                  </span>
                )}
                {results.stateSubsidy === 0 && (
                  <span className="text-[10px] text-stone-500 block mt-0.5">After central subsidy</span>
                )}
              </div>
            </div>

            {/* Generation & Savings Meters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 rounded-xl p-4 border border-stone-200">
              <div>
                <span className="text-[11px] text-stone-500 block">Daily Generation</span>
                <span className="text-base font-bold text-emerald-700">
                  ~{results.dailyGenerationUnits} Units/day
                </span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">Monthly Savings</span>
                <span className="text-base font-bold text-emerald-700">
                  ₹{results.monthlySavings.toLocaleString('en-IN')}/mo
                </span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">Annual Savings</span>
                <span className="text-base font-bold text-emerald-700">
                  ₹{results.annualSavings.toLocaleString('en-IN')}/yr
                </span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">Payback ROI</span>
                <span className="text-base font-bold text-teal-800">
                  {results.paybackPeriodYears} Years
                </span>
              </div>
            </div>

            {/* 25-Year Lifetime Savings Banner */}
            <div className="mt-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-stone-600 font-semibold block">
                    Estimated 25-Year Lifetime Savings:
                  </span>
                  <span className="text-xl font-extrabold text-emerald-800">
                    ₹{results.twentyFiveYearSavings.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-stone-500 max-w-xs text-right">
                Assumes 3.5% annual grid electricity tariff inflation. 25-year panel warranty.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
