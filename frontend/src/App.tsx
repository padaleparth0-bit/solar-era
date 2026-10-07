import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SolarCalculator } from './components/SolarCalculator';
import { RoofVisualizer } from './components/RoofVisualizer';
import { CarbonFootprintTracker } from './components/CarbonFootprintTracker';
import { InstallersDirectory } from './components/InstallersDirectory';
import { QuizzesAndMyths } from './components/QuizzesAndMyths';
import { GovernmentSchemes } from './components/GovernmentSchemes';
import { Sun, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('calculator');
  const [selectedStateCode, setSelectedStateCode] = useState<string>('DL');

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-stone-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedStateCode={selectedStateCode}
        setSelectedStateCode={setSelectedStateCode}
      />

      {/* Main App Content View Switcher */}
      <main className="flex-1 pb-16">
        {activeTab === 'calculator' && (
          <SolarCalculator
            selectedStateCode={selectedStateCode}
            setSelectedStateCode={setSelectedStateCode}
          />
        )}

        {activeTab === 'visualizer' && (
          <RoofVisualizer
            selectedStateCode={selectedStateCode}
          />
        )}

        {activeTab === 'carbon' && (
          <CarbonFootprintTracker />
        )}

        {activeTab === 'installers' && (
          <InstallersDirectory
            selectedStateCode={selectedStateCode}
            setSelectedStateCode={setSelectedStateCode}
          />
        )}

        {(activeTab === 'quizzes' || activeTab === 'quiz') && (
          <QuizzesAndMyths />
        )}

        {activeTab === 'schemes' && (
          <GovernmentSchemes
            selectedStateCode={selectedStateCode}
            setSelectedStateCode={setSelectedStateCode}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-10 px-4 sm:px-6 lg:px-8 text-xs text-stone-600 shadow-inner">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Brand column */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black shadow-md">
                  <Sun className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-black tracking-tight text-stone-900">
                  Solar<span className="text-emerald-600">Era</span>
                </span>
              </div>
              <p className="text-stone-500 leading-relaxed text-[11px]">
                Empowering Indian homeowners with precision rooftop solar calculations, PM Surya Ghar DBT subsidies, certified installer networks, and zero-emission tracking.
              </p>
            </div>

            {/* National Clean Energy Targets */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">India Clean Energy Vision</h4>
              <ul className="space-y-1.5 text-stone-600 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>1 Crore Rooftops (PM Surya Ghar)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>500 GW Non-Fossil Capacity by 2030</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>50% Cumulative Power from Renewables</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Net Zero Emissions Target 2070</span>
                </li>
              </ul>
            </div>

            {/* Government Resources */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Official Indian Portals</h4>
              <ul className="space-y-1.5 text-stone-600 text-[11px]">
                <li>
                  <a href="https://pmsuryaghar.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-emerald-600 font-medium transition-colors">
                    <span>National PM Surya Ghar Portal</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>
                  <a href="https://solarrooftop.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-emerald-600 font-medium transition-colors">
                    <span>MNRE SPIN Portal</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>
                  <a href="https://mnre.gov.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-emerald-600 font-medium transition-colors">
                    <span>Ministry of New & Renewable Energy</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
                <li>
                  <a href="https://sbi.co.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-emerald-600 font-medium transition-colors">
                    <span>SBI Surya Ghar Concessional Loan</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Disclaimer */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Disclaimer</h4>
              <p className="text-[10px] text-stone-500 leading-normal">
                Disclaimer: Estimates are modeled on MNRE benchmark pricing, state DISCOM tariff schedules, and standard solar insolation (4.5 - 5.5 kWh/m²/day). Final quotes may vary based on rooftop shadow factors and vendor specifications.
              </p>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-6 flex flex-wrap items-center justify-between gap-4 text-[11px] text-stone-500">
            <div>
              © {new Date().getFullYear()} Solar Era. Dedicated to India's Clean Energy & Net Zero 2070 Vision.
            </div>
            <div className="flex items-center gap-4">
              <span>Made with ❤️ for Indian Homeowners</span>
              <span>•</span>
              <span>Mission LiFE (Lifestyle for Environment)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
