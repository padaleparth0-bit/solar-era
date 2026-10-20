import React, { useState, useEffect } from 'react';
import { Sun, Sparkles, ShieldCheck, MapPin, Zap, User, LogIn } from 'lucide-react';
import { IndianStateSolarData } from '../types';
import { fetchStates } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedStateCode: string;
  setSelectedStateCode: (code: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedStateCode,
  setSelectedStateCode,
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [states, setStates] = useState<IndianStateSolarData[]>([]);

  useEffect(() => {
    fetchStates()
      .then(setStates)
      .catch((err) => console.warn('Could not load states in navbar:', err));
  }, []);

  const currentState = states.find(s => s.code === selectedStateCode) || states[0] || {
    code: 'DL',
    name: 'Delhi (NCT)',
    capital: 'New Delhi',
    avgSunHoursPerDay: 5.4,
    avgTariffPerKwh: 6.8,
    discoms: ['BSES Rajdhani (BRPL)', 'BSES Yamuna (BYPL)', 'Tata Power DDL (TPDDL)', 'NDMC'],
    stateSubsidyPerKw: 2000,
    statePolicyHighlight: 'Delhi Solar Policy 2024: Generation-Based Incentive (GBI) of ₹3.00/kWh for 5 years.',
    netMeteringPolicy: '100% Sanctioned Load net metering allowed.',
    portalUrl: 'https://delhisolarportal.delhi.gov.in/'
  };

  const navTabs = [
    { id: 'calculator', label: 'Savings & Subsidy', icon: '🧮' },
    { id: 'visualizer', label: '3D Roof Visualizer', icon: '🛰️' },
    { id: 'carbon', label: 'Eco Footprint', icon: '🌱' },
    { id: 'schemes', label: 'Govt Schemes & Subsidy', icon: '🏛️' },
    { id: 'installers', label: 'Certified Installers', icon: '👷' },
    { id: 'quiz', label: 'Quizzes & Myths', icon: '💡' },
    { id: 'account', label: isAuthenticated ? 'My Account & Cert' : 'Sign In / Account', icon: '👤' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200 text-stone-900 shadow-sm">
      {/* Top National Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white px-4 py-1.5 text-xs font-semibold flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-white/20 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-white/30">
            National Scheme
          </span>
          <span>
            PM Surya Ghar: Muft Bijli Yojana — Claim up to <strong className="text-emerald-100">₹78,000</strong> Direct Bank Subsidy!
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="bg-emerald-800/60 px-2 py-0.5 rounded text-white flex items-center gap-1 font-medium border border-emerald-500/40">
            <ShieldCheck className="w-3 h-3 text-emerald-200" /> MNRE & DISCOM Verified
          </span>
        </div>
      </div>

      {/* Main Nav Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('calculator')} 
          className="flex items-center gap-3 cursor-pointer group"
          id="nav-brand-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Sun className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-stone-900">
                Solar<span className="text-emerald-600">Era</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                India
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">
              AI Rooftop Solar, Savings & PM Surya Ghar Portal
            </p>
          </div>
        </div>

        {/* State Selector & Currency */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1.5 rounded-lg text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <label htmlFor="state-selector" className="text-stone-500 hidden md:inline font-medium">State:</label>
            <select
              id="state-selector"
              value={selectedStateCode}
              onChange={(e) => setSelectedStateCode(e.target.value)}
              className="bg-transparent text-emerald-800 font-semibold focus:outline-none cursor-pointer text-xs"
            >
              {(states.length > 0 ? states : [currentState]).map((st) => (
                <option key={st.code} value={st.code} className="bg-white text-stone-800">
                  {st.name} (₹{st.avgTariffPerKwh}/unit)
                </option>
              ))}
            </select>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50/70 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg text-xs text-stone-700">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Avg Sun: <strong className="text-emerald-700">{currentState.avgSunHoursPerDay} hrs/day</strong></span>
          </div>

          <a
            href="https://pmsuryaghar.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>PM Surya Ghar Portal</span>
          </a>

          {/* User Account / Sign In Button */}
          {isAuthenticated && user ? (
            <button
              onClick={() => setActiveTab('account')}
              className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300/80 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900 transition-all cursor-pointer shadow-xs hover:scale-102"
              title="View your account and certificate"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline max-w-[100px] truncate">{user.fullName.split(' ')[0]}</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                Cert
              </span>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-102 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="border-t border-stone-100 bg-stone-50/60 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-2 py-1.5">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-emerald-700 border border-stone-200 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
