import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle2, Landmark, HelpCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { GovernmentScheme, IndianStateSolarData } from '../types';
import { fetchGovernmentSchemes, fetchStates } from '../services/api';

interface GovernmentSchemesProps {
  selectedStateCode: string;
  setSelectedStateCode: (code: string) => void;
}

export const GovernmentSchemes: React.FC<GovernmentSchemesProps> = ({
  selectedStateCode,
  setSelectedStateCode,
}) => {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [states, setStates] = useState<IndianStateSolarData[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
  const [expandedFaqIdx, setExpandedFaqIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [schemesData, statesData] = await Promise.all([
        fetchGovernmentSchemes(),
        fetchStates()
      ]);
      setSchemes(schemesData);
      setStates(statesData);
      if (schemesData.length > 0 && !selectedSchemeId) {
        setSelectedSchemeId(schemesData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load government schemes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedScheme = schemes.find(s => s.id === selectedSchemeId) || schemes[0];
  const currentState = states.find(s => s.code === selectedStateCode) || states[0];

  const faqs = [
    {
      q: 'Is PM Surya Ghar subsidy given as an upfront discount or bank transfer?',
      a: 'The central subsidy is transferred directly to the homeowner’s Aadhaar-linked bank account (Direct Benefit Transfer - DBT) after net-meter installation and inspection.'
    },
    {
      q: 'Are Made in India (DCR) solar panels mandatory for PM Surya Ghar subsidy?',
      a: 'Yes, MNRE guidelines require Domestic Content Requirement (DCR) solar cells and modules listed under ALMM (Approved List of Models and Manufacturers) to claim subsidy.'
    },
    {
      q: 'Can I apply if I live in a flat or apartment society?',
      a: 'Yes! RWAs and Group Housing Societies (GHS) get ₹18,000 per kW central subsidy (up to 500 kW) for common area lighting, lifts, water pumps, and EV charging stations.'
    },
    {
      q: 'How does the SBI collateral-free loan at ~7% work?',
      a: 'Public sector banks (State Bank of India, Canara, PNB) provide collateral-free rooftop loans up to ₹2 Lakhs with only 10% margin money at concessional repo-linked interest rates.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-0.5 rounded-full text-xs font-semibold shadow-2xs">
            <Landmark className="w-3.5 h-3.5 text-emerald-600" />
            <span>Government of India & State Solar Incentives</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Official Indian <span className="text-emerald-600">Solar Subsidy Programs</span>
          </h2>
          <p className="text-xs text-stone-600">
            Concise guides, eligibility checklists, state top-ups, and direct redirecting links to official government portals.
          </p>
        </div>

        <a
          href="https://pmsuryaghar.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-sm shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer"
        >
          <span>Apply on PM Surya Ghar Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-sm space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-stone-700">Loading verified government schemes from SQLite database...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Unable to load government schemes</span>
          </div>
          <p className="text-xs text-amber-700">{error}</p>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Main Content when loaded */}
      {!isLoading && !error && selectedScheme && (
        <>
          {/* Scheme Selection Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {schemes.map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => setSelectedSchemeId(scheme.id)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  (selectedSchemeId || schemes[0].id) === scheme.id
                    ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                    : 'bg-white border-stone-200 hover:border-emerald-300 text-stone-700 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white border border-stone-200 text-emerald-800 shadow-2xs">
                      {scheme.shortName}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold">
                      Verified
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-900">{scheme.name}</h3>
                </div>
                <p className="text-[11px] text-stone-600 line-clamp-2 mt-2">
                  {scheme.badgeText}
                </p>
              </button>
            ))}
          </div>

          {/* Selected Scheme Deep Dive */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  {selectedScheme.ministry}
                </span>
                <h3 className="text-2xl font-extrabold text-stone-900">
                  {selectedScheme.name}
                </h3>
                <p className="text-xs text-stone-600 max-w-2xl">
                  Target Audience: {selectedScheme.targetAudience}
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-right">
                <span className="text-[10px] uppercase tracking-wider text-emerald-800 block font-bold">
                  Incentive Highlight
                </span>
                <span className="text-xl font-extrabold text-emerald-700 font-mono">
                  {selectedScheme.badgeText}
                </span>
              </div>
            </div>

            {/* Subsidy Structure Slabs Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Subsidy Slabs & Financial Support
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedScheme.subsidyStructure.map((slabItem, idx) => (
                  <div key={idx} className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-stone-900 block">{slabItem.slab}</span>
                    <span className="text-base font-extrabold text-emerald-700 block font-mono">
                      {slabItem.subsidyAmount}
                    </span>
                    <p className="text-[11px] text-stone-600">
                      {slabItem.eligibility}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Benefits & Application Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5 text-xs">
                <span className="font-bold text-stone-900 uppercase tracking-wider block">
                  Key Scheme Benefits
                </span>
                <ul className="space-y-1.5 text-stone-700">
                  {selectedScheme.keyBenefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5 text-xs">
                <span className="font-bold text-stone-900 uppercase tracking-wider block">
                  Application Process Steps
                </span>
                <ul className="space-y-1.5 text-stone-700">
                  {selectedScheme.applicationSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Direct Action Link & Helpline */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-4 text-xs text-stone-600">
                {selectedScheme.helpline && (
                  <span>Helpline: <strong className="text-emerald-700 font-mono font-bold">{selectedScheme.helpline}</strong></span>
                )}
              </div>
              <a
                href={selectedScheme.directApplyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer"
              >
                <span>Direct Application Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </>
      )}

      {/* Common Subsidy FAQs */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>Frequently Asked Questions on Government Subsidies</span>
        </h3>

        <div className="space-y-2 text-xs">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaqIdx === idx;
            return (
              <div key={idx} className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
                <button
                  onClick={() => setExpandedFaqIdx(isExpanded ? null : idx)}
                  className="w-full text-left p-3.5 flex items-center justify-between font-semibold text-stone-800 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-emerald-700 text-sm ml-2 font-mono font-bold">
                    {isExpanded ? '−' : '+'}
                  </span>
                </button>
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 text-stone-600 text-[11px] leading-relaxed border-t border-stone-200 pt-2 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
