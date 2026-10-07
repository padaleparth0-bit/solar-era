import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, X, CheckCircle2, MapPin, User, Mail, Phone, Sun, Award, Loader2, AlertCircle } from 'lucide-react';
import { GreenCitizenProfile, IndianStateSolarData } from '../types';
import { fetchStates } from '../services/api';
import { saveStoredProfile } from '../utils/citizenStorage';
import confetti from 'canvas-confetti';

interface GreenCitizenModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: GreenCitizenProfile;
  onProfileUpdated: (updated: GreenCitizenProfile) => void;
}

export const GreenCitizenModal: React.FC<GreenCitizenModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
  const [formData, setFormData] = useState<GreenCitizenProfile>({ ...profile });
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [states, setStates] = useState<IndianStateSolarData[]>([]);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...profile });
      setErrorMessage(null);
    }
  }, [isOpen, profile]);

  useEffect(() => {
    fetchStates()
      .then(setStates)
      .catch((err) => console.warn('Could not load states in citizen modal:', err));
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Save pledge to backend citizens table which generates the unique certificate ID
      const saved = await saveStoredProfile(formData);
      setFormData(saved);
      onProfileUpdated(saved);
      setIsSubmittedSuccess(true);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#3b82f6']
        });
      } catch (e) {}

      setTimeout(() => {
        setIsSubmittedSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sync Green Citizen profile with backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-emerald-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 border-b border-stone-100 pb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                National Green Registry
              </span>
              <span className="text-xs text-stone-500">Panchamrit 2070</span>
            </div>
            <h3 className="text-xl font-extrabold text-stone-900 mt-1">
              Green Citizen Registration & Progress Tracker
            </h3>
            <p className="text-xs text-stone-600">
              Register your profile to track solar offsets, monitor your personal carbon balance, take quizzes, and earn an official verified certificate.
            </p>
          </div>
        </div>

        {isSubmittedSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-xl font-bold text-stone-900">
              Profile Registered & Synced!
            </h4>
            <p className="text-xs text-emerald-700 font-mono font-bold">
              Certificate ID: {formData.certificateId || 'IND-GC-2026-ACTIVE'}
            </p>
            <p className="text-xs text-stone-600 max-w-sm mx-auto">
              Your solar generation, quiz milestones, and emission reduction achievements are now permanently linked.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Personal Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-stone-700 font-semibold mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-stone-700 font-semibold mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Email Address *</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-stone-700 font-semibold mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mobile Phone (Optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-stone-700 font-semibold mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>City & State *</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. New Delhi"
                    className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <select
                    value={formData.stateCode}
                    onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                    className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-2 text-emerald-800 font-semibold focus:outline-none focus:bg-white"
                  >
                    {states.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Household & Solar Energy Details */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-emerald-600" />
                <span>Household Energy & Solar Adoption</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-stone-700 block mb-1">Housing Type:</label>
                  <select
                    value={formData.housingType}
                    onChange={(e) => setFormData({ ...formData, housingType: e.target.value as any })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none"
                  >
                    <option value="independent_house">Independent House (RCC Roof)</option>
                    <option value="villa">Row House / Villa</option>
                    <option value="apartment_society">Apartment Society (RWA)</option>
                    <option value="farmhouse">Farmhouse / Rural</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-700 block mb-1">Family Members:</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={formData.householdMembers}
                    onChange={(e) => setFormData({ ...formData, householdMembers: Number(e.target.value) || 1 })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-stone-700 block mb-1">Monthly Bill (₹):</label>
                  <input
                    type="number"
                    step={100}
                    min={0}
                    value={formData.monthlyElectricityBill}
                    onChange={(e) => {
                      const bill = Number(e.target.value);
                      setFormData({ 
                        ...formData, 
                        monthlyElectricityBill: bill,
                        monthlyUnitsKwh: Math.round(bill / 7.5)
                      });
                    }}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-emerald-700 font-bold font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-stone-700 block mb-1">Rooftop Solar Installed:</label>
                  <select
                    value={formData.solarSystemKw}
                    onChange={(e) => setFormData({ ...formData, solarSystemKw: Number(e.target.value) })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-emerald-700 font-bold focus:outline-none"
                  >
                    <option value={0}>Not yet installed (Planning to install)</option>
                    <option value={1}>1 kW System (~4 units/day)</option>
                    <option value={2}>2 kW System (~8 units/day)</option>
                    <option value={3.3}>3.3 kW System (~14 units/day - Standard)</option>
                    <option value={5}>5 kW System (~21 units/day)</option>
                    <option value={10}>10 kW System (~42 units/day)</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-700 block mb-1">Commute & Mobility Mode:</label>
                  <select
                    value={formData.commuteMode}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      commuteMode: e.target.value as any,
                      hasEv: e.target.value === 'ev'
                    })}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none"
                  >
                    <option value="petrol_diesel">Petrol / Diesel Car</option>
                    <option value="ev">Electric Vehicle (EV / E-Scooter)</option>
                    <option value="public_metro">Metro & Public Transit</option>
                    <option value="two_wheeler">Petrol Two-Wheeler</option>
                  </select>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100">
              <span className="text-[11px] text-stone-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Backend verified Green Citizen ID & Certificate</span>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-102 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Syncing with Database...</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4" />
                      <span>Save & Sync Citizen Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
