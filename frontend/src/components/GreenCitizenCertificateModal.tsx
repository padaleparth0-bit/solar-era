import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  Share2, 
  CheckCircle2, 
  TreePine, 
  Zap, 
  Globe, 
  Sun, 
  Flame, 
  Printer 
} from 'lucide-react';
import { GreenCitizenProfile, IndianStateSolarData } from '../types';
import { fetchStates, CitizenCertificateData } from '../services/api';
import { fetchCertificateData } from '../utils/citizenStorage';
import { Loader2 } from 'lucide-react';

interface GreenCitizenCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: GreenCitizenProfile;
  totalCo2SavedKg: number;
  treesEquivalent: number;
  coalSavedKg: number;
  totalUnitsGenerated: number;
}

export const GreenCitizenCertificateModal: React.FC<GreenCitizenCertificateModalProps> = ({
  isOpen,
  onClose,
  profile,
  totalCo2SavedKg,
  treesEquivalent,
  coalSavedKg,
  totalUnitsGenerated,
}) => {
  const [copied, setCopied] = useState(false);
  const [states, setStates] = useState<IndianStateSolarData[]>([]);
  const [backendCert, setBackendCert] = useState<CitizenCertificateData | null>(null);
  const [isLoadingBackend, setIsLoadingBackend] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch state list
      fetchStates()
        .then(setStates)
        .catch((err) => console.warn('Could not load states for certificate:', err));

      // Fetch official verified certificate record from backend database
      setIsLoadingBackend(true);
      fetchCertificateData(profile?.id)
        .then((data) => {
          setBackendCert(data);
          setIsLoadingBackend(false);
        })
        .catch((err) => {
          console.warn('Backend certificate lookup fallback to props:', err);
          setIsLoadingBackend(false);
        });
    }
  }, [isOpen, profile?.id]);

  if (!isOpen) return null;

  const stateObj = states.find(s => s.code === (backendCert?.stateCode || profile.stateCode));
  const stateName = backendCert?.stateName || (stateObj ? stateObj.name : 'India');
  const activeCo2 = backendCert ? backendCert.totalCo2SavedKg : totalCo2SavedKg;
  const co2Tonnes = (activeCo2 / 1000).toFixed(2);
  const activeTrees = backendCert ? backendCert.treesEquivalent : treesEquivalent;
  const activeCoal = backendCert ? backendCert.coalSavedKg : coalSavedKg;
  const activeUnits = backendCert ? backendCert.totalUnitsGenerated : totalUnitsGenerated;
  const activeCertificateId = backendCert?.certificateId || profile.certificateId || 'IND-GC-2026-ACTIVE';
  const activeName = backendCert?.fullName || profile.fullName || 'Rahul Sharma';
  const activeCity = backendCert?.city || profile.city;
  const activeRegistration = backendCert?.registeredAt || profile.registeredAt || '2026';

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `🌱 I just earned my official Green Citizen of India Certificate (${activeCertificateId}) with Solar Era! ☀️ Solar Offset: ${co2Tonnes} Tonnes of CO2, ${activeTrees} Trees planted equivalent. #PM_SuryaGhar #MissionLiFE #SolarEra`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Green Citizen Certificate',
          text,
          url: window.location.href,
        });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white border border-emerald-200 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-xl relative my-8 print:border-none print:shadow-none print:bg-white print:text-black print:max-w-none print:p-0">
        {/* Close Button - Hidden in Print */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors p-1.5 rounded-full hover:bg-stone-100 print:hidden cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* PRINTABLE CERTIFICATE CONTAINER */}
        <div 
          id="green-citizen-certificate"
          className="relative bg-gradient-to-b from-emerald-50/50 via-white to-emerald-50/30 border-4 border-double border-emerald-600/70 rounded-2xl p-7 text-center space-y-5 text-stone-800 shadow-inner overflow-hidden print:border-4 print:border-emerald-700 print:bg-white print:text-stone-900"
        >
          {/* Subtle Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <Sun className="w-96 h-96 text-emerald-600" />
          </div>

          {/* Top National Header & Badges */}
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
            <div className="flex items-center gap-2 text-left">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-black">
                ☀️
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-800 block">
                  GOVERNMENT OF INDIA ALIGNED
                </span>
                <span className="text-[9px] text-stone-500">
                  Mission LiFE & PM Surya Ghar Scheme
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase font-mono text-stone-500 block">Certificate No:</span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {activeCertificateId}
              </span>
              {isLoadingBackend && (
                <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 print:hidden">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> Verifying...
                </span>
              )}
            </div>
          </div>

          {/* Seal Graphic */}
          <div className="flex justify-center my-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-2 border-emerald-500 text-emerald-700">
                <ShieldCheck className="w-9 h-9" />
              </div>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-widest font-extrabold text-emerald-700">
              NATIONAL GREEN CITIZENSHIP RECOGNITION
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 print:text-stone-900">
              Certificate of Green Citizenship
            </h2>
            <p className="text-xs text-stone-600 print:text-stone-600 max-w-lg mx-auto">
              Awarded in appreciation of outstanding personal commitment to decentralized solar energy adoption, carbon mitigation, and India's Panchamrit 2070 Net-Zero Mission.
            </p>
          </div>

          {/* Citizen Name Spotlight */}
          <div className="py-2 border-y border-stone-200 print:border-stone-300 space-y-1">
            <span className="text-xs text-stone-500 print:text-stone-600">This certifies that</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-800 print:text-emerald-800 tracking-wide">
              {activeName}
            </h3>
            <span className="text-xs text-stone-600 print:text-stone-600 block">
              Resident of <strong>{activeCity}, {stateName}</strong>
            </span>
          </div>

          {/* Core Environmental Impact Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
            <div className="bg-white p-3 rounded-xl border border-stone-200 print:border-stone-300 shadow-2xs">
              <div className="flex items-center gap-1.5 text-emerald-700 print:text-emerald-700 text-xs font-bold mb-1">
                <Globe className="w-3.5 h-3.5" />
                <span>CO2 Offset</span>
              </div>
              <span className="text-lg font-extrabold font-mono text-stone-900 print:text-stone-900 block">
                {co2Tonnes} T
              </span>
              <span className="text-[10px] text-stone-500 print:text-stone-600">Greenhouse gas</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-stone-200 print:border-stone-300 shadow-2xs">
              <div className="flex items-center gap-1.5 text-emerald-700 print:text-emerald-700 text-xs font-bold mb-1">
                <TreePine className="w-3.5 h-3.5" />
                <span>Trees Equiv</span>
              </div>
              <span className="text-lg font-extrabold font-mono text-emerald-700 print:text-emerald-700 block">
                {activeTrees.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-stone-500 print:text-stone-600">Mature forest trees</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-stone-200 print:border-stone-300 shadow-2xs">
              <div className="flex items-center gap-1.5 text-emerald-700 print:text-emerald-700 text-xs font-bold mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Clean Energy</span>
              </div>
              <span className="text-lg font-extrabold font-mono text-stone-900 print:text-stone-900 block">
                {activeUnits.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-stone-500 print:text-stone-600">kWh Units Generated</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-stone-200 print:border-stone-300 shadow-2xs">
              <div className="flex items-center gap-1.5 text-emerald-700 print:text-emerald-700 text-xs font-bold mb-1">
                <Flame className="w-3.5 h-3.5" />
                <span>Coal Saved</span>
              </div>
              <span className="text-lg font-extrabold font-mono text-stone-900 print:text-stone-900 block">
                {activeCoal.toLocaleString('en-IN')} kg
              </span>
              <span className="text-[10px] text-stone-500 print:text-stone-600">Thermal fuel unburned</span>
            </div>
          </div>

          {/* Verification & Signatures Bar */}
          <div className="flex items-center justify-between text-left text-[11px] pt-3 border-t border-stone-200 print:border-stone-300 text-stone-500 print:text-stone-600">
            <div>
              <span className="font-bold text-stone-800 print:text-stone-800 block">Solar Era Verification Council</span>
              <span className="text-[10px]">National Green Citizen Program</span>
            </div>

            <div className="text-center">
              <div className="inline-block px-3 py-1 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 print:text-emerald-800 text-[10px] font-mono font-bold">
                ★ VERIFIED GREEN CITIZEN ★
              </div>
              <span className="block text-[9px] mt-0.5">Registration: {activeRegistration}</span>
            </div>

            <div className="text-right">
              <span className="font-bold text-stone-800 print:text-stone-800 block">Date of Issue</span>
              <span className="text-[10px]">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Controls - Hidden in Print */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Official digital credential for Indian residential solar champions</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                copied 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-102 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
