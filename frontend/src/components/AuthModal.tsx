import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sun, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchStates } from '../services/api';
import { IndianStateSolarData } from '../types';
import confetti from 'canvas-confetti';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalTab, closeAuthModal, openAuthModal, login, register } = useAuth();
  
  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);
  const [showPassword, setShowPassword] = useState(false);
  const [states, setStates] = useState<IndianStateSolarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regStateCode, setRegStateCode] = useState('DL');

  useEffect(() => {
    setTab(authModalTab);
    setError(null);
    setSuccessMsg(null);
  }, [authModalTab, authModalOpen]);

  useEffect(() => {
    fetchStates()
      .then(setStates)
      .catch((err) => console.warn('Could not load states in auth modal:', err));
  }, []);

  if (!authModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      setSuccessMsg('Logged in successfully! Welcome back.');
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
      setTimeout(() => {
        closeAuthModal();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register({
        full_name: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim() || undefined,
        city: regCity.trim() || undefined,
        state_code: regStateCode,
      });
      setSuccessMsg('Account created & Green Citizen Certificate issued!');
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
      setTimeout(() => {
        closeAuthModal();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setLoginEmail('rahul.sharma@example.com');
    setLoginPassword('Password123');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden transition-all transform scale-100 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Background */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-6 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close auth dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sun className="w-5 h-5 text-amber-300" />
            </div>
            <span className="text-xs font-bold tracking-wider uppercase bg-white/15 px-2.5 py-0.5 rounded-full border border-white/25">
              Solar Era Portal
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight">
            {tab === 'login' ? 'Welcome Back, Green Citizen' : 'Join India\'s Solar Revolution'}
          </h2>
          <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
            {tab === 'login'
              ? 'Sign in to access your certified rooftop solar dashboard, certificates & quiz rankings.'
              : 'Create your account to claim your Green Citizen ID, PM Surya Ghar DBT tracker & certificates.'}
          </p>

          {/* Tab Pill Switcher */}
          <div className="mt-4 flex bg-emerald-800/40 p-1 rounded-xl border border-white/20">
            <button
              type="button"
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'login'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'register'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {tab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. rahul.sharma@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-stone-700">Password</label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Demo Helper */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[11px] text-stone-500">Need quick testing?</span>
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Fill Demo Credentials
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Phone (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">City</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      placeholder="e.g. New Delhi"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">State</label>
                  <select
                    value={regStateCode}
                    onChange={(e) => setRegStateCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50 text-stone-800"
                  >
                    {states.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automatically generates your verified Green Citizen ID & Certificate!</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Registering Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Claim Certificate</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
