import React, { useState, useEffect } from 'react';
import { ShieldCheck, Star, PhoneCall, MapPin, CheckCircle2, Send, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { CertifiedSolarInstaller, IndianStateSolarData } from '../types';
import { fetchInstallers, fetchStates, submitQuoteRequest } from '../services/api';
import confetti from 'canvas-confetti';

interface InstallersDirectoryProps {
  selectedStateCode: string;
  setSelectedStateCode: (code: string) => void;
}

export const InstallersDirectory: React.FC<InstallersDirectoryProps> = ({
  selectedStateCode,
  setSelectedStateCode,
}) => {
  const [installers, setInstallers] = useState<CertifiedSolarInstaller[]>([]);
  const [states, setStates] = useState<IndianStateSolarData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState<string>('all');
  const [selectedInstallerForQuote, setSelectedInstallerForQuote] = useState<CertifiedSolarInstaller | null>(null);
  
  // Quote form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientPincode, setClientPincode] = useState('');
  const [estimatedKw, setEstimatedKw] = useState('3 kW');
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteSubmitError, setQuoteSubmitError] = useState<string | null>(null);
  const [quoteSuccessMessage, setQuoteSuccessMessage] = useState<string>('');

  // Load states on mount
  useEffect(() => {
    fetchStates()
      .then(setStates)
      .catch((err) => console.warn('Could not load states for directory filter:', err));
  }, []);

  // Fetch installers whenever filters change (with 250ms debounce on search)
  const loadInstallers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchInstallers({
        state: selectedStateCode,
        badge: selectedBadgeFilter,
        search: searchQuery
      });
      setInstallers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load certified installers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadInstallers();
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [selectedStateCode, selectedBadgeFilter, searchQuery]);

  const handleOpenQuote = (installer: CertifiedSolarInstaller) => {
    setSelectedInstallerForQuote(installer);
    setQuoteSubmitted(false);
    setQuoteSubmitError(null);
    setQuoteSuccessMessage('');
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallerForQuote) return;

    setIsSubmittingQuote(true);
    setQuoteSubmitError(null);

    try {
      const res = await submitQuoteRequest({
        installerId: selectedInstallerForQuote.id,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientCity: clientCity.trim(),
        pincode: clientPincode.trim(),
        stateCode: selectedStateCode !== 'ALL' ? selectedStateCode : undefined,
        estimatedKw,
      });

      setQuoteSuccessMessage(res.message);
      setQuoteSubmitted(true);

      // Trigger celebration confetti only after backend confirmation
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (confettiErr) {
        console.warn('Confetti effect failed:', confettiErr);
      }
    } catch (err: any) {
      setQuoteSubmitError(err.message || 'Failed to submit quote request. Please try again.');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-0.5 rounded-full text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>MNRE & DISCOM Empanelled Solar Vendors</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Connect with <span className="text-emerald-600">Certified Local Installers</span>
          </h2>
          <p className="text-xs text-stone-600">
            Book verified site surveys, end-to-end DISCOM net-metering approvals, and PM Surya Ghar direct subsidy installation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-600 font-medium">State Filter:</span>
          <select
            value={selectedStateCode}
            onChange={(e) => setSelectedStateCode(e.target.value)}
            className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-emerald-800 font-bold focus:outline-none shadow-2xs cursor-pointer"
          >
            <option value="ALL">All India (Pan-India)</option>
            {states.map(st => (
              <option key={st.code} value={st.code}>{st.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search installer by company name, brand, or feature..."
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['all', 'National EPC Leader', 'MNRE Empanelled', 'DISCOM Approved Tier-1'].map((badge) => (
            <button
              key={badge}
              onClick={() => setSelectedBadgeFilter(badge)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedBadgeFilter === badge
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              {badge === 'all' ? 'All Vendors' : badge}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-sm space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-stone-700">Loading certified installers from SQLite database...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Could not load installers</span>
          </div>
          <p className="text-xs text-amber-700">{error}</p>
          <button
            onClick={loadInstallers}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Installers Cards Grid */}
      {!isLoading && !error && installers.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-sm space-y-2">
          <p className="text-sm font-bold text-stone-800">No installers match your filter.</p>
          <p className="text-xs text-stone-500">Try changing the state filter to "All India" or clearing the search query.</p>
        </div>
      )}

      {!isLoading && !error && installers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {installers.map((inst) => (
            <div
              key={inst.id}
              className="bg-white border border-stone-200 hover:border-emerald-400 rounded-2xl p-5 shadow-sm space-y-4 transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Top Badge & Rating */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {inst.badge}
                  </span>
                  <div className="flex items-center gap-1 bg-stone-50 px-2 py-0.5 rounded-lg border border-stone-200 text-xs">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-stone-900">{inst.rating}</span>
                    <span className="text-[10px] text-stone-500">({inst.reviewsCount})</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                    {inst.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span>HQ: {inst.headquarters}</span>
                  </div>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-[10px] text-stone-500 block">Avg Sizing Rate</span>
                  <span className="font-bold text-stone-900 font-mono">
                    ~₹{inst.avgQuotePerKw.toLocaleString('en-IN')}/kW
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Completed Projects</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {inst.completedInstallations.toLocaleString('en-IN')}+
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-1.5 text-xs text-stone-700">
                {inst.features.slice(0, 3).map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Bank Loan Note */}
              <div className="text-[10px] text-stone-600 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                <span className="text-emerald-800 font-semibold">Finance:</span> {inst.financePartner}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                <a
                  href={`tel:${inst.contactPhone}`}
                  className="flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 py-2 rounded-xl text-xs font-semibold transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Vendor</span>
                </a>

                <button
                  onClick={() => handleOpenQuote(inst)}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <span>Get Free Quote</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote / Survey Booking Modal */}
      {selectedInstallerForQuote && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedInstallerForQuote(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 text-lg cursor-pointer"
            >
              ✕
            </button>

            {!quoteSubmitted ? (
              <form onSubmit={handleQuoteSubmit} className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1">
                    DIRECT DISCOM EMPANELLED PARTNER
                  </span>
                  <h3 className="text-xl font-bold text-stone-900">
                    Book Free Doorstep Site Survey
                  </h3>
                  <p className="text-xs text-stone-600">
                    Requesting verified quotation from <strong className="text-stone-900">{selectedInstallerForQuote.name}</strong>
                  </p>
                </div>

                {quoteSubmitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Submission Error</span>
                      <span>{quoteSubmitError}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Ankit Verma"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Mobile Number (WhatsApp - 10 digits)</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">City / District</label>
                      <input
                        type="text"
                        required
                        value={clientCity}
                        onChange={(e) => setClientCity(e.target.value)}
                        placeholder="e.g. Noida / Pune"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1">PIN Code (6 digits)</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={clientPincode}
                        onChange={(e) => setClientPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="e.g. 110001"
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">Estimated Rooftop Solar Size</label>
                    <select
                      value={estimatedKw}
                      onChange={(e) => setEstimatedKw(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    >
                      <option value="2 kW">2 kW (Saves ~₹1,800/mo - ₹60,000 Subsidy)</option>
                      <option value="3 kW">3 kW (Most Popular - Max ₹78,000 Subsidy)</option>
                      <option value="5 kW">5 kW (Large Villa / Multi-floor)</option>
                      <option value="10 kW">10 kW (Commercial / Farmhouse)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingQuote}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {isSubmittingQuote ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Quote Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Free Survey & Quotation</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-stone-900">Survey Request Submitted!</h3>
                <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                  {quoteSuccessMessage || (
                    <>
                      Thank you, <strong>{clientName}</strong>. An engineer from <strong>{selectedInstallerForQuote.name}</strong> will contact you on <strong>{clientPhone}</strong> to schedule a shadow-free drone or physical rooftop site audit.
                    </>
                  )}
                </p>
                <div className="inline-flex items-center gap-2 bg-stone-50 border border-stone-200 text-stone-600 text-[11px] font-medium py-1 px-3 rounded-lg mx-auto">
                  <span>PIN Code: <strong>{clientPincode}</strong></span>
                  <span>•</span>
                  <span>City: <strong>{clientCity}</strong></span>
                </div>
                <div>
                  <button
                    onClick={() => setSelectedInstallerForQuote(null)}
                    className="bg-stone-900 hover:bg-stone-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all mt-2 cursor-pointer shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
