import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  ShieldCheck, 
  KeyRound, 
  LogOut, 
  Sparkles, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Sun, 
  Leaf, 
  Calendar, 
  Loader2,
  FileBadge,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchStates, changePassword } from '../services/api';
import { IndianStateSolarData, GreenCitizenProfile } from '../types';
import { getStoredProfile, fetchStoredProfile } from '../utils/citizenStorage';
import { GreenCitizenCertificateModal } from './GreenCitizenCertificateModal';
import confetti from 'canvas-confetti';

interface AccountPageProps {
  onNavigateTab?: (tab: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigateTab }) => {
  const { user, isAuthenticated, isLoading, logout, updateProfile, openAuthModal } = useAuth();
  const [citizenProfile, setCitizenProfile] = useState<GreenCitizenProfile>(getStoredProfile());
  const [states, setStates] = useState<IndianStateSolarData[]>([]);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Edit profile form
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('DL');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchStates()
      .then(setStates)
      .catch((err) => console.warn('Could not load states in account page:', err));
  }, []);

  // Sync profile details
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setCity(user.city || '');
      setStateCode(user.stateCode || 'DL');
    }

    fetchStoredProfile()
      .then(setCitizenProfile)
      .catch((err) => console.warn('Could not fetch citizen profile:', err));

    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setCitizenProfile(e.detail);
      }
    };
    window.addEventListener('solar_citizen_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('solar_citizen_profile_updated', handleProfileUpdate);
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);

    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        stateCode: stateCode.toUpperCase().trim(),
      });
      setProfileMsg({ type: 'success', text: 'Profile updated & synced with your certificate!' });
      setIsEditing(false);
      try {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      } catch {}
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: res.message || 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-stone-600">Loading your account details...</p>
      </div>
    );
  }

  // If not logged in, prompt user to log in or register
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-6">
            <User className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Green Citizen Account Portal
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mb-3">
            Sign In to Manage Your Solar Journey
          </h1>
          <p className="text-sm text-stone-600 max-w-lg mx-auto mb-8 leading-relaxed">
            Access your verified Indian Green Citizen Certificate, PM Surya Ghar subsidy tracker, personalized clean energy savings, and live quiz rankings.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => openAuthModal('login')}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Sign In to Your Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-sm transition-all cursor-pointer"
            >
              Create New Account
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="mt-12 pt-8 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
              <Award className="w-5 h-5 text-emerald-600 mb-2" />
              <h3 className="text-xs font-bold text-stone-900 mb-1">Official Certificate</h3>
              <p className="text-[11px] text-stone-500">Government benchmarked Green Citizen Certificate with unique verification ID.</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
              <Sun className="w-5 h-5 text-amber-500 mb-2" />
              <h3 className="text-xs font-bold text-stone-900 mb-1">Subsidy & Savings</h3>
              <p className="text-[11px] text-stone-500">Track PM Surya Ghar DBT eligibility and real-time generation offsets.</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
              <Leaf className="w-5 h-5 text-teal-600 mb-2" />
              <h3 className="text-xs font-bold text-stone-900 mb-1">Eco Score & Quizzes</h3>
              <p className="text-[11px] text-stone-500">Earn eco-points, climb the leaderboard and unlock green badges.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeCertId = user.certificateId || citizenProfile.certificateId || 'IND-GC-2026-ACTIVE';
  const currentStateObj = states.find(s => s.code === (user.stateCode || citizenProfile.stateCode));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner / User Hero */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.3),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-400 p-0.5 shadow-lg">
              <div className="w-full h-full bg-emerald-900 rounded-[14px] flex items-center justify-center text-2xl font-black text-amber-300">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{user.fullName}</h1>
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  Verified Green Citizen
                </span>
              </div>
              <p className="text-xs text-emerald-200 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </span>
                {user.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {user.city}, {currentStateObj ? currentStateObj.name : user.stateCode}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Member since {user.createdAt || '2026'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCertificateModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-102"
            >
              <FileBadge className="w-4 h-4 text-stone-900" />
              <span>View Official Certificate</span>
            </button>
            <button
              onClick={logout}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Certificate Card + Impact Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Certificate Card Preview */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Citizen Credential
              </span>
              <span className="text-xs font-mono font-bold text-stone-500">
                {activeCertId}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-stone-50 to-emerald-50/40 border border-emerald-100 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Sun className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-stone-900">Green Citizenship of India</h4>
                  <p className="text-[10px] text-stone-500">Mission LiFE & PM Surya Ghar Protocol</p>
                </div>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Awarded to <strong className="text-stone-900">{user.fullName}</strong> in recognition of committing to clean energy transition and greenhouse gas abatement.
              </p>
            </div>

            <div className="space-y-2 text-xs text-stone-600">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Issued To:</span>
                <span className="font-semibold text-stone-900">{user.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">State Jurisdiction:</span>
                <span className="font-semibold text-stone-900">{currentStateObj ? currentStateObj.name : 'All India'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Status:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active & Verified
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowCertificateModal(true)}
            className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileBadge className="w-4 h-4" />
            <span>Open & Share Certificate</span>
          </button>
        </div>

        {/* Impact & Gamification Metrics */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold text-stone-500 tracking-wider">Quiz Points Earned</p>
              <h3 className="text-2xl font-black text-stone-900 mt-0.5">
                {user.totalQuizScore || citizenProfile.totalQuizScore || 0} <span className="text-xs font-semibold text-stone-500">pts</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Completed {user.quizzesCompletedCount || citizenProfile.quizzesCompletedCount || 0} renewable energy quizzes.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold text-stone-500 tracking-wider">Pledged Solar System</p>
              <h3 className="text-2xl font-black text-stone-900 mt-0.5">
                {citizenProfile.solarSystemKw || 3.3} <span className="text-xs font-semibold text-stone-500">kW</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Generates ~{( (citizenProfile.solarSystemKw || 3.3) * 4.3 * 365).toFixed(0)} units (kWh) per year.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold text-stone-500 tracking-wider">Annual CO2 Avoided</p>
              <h3 className="text-2xl font-black text-stone-900 mt-0.5">
                {( (citizenProfile.solarSystemKw || 3.3) * 4.3 * 365 * 0.82 / 1000).toFixed(2)} <span className="text-xs font-semibold text-stone-500">Tonnes</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Based on CEA National Grid baseline factor of 0.82 kg CO2/kWh.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold text-stone-500 tracking-wider">Trees Planted Equivalent</p>
              <h3 className="text-2xl font-black text-stone-900 mt-0.5">
                {Math.round((citizenProfile.solarSystemKw || 3.3) * 4.3 * 365 * 0.82 / 20)} <span className="text-xs font-semibold text-stone-500">Trees</span>
              </h3>
              <p className="text-[11px] text-stone-500 mt-1">
                Lifetime ecological forest preservation impact.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile & Password Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information Form */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Personal Information</h3>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
              >
                Edit Details
              </button>
            )}
          </div>

          {profileMsg && (
            <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              profileMsg.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  disabled={!isEditing}
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isEditing ? 'border-stone-200 bg-white' : 'border-transparent bg-stone-50 text-stone-700'
                  }`}
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-1">This name appears on your official Green Citizen Certificate.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Email (Account ID)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-transparent bg-stone-50 text-stone-500 rounded-xl cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isEditing ? 'border-stone-200 bg-white' : 'border-transparent bg-stone-50 text-stone-700'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">City / Town</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New Delhi"
                    className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isEditing ? 'border-stone-200 bg-white' : 'border-transparent bg-stone-50 text-stone-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">State / Territory</label>
                <select
                  disabled={!isEditing}
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isEditing ? 'border-stone-200 bg-white text-stone-800' : 'border-transparent bg-stone-50 text-stone-700'
                  }`}
                >
                  {states.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {profileSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Profile & Update Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Password / Security Form */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Security & Password</h3>
          </div>

          {passwordMsg && (
            <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              passwordMsg.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {passwordSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>

      {/* Certificate Modal */}
      <GreenCitizenCertificateModal
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        profile={citizenProfile}
        totalCo2SavedKg={Math.round((citizenProfile.solarSystemKw || 3.3) * 4.3 * 365 * 0.82)}
        treesEquivalent={Math.round((citizenProfile.solarSystemKw || 3.3) * 4.3 * 365 * 0.82 / 20)}
        coalSavedKg={Math.round((citizenProfile.solarSystemKw || 3.3) * 4.3 * 365 * 0.45)}
        totalUnitsGenerated={Math.round((citizenProfile.solarSystemKw || 3.3) * 4.3 * 365)}
      />
    </div>
  );
};
