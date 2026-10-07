import React, { useState, useRef, useEffect } from 'react';
import { 
  Compass, 
  RotateCw, 
  Plus, 
  Trash2, 
  Sparkles, 
  MapPin, 
  Clock, 
  Move, 
  Copy, 
  SlidersHorizontal, 
  Building2, 
  Droplets, 
  Trees, 
  Fan,
  X,
  CheckCircle2,
  Zap,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Award,
  Sun
} from 'lucide-react';
import { RoofObstacle, RoofPanelLayout } from '../types';
import { assessRoofApi, RoofAssessmentData } from '../services/api';

interface RoofVisualizerProps {
  selectedStateCode?: string;
}

export const RoofVisualizer: React.FC<RoofVisualizerProps> = ({ selectedStateCode }) => {
  // Address & Map search
  const [addressInput, setAddressInput] = useState('Plot 42, HSR Layout Sector 2, Bengaluru, Karnataka');
  const [activeAddress, setActiveAddress] = useState('Plot 42, HSR Layout Sector 2, Bengaluru, Karnataka');
  const [mapMode, setMapMode] = useState<'blueprint' | 'satellite'>('blueprint');

  // Roof Dimension & Orientation
  const [roofWidthFt, setRoofWidthFt] = useState(30); // 30 feet
  const [roofLengthFt, setRoofLengthFt] = useState(20); // 20 feet
  const [roofTiltDeg, setRoofTiltDeg] = useState(20); // 20 degrees optimal for India
  const [roofAzimuthDeg, setRoofAzimuthDeg] = useState(180); // 180 = True South
  const [timeOfDayHour, setTimeOfDayHour] = useState(12); // 12 PM

  // Panel settings
  const [panelWattage, setPanelWattage] = useState<540 | 550 | 335>(540);
  const [panels, setPanels] = useState<RoofPanelLayout[]>([]);
  const [obstacles, setObstacles] = useState<RoofObstacle[]>([
    { id: 'obs-1', name: 'Staircase Mumty Room', type: 'staircase', x: 68, y: 12, width: 24, height: 26, shadowFactor: 0.7, structureHeightFt: 10 },
    { id: 'obs-2', name: 'Overhead Water Tank', type: 'watertank', x: 12, y: 68, width: 14, height: 14, shadowFactor: 0.5, structureHeightFt: 6 },
  ]);

  const [selectedObstacleId, setSelectedObstacleId] = useState<string | null>('obs-1');

  // AI Rooftop Assessment State
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<RoofAssessmentData | null>(null);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  const handleRunAiAssessment = async () => {
    setIsAssessing(true);
    setAssessmentError(null);
    try {
      const obstacleDescriptions = obstacles.length > 0 
        ? obstacles.map(o => `${o.name} (${o.type})`).join(', ') 
        : 'Clear terrace with minimal obstructions';
      
      const panelName = panelWattage === 540 
        ? 'Mono PERC Half-Cut 540W' 
        : panelWattage === 550 
        ? 'Bifacial 550W' 
        : 'Polycrystalline 335W';

      const data = await assessRoofApi({
        address: activeAddress,
        monthlyBill: 3500,
        roofAreaSqFt: roofWidthFt * roofLengthFt,
        state: selectedStateCode || 'Karnataka',
        roofType: 'Flat RCC Terrace',
        obstacles: obstacleDescriptions,
        panelType: panelName,
      });

      setAssessmentResult(data);
      setShowAssessmentModal(true);
    } catch (err: any) {
      console.error('Error running AI roof assessment:', err);
      setAssessmentError(err?.message || 'Failed to complete AI roof assessment.');
    } finally {
      setIsAssessing(false);
    }
  };

  // Drag state for moving obstacles directly on the rooftop canvas
  const roofRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    obsId: string;
    startX: number;
    startY: number;
    initialObsX: number;
    initialObsY: number;
  } | null>(null);

  // Global pointer move and up listeners for moving obstacles
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!roofRef.current) return;
      const rect = roofRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

      const deltaPercentX = ((clientX - dragState.startX) / rect.width) * 100;
      const deltaPercentY = ((clientY - dragState.startY) / rect.height) * 100;

      setObstacles(prev => prev.map(obs => {
        if (obs.id !== dragState.obsId) return obs;
        const newX = Math.round(Math.max(1, Math.min(99 - obs.width, dragState.initialObsX + deltaPercentX)));
        const newY = Math.round(Math.max(1, Math.min(99 - obs.height, dragState.initialObsY + deltaPercentY)));
        return { ...obs, x: newX, y: newY };
      }));
    };

    const handlePointerUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [dragState]);

  // Keyboard nudge for fine-tuning obstacle position
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedObstacleId) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        // Only nudge if not focused in an input field
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

        e.preventDefault();
        setObstacles(prev => prev.map(obs => {
          if (obs.id !== selectedObstacleId) return obs;
          let newX = obs.x;
          let newY = obs.y;
          if (e.key === 'ArrowLeft') newX = Math.max(1, obs.x - 1);
          if (e.key === 'ArrowRight') newX = Math.min(99 - obs.width, obs.x + 1);
          if (e.key === 'ArrowUp') newY = Math.max(1, obs.y - 1);
          if (e.key === 'ArrowDown') newY = Math.min(99 - obs.height, obs.y + 1);
          return { ...obs, x: newX, y: newY };
        }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObstacleId]);

  // Start drag movement
  const handleStartDragObstacle = (e: React.MouseEvent | React.TouchEvent, obsId: string) => {
    e.stopPropagation();
    setSelectedObstacleId(obsId);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

    const targetObs = obstacles.find(o => o.id === obsId);
    if (!targetObs) return;

    setDragState({
      obsId,
      startX: clientX,
      startY: clientY,
      initialObsX: targetObs.x,
      initialObsY: targetObs.y,
    });
  };

  const handleUpdateObstacle = (id: string, updates: Partial<RoofObstacle>) => {
    setObstacles(prev => prev.map(obs => {
      if (obs.id !== id) return obs;
      const updated = { ...obs, ...updates };
      // Keep within bounds
      if (updated.x + updated.width > 99) updated.x = Math.max(1, 99 - updated.width);
      if (updated.y + updated.height > 99) updated.y = Math.max(1, 99 - updated.height);
      return updated;
    }));
  };

  const handleRotateObstacle = (id: string) => {
    setObstacles(prev => prev.map(obs => {
      if (obs.id !== id) return obs;
      const newWidth = Math.min(50, obs.height);
      const newHeight = Math.min(50, obs.width);
      const newX = Math.min(99 - newWidth, obs.x);
      const newY = Math.min(99 - newHeight, obs.y);
      return {
        ...obs,
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
        rotation: ((obs.rotation || 0) + 90) % 360,
      };
    }));
  };

  const handleCenterObstacle = (id: string) => {
    setObstacles(prev => prev.map(obs => {
      if (obs.id !== id) return obs;
      return {
        ...obs,
        x: Math.round((100 - obs.width) / 2),
        y: Math.round((100 - obs.height) / 2),
      };
    }));
  };

  const handlePresetPosition = (id: string, preset: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center') => {
    setObstacles(prev => prev.map(obs => {
      if (obs.id !== id) return obs;
      let x = obs.x;
      let y = obs.y;
      if (preset === 'top-right') {
        x = Math.max(1, 98 - obs.width);
        y = 6;
      } else if (preset === 'top-left') {
        x = 6;
        y = 6;
      } else if (preset === 'bottom-right') {
        x = Math.max(1, 98 - obs.width);
        y = Math.max(1, 98 - obs.height);
      } else if (preset === 'bottom-left') {
        x = 6;
        y = Math.max(1, 98 - obs.height);
      } else if (preset === 'center') {
        x = Math.round((100 - obs.width) / 2);
        y = Math.round((100 - obs.height) / 2);
      }
      return { ...obs, x, y };
    }));
  };

  const handleDuplicateObstacle = (id: string) => {
    const target = obstacles.find(o => o.id === id);
    if (!target) return;
    const newId = `obs-${Date.now()}`;
    const newObs: RoofObstacle = {
      ...target,
      id: newId,
      name: `${target.name} (Copy)`,
      x: Math.min(99 - target.width, target.x + 4),
      y: Math.min(99 - target.height, target.y + 4),
    };
    setObstacles(prev => [...prev, newObs]);
    setSelectedObstacleId(newId);
  };

  // Auto-generate grid on mount or dimension change
  useEffect(() => {
    autoFitPanels();
  }, [roofWidthFt, roofLengthFt, panelWattage]);

  const autoFitPanels = () => {
    // 540W panel dimensions ~ 7.5ft x 3.7ft
    const panelWidthFt = panelWattage >= 500 ? 7.4 : 6.5;
    const panelHeightFt = panelWattage >= 500 ? 3.7 : 3.3;

    // Margin from roof parapet walls: 2ft
    const usableWidth = Math.max(roofWidthFt - 4, 6);
    const usableLength = Math.max(roofLengthFt - 4, 6);

    const cols = Math.floor(usableWidth / panelHeightFt); // Portrait or landscape
    const rows = Math.floor(usableLength / panelWidthFt);

    const newPanels: RoofPanelLayout[] = [];
    let idCounter = 1;

    for (let r = 0; r < Math.min(rows, 6); r++) {
      for (let c = 0; c < Math.min(cols, 8); c++) {
        const posX = ((c + 0.5) / (cols || 1)) * 80 + 10;
        const posY = ((r + 0.5) / (rows || 1)) * 80 + 10;

        // Check if overlaps obstacle
        const isNearObstacle = obstacles.some(obs => {
          const dx = Math.abs(posX - (obs.x + obs.width / 2));
          const dy = Math.abs(posY - (obs.y + obs.height / 2));
          return dx < obs.width * 0.7 && dy < obs.height * 0.7;
        });

        if (!isNearObstacle) {
          newPanels.push({
            id: `p-${idCounter++}`,
            row: r,
            col: c,
            x: posX,
            y: posY,
            rotation: 0,
            wattage: panelWattage,
            isShadowed: false,
            isActive: true,
          });
        }
      }
    }

    setPanels(newPanels);
  };

  const handleTogglePanel = (id: string) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const handleAddPanel = () => {
    const newId = `p-${Date.now()}`;
    setPanels(prev => [
      ...prev,
      {
        id: newId,
        row: 0,
        col: 0,
        x: 45 + Math.random() * 10,
        y: 45 + Math.random() * 10,
        rotation: 0,
        wattage: panelWattage,
        isShadowed: false,
        isActive: true,
      }
    ]);
  };

  const handleClearPanels = () => {
    setPanels([]);
  };

  const handleAddObstacle = (type: 'staircase' | 'watertank' | 'ac_unit' | 'tree') => {
    const names = {
      staircase: 'Staircase Mumty',
      watertank: 'Water Tank Tower',
      ac_unit: 'AC Outdoor Unit',
      tree: 'Nearby Shading Tree',
    };
    const newObs: RoofObstacle = {
      id: `obs-${Date.now()}`,
      name: names[type],
      type,
      x: 35 + Math.random() * 20,
      y: 35 + Math.random() * 20,
      width: type === 'staircase' ? 20 : type === 'watertank' ? 14 : 10,
      height: type === 'staircase' ? 20 : type === 'watertank' ? 14 : 10,
      shadowFactor: 0.6,
    };
    setObstacles(prev => [...prev, newObs]);
  };

  const handleRemoveObstacle = (id: string) => {
    setObstacles(prev => prev.filter(o => o.id !== id));
  };

  // Active Capacity & Metrics
  const activePanels = panels.filter(p => p.isActive);
  const totalCapacityKwp = Math.round((activePanels.length * panelWattage) / 10) / 100; // in kW
  
  // Shadow Factor based on time of day (8am to 4pm) and obstacles
  const shadowLengthFactor = Math.abs(timeOfDayHour - 12) * 0.15;
  const estimatedDailyUnits = Math.round(totalCapacityKwp * 4.4 * (1 - shadowLengthFactor * 0.1) * 10) / 10;
  
  let subsidyAmount = 0;
  if (totalCapacityKwp >= 3) subsidyAmount = 78000;
  else if (totalCapacityKwp >= 2) subsidyAmount = 60000;
  else if (totalCapacityKwp >= 1) subsidyAmount = 30000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-0.5 rounded-full text-xs font-semibold shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive Rooftop Panel Layout Studio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            Design Your <span className="text-emerald-600">Rooftop Solar Array</span>
          </h2>
          <p className="text-xs text-stone-600">
            Simulate panel placements, South orientation (180°), and shadow casting obstacles on your roof.
          </p>
        </div>

        {/* Real-time Address Input & Satellite Switcher */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Search Indian Address / Colony / Pincode"
              className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
            />
          </div>
          <button
            onClick={() => setActiveAddress(addressInput)}
            className="bg-stone-800 hover:bg-stone-900 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
          >
            Locate Roof
          </button>
          <button
            onClick={handleRunAiAssessment}
            disabled={isAssessing}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            {isAssessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isAssessing ? 'Analyzing...' : 'AI Roof Assessment'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Toolbar: Dimensions, Tilt, Obstacles */}
        <div className="lg:col-span-4 space-y-4">
          {/* Roof Dimensions Box */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center justify-between">
              <span>Roof Dimensions</span>
              <span className="text-emerald-700 font-mono font-bold">
                {roofWidthFt * roofLengthFt} sq.ft (~{Math.round((roofWidthFt * roofLengthFt) / 10.76)} m²)
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-stone-600 block mb-1 font-medium">
                  Width: <strong className="text-stone-900">{roofWidthFt} ft</strong>
                </label>
                <input
                  type="range"
                  min={15}
                  max={60}
                  step={1}
                  value={roofWidthFt}
                  onChange={(e) => setRoofWidthFt(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[11px] text-stone-600 block mb-1 font-medium">
                  Length: <strong className="text-stone-900">{roofLengthFt} ft</strong>
                </label>
                <input
                  type="range"
                  min={12}
                  max={50}
                  step={1}
                  value={roofLengthFt}
                  onChange={(e) => setRoofLengthFt(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Tilt & Orientation for Indian Latitudes */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
              <div>
                <label className="text-[11px] text-stone-600 block mb-1 font-medium">
                  Panel Tilt: <strong className="text-emerald-700 font-bold">{roofTiltDeg}°</strong>
                </label>
                <input
                  type="range"
                  min={10}
                  max={35}
                  step={1}
                  value={roofTiltDeg}
                  onChange={(e) => setRoofTiltDeg(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-stone-500 block mt-0.5">18°-24° ideal for India</span>
              </div>
              <div>
                <label className="text-[11px] text-stone-600 block mb-1 font-medium">
                  Azimuth: <strong className="text-emerald-700 font-bold">{roofAzimuthDeg}° {roofAzimuthDeg === 180 ? '(South)' : ''}</strong>
                </label>
                <input
                  type="range"
                  min={90}
                  max={270}
                  step={5}
                  value={roofAzimuthDeg}
                  onChange={(e) => setRoofAzimuthDeg(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] text-stone-500 block mt-0.5">180° True South</span>
              </div>
            </div>
          </div>

          {/* Panel Specification & Auto-Fit */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Panel Selection
              </h3>
              <select
                value={panelWattage}
                onChange={(e) => setPanelWattage(Number(e.target.value) as any)}
                className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-emerald-800 font-semibold focus:outline-none"
              >
                <option value={540}>540W Mono PERC</option>
                <option value={550}>550W Bifacial TopCon</option>
                <option value={335}>335W Polycrystalline</option>
              </select>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={autoFitPanels}
                className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Fit</span>
              </button>
              <button
                onClick={handleAddPanel}
                className="flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Panel</span>
              </button>
              <button
                onClick={handleClearPanels}
                className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Rooftop Obstacles Box */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Rooftop Obstacles & Mumty
              </h3>
              <span className="text-[10px] text-stone-500">Click to add</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddObstacle('staircase')}
                className="bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
              >
                🏢 <span>+ Staircase Room</span>
              </button>
              <button
                onClick={() => handleAddObstacle('watertank')}
                className="bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
              >
                🛢️ <span>+ Water Tank</span>
              </button>
              <button
                onClick={() => handleAddObstacle('ac_unit')}
                className="bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
              >
                ❄️ <span>+ AC Outdoor Unit</span>
              </button>
              <button
                onClick={() => handleAddObstacle('tree')}
                className="bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 p-2 rounded-xl text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
              >
                🌳 <span>+ Nearby Tree</span>
              </button>
            </div>

            {/* List of current obstacles */}
            {obstacles.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-stone-500 font-semibold block uppercase tracking-wider">
                    Rooftop Elements ({obstacles.length}):
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">Click to select & adjust</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                  {obstacles.map(obs => {
                    const isSelected = selectedObstacleId === obs.id;
                    const widthFt = Math.round((obs.width / 100) * roofWidthFt * 10) / 10;
                    const heightFt = Math.round((obs.height / 100) * roofLengthFt * 10) / 10;
                    return (
                      <div 
                        key={obs.id} 
                        onClick={() => setSelectedObstacleId(obs.id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-semibold shadow-2xs'
                            : 'bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm">
                            {obs.type === 'staircase' ? '🏢' : obs.type === 'watertank' ? '🛢️' : obs.type === 'ac_unit' ? '❄️' : '🌳'}
                          </span>
                          <div className="truncate">
                            <span className="truncate block leading-tight">{obs.name}</span>
                            <span className="text-[10px] text-stone-500 font-normal">
                              {widthFt}ft × {heightFt}ft • {obs.structureHeightFt || 10}ft H
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected && (
                            <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded-md">
                              Active
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveObstacle(obs.id);
                              if (selectedObstacleId === obs.id) {
                                setSelectedObstacleId(obstacles.find(o => o.id !== obs.id)?.id || null);
                              }
                            }}
                            className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                            title="Remove obstacle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Obstacle Detailed Adjuster */}
            {selectedObstacleId && (() => {
              const currentObs = obstacles.find(o => o.id === selectedObstacleId);
              if (!currentObs) return null;
              const widthFt = Math.round((currentObs.width / 100) * roofWidthFt * 10) / 10;
              const heightFt = Math.round((currentObs.height / 100) * roofLengthFt * 10) / 10;
              const xFt = Math.round((currentObs.x / 100) * roofWidthFt * 10) / 10;
              const yFt = Math.round((currentObs.y / 100) * roofLengthFt * 10) / 10;

              return (
                <div className="pt-3 border-t border-stone-200 space-y-3 bg-emerald-50/50 -mx-4 -mb-4 p-4 rounded-b-2xl border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Adjust {currentObs.name}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-mono bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">
                      {widthFt}ft × {heightFt}ft
                    </span>
                  </div>

                  {/* Size Adjusters (Width & Length in ft and %) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-stone-600 font-medium mb-1">
                        <span>Width:</span>
                        <strong className="text-emerald-800 font-mono">{widthFt} ft ({currentObs.width}%)</strong>
                      </div>
                      <input
                        type="range"
                        min={6}
                        max={50}
                        step={1}
                        value={currentObs.width}
                        onChange={(e) => handleUpdateObstacle(currentObs.id, { width: Number(e.target.value) })}
                        className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-stone-600 font-medium mb-1">
                        <span>Length:</span>
                        <strong className="text-emerald-800 font-mono">{heightFt} ft ({currentObs.height}%)</strong>
                      </div>
                      <input
                        type="range"
                        min={6}
                        max={50}
                        step={1}
                        value={currentObs.height}
                        onChange={(e) => handleUpdateObstacle(currentObs.id, { height: Number(e.target.value) })}
                        className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Position Adjusters (X & Y Coordinates) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-stone-600 font-medium mb-1">
                        <span>Position X (West):</span>
                        <strong className="text-emerald-800 font-mono">{xFt} ft ({currentObs.x}%)</strong>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={Math.max(1, 99 - currentObs.width)}
                        step={1}
                        value={currentObs.x}
                        onChange={(e) => handleUpdateObstacle(currentObs.id, { x: Number(e.target.value) })}
                        className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-stone-600 font-medium mb-1">
                        <span>Position Y (North):</span>
                        <strong className="text-emerald-800 font-mono">{yFt} ft ({currentObs.y}%)</strong>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={Math.max(1, 99 - currentObs.height)}
                        step={1}
                        value={currentObs.y}
                        onChange={(e) => handleUpdateObstacle(currentObs.id, { y: Number(e.target.value) })}
                        className="w-full accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Structure Height (ft) & Shadow factor */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-stone-600 font-medium mb-1">
                      <span>Structure Height (Affects Shadow):</span>
                      <strong className="text-emerald-800 font-bold">{currentObs.structureHeightFt || 10} ft</strong>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: '8 ft (Standard)', val: 8 },
                        { label: '10 ft (Elevated)', val: 10 },
                        { label: '12 ft (High Tank)', val: 12 },
                      ].map(h => (
                        <button
                          key={h.val}
                          type="button"
                          onClick={() => handleUpdateObstacle(currentObs.id, { 
                            structureHeightFt: h.val,
                            shadowFactor: h.val >= 12 ? 0.8 : h.val >= 10 ? 0.7 : 0.5
                          })}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer text-center ${
                            (currentObs.structureHeightFt || 10) === h.val
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-300'
                          }`}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preset Alignments & Transformations */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-stone-500 font-semibold block">Quick Position Presets:</span>
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        type="button"
                        onClick={() => handlePresetPosition(currentObs.id, 'top-right')}
                        className="bg-white hover:bg-emerald-50 text-stone-700 border border-stone-200 hover:border-emerald-300 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer"
                        title="Move to Top-Right Corner"
                      >
                        Top-Right
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetPosition(currentObs.id, 'top-left')}
                        className="bg-white hover:bg-emerald-50 text-stone-700 border border-stone-200 hover:border-emerald-300 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer"
                        title="Move to Top-Left Corner"
                      >
                        Top-Left
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetPosition(currentObs.id, 'bottom-right')}
                        className="bg-white hover:bg-emerald-50 text-stone-700 border border-stone-200 hover:border-emerald-300 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer"
                        title="Move to Bottom-Right Corner"
                      >
                        Bot-Right
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetPosition(currentObs.id, 'center')}
                        className="bg-white hover:bg-emerald-50 text-stone-700 border border-stone-200 hover:border-emerald-300 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer"
                        title="Center on Roof"
                      >
                        Center
                      </button>
                    </div>
                  </div>

                  {/* Rotate & Duplicate */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/60">
                    <button
                      type="button"
                      onClick={() => handleRotateObstacle(currentObs.id)}
                      className="flex items-center justify-center gap-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3 text-emerald-600" />
                      <span>Rotate 90°</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateObstacle(currentObs.id)}
                      className="flex items-center justify-center gap-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-emerald-600" />
                      <span>Duplicate</span>
                    </button>
                  </div>
                  
                  <p className="text-[9px] text-emerald-800 leading-tight">
                    💡 You can drag the structure directly on the rooftop canvas to reposition it, and use the sliders above to adjust its size and dimensions.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Center & Right: Interactive Rooftop Canvas & Sun Simulation */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Canvas Bar: View Mode, Time of Day Sun Slider */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                onClick={() => setMapMode('blueprint')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mapMode === 'blueprint'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                📐 Architectural Grid
              </button>
              <button
                onClick={() => setMapMode('satellite')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mapMode === 'satellite'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🛰️ Satellite View
              </button>
            </div>

            {/* Sun Time of Day Shadow Slider */}
            <div className="flex items-center gap-3 bg-stone-50 px-3.5 py-1.5 rounded-xl border border-stone-200 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Sun Position:</span>
              </div>
              <input
                type="range"
                min={8}
                max={17}
                step={1}
                value={timeOfDayHour}
                onChange={(e) => setTimeOfDayHour(Number(e.target.value))}
                className="w-28 accent-emerald-600 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-emerald-800 font-bold min-w-[55px]">
                {timeOfDayHour > 12 ? `${timeOfDayHour - 12}:00 PM` : `${timeOfDayHour}:00 ${timeOfDayHour === 12 ? 'PM' : 'AM'}`}
              </span>
            </div>

            {/* Compass Marker */}
            <div className="flex items-center gap-1 text-[11px] text-stone-600 font-mono bg-stone-50 px-2 py-1 rounded-lg border border-stone-200">
              <span className="text-rose-600 font-bold">N ↑</span>
              <span className="text-emerald-700 font-bold">S ↓ (Optimal)</span>
            </div>
          </div>

          {/* The Visualizer Canvas Area */}
          <div className="relative w-full aspect-[16/10] bg-slate-100 rounded-2xl border-2 border-stone-300 overflow-hidden shadow-inner flex items-center justify-center p-4">
            {/* Background Texture / Satellite Layer */}
            {mapMode === 'satellite' ? (
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-80 flex items-center justify-center">
                {/* Simulated high-resolution aerial rooftop texture */}
                <div className="absolute inset-0 bg-slate-200/80 mix-blend-multiply"></div>
                <div className="absolute top-3 left-3 text-[11px] text-stone-700 bg-white/95 px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs font-medium">
                  📍 {activeAddress}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-90"></div>
            )}

            {/* The Rooftop Boundary Container */}
            <div 
              ref={roofRef}
              className="relative bg-slate-200/90 rounded-xl border-4 border-emerald-500/70 shadow-xl transition-all duration-300 flex items-center justify-center overflow-hidden select-none"
              style={{
                width: '86%',
                height: '84%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Parapet Wall indicator */}
              <div className="absolute inset-0 border-2 border-dashed border-stone-400/40 pointer-events-none"></div>

              {/* Instructions banner */}
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 text-[10px] bg-white/95 text-stone-800 px-2.5 py-1 rounded-lg border border-stone-200 shadow-2xs font-medium backdrop-blur-xs">
                <Move className="w-3 h-3 text-emerald-600" />
                <span>Drag rooftop structures to reposition</span>
              </div>

              {/* Roof Center True South Indicator */}
              <div className="absolute top-2 right-2 z-20 flex items-center gap-1 text-[10px] text-emerald-800 font-mono bg-white/90 px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
                <span>Azimuth {roofAzimuthDeg}°</span>
              </div>

              {/* Render Obstacles with dynamic shadow projections (Movable diagram only, no size or adjustment text) */}
              {obstacles.map((obs) => {
                const isSelected = selectedObstacleId === obs.id;
                const isThisDragging = dragState?.obsId === obs.id;
                const heightFactor = (obs.structureHeightFt || (obs.type === 'staircase' ? 10 : 6)) / 10;

                const shadowX = (12 - timeOfDayHour) * 3 * heightFactor;
                const shadowY = Math.abs(timeOfDayHour - 12) * 2.5 * heightFactor + 4 * heightFactor;

                return (
                  <div
                    key={obs.id}
                    onMouseDown={(e) => handleStartDragObstacle(e, obs.id)}
                    onTouchStart={(e) => handleStartDragObstacle(e, obs.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedObstacleId(obs.id);
                    }}
                    className={`absolute z-20 select-none group ${
                      isThisDragging ? 'cursor-grabbing z-30' : 'cursor-grab'
                    }`}
                    style={{
                      left: `${obs.x}%`,
                      top: `${obs.y}%`,
                      width: `${obs.width}%`,
                      height: `${obs.height}%`,
                    }}
                    title={`${obs.name} (Drag to move • Adjust size in sidebar)`}
                  >
                    {/* Shadow layer */}
                    <div
                      className="absolute bg-slate-900/35 rounded-sm filter blur-[2.5px] transition-all pointer-events-none"
                      style={{
                        inset: 0,
                        transform: `translate(${shadowX}px, ${shadowY}px) scale(1.04)`,
                        opacity: timeOfDayHour === 12 ? 0.35 : 0.5,
                      }}
                    ></div>

                    {/* Clean, Simple & Recognizable Diagram (Uncomplicated, no dimension clutter) */}
                    <div className={`relative w-full h-full rounded-lg transition-all duration-150 flex items-center justify-center overflow-hidden ${
                      isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 shadow-lg' : 'hover:ring-1 hover:ring-emerald-400'
                    }`}>
                      {/* 1. Staircase Mumty Room */}
                      {obs.type === 'staircase' && (
                        <div className="w-full h-full rounded-lg bg-stone-200 border-2 border-stone-500 shadow-md flex flex-col items-center justify-center p-1.5 text-stone-800 select-none">
                          <Building2 className="w-5 h-5 md:w-6 md:h-6 text-stone-700 shrink-0 mb-0.5" />
                          <span className="text-[10px] md:text-xs font-bold leading-tight truncate max-w-full">
                            Mumty
                          </span>
                          <span className="text-[8px] md:text-[9px] text-stone-500 font-medium truncate max-w-full">
                            (Stairs)
                          </span>
                        </div>
                      )}

                      {/* 2. Overhead Water Tank */}
                      {obs.type === 'watertank' && (
                        <div className="w-full h-full rounded-full bg-sky-100 border-2 border-sky-600 shadow-md flex flex-col items-center justify-center p-1 text-sky-900 select-none">
                          <Droplets className="w-4 h-4 md:w-5 md:h-5 text-sky-600 shrink-0 mb-0.5" />
                          <span className="text-[9px] md:text-[10px] font-bold leading-tight truncate max-w-full px-1">
                            Water Tank
                          </span>
                        </div>
                      )}

                      {/* 3. Nearby Tree */}
                      {obs.type === 'tree' && (
                        <div className="w-full h-full rounded-full bg-emerald-100 border-2 border-emerald-600 shadow-md flex flex-col items-center justify-center p-1 text-emerald-900 select-none">
                          <Trees className="w-4 h-4 md:w-5 md:h-5 text-emerald-700 shrink-0 mb-0.5" />
                          <span className="text-[9px] md:text-[10px] font-bold leading-tight truncate max-w-full px-1">
                            Tree
                          </span>
                        </div>
                      )}

                      {/* 4. AC Outdoor Unit */}
                      {obs.type === 'ac_unit' && (
                        <div className="w-full h-full rounded-lg bg-slate-100 border-2 border-slate-500 shadow-md flex flex-col items-center justify-center p-1 text-slate-800 select-none">
                          <Fan className="w-4 h-4 md:w-5 md:h-5 text-slate-600 shrink-0 mb-0.5" />
                          <span className="text-[9px] md:text-[10px] font-bold leading-tight truncate max-w-full px-1">
                            AC Unit
                          </span>
                        </div>
                      )}

                      {/* 5. Generic / Other Obstacle */}
                      {obs.type !== 'staircase' && obs.type !== 'watertank' && obs.type !== 'tree' && obs.type !== 'ac_unit' && (
                        <div className="w-full h-full rounded-lg bg-stone-200 border-2 border-stone-500 shadow-md flex items-center justify-center p-1 text-stone-800 select-none">
                          <span className="text-[10px] font-bold truncate max-w-full px-1">
                            {obs.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Render Solar Panels Grid */}
              {panels.map((panel) => {
                // Dynamic check if shaded by any obstacle
                const isShadedByObstacle = obstacles.some(obs => {
                  const heightFactor = (obs.structureHeightFt || 10) / 10;
                  const shadowX = (12 - timeOfDayHour) * 2 * heightFactor;
                  const shadowY = Math.abs(timeOfDayHour - 12) * 1.5 * heightFactor + 2;

                  const isUnder = panel.x >= obs.x && panel.x <= obs.x + obs.width &&
                                  panel.y >= obs.y && panel.y <= obs.y + obs.height;

                  const shadowLeft = Math.min(obs.x, obs.x + shadowX);
                  const shadowRight = Math.max(obs.x + obs.width, obs.x + obs.width + shadowX);
                  const shadowTop = Math.min(obs.y, obs.y + shadowY);
                  const shadowBottom = Math.max(obs.y + obs.height, obs.y + obs.height + shadowY);

                  const inShadow = panel.x >= shadowLeft && panel.x <= shadowRight &&
                                   panel.y >= shadowTop && panel.y <= shadowBottom;
                  return isUnder || inShadow;
                });

                return (
                  <div
                    key={panel.id}
                    onClick={() => handleTogglePanel(panel.id)}
                    className={`absolute z-10 cursor-pointer rounded transition-all duration-200 group ${
                      panel.isActive
                        ? isShadedByObstacle
                          ? 'bg-gradient-to-br from-amber-950 via-stone-900 to-slate-900 border-2 border-amber-500/80 shadow-md'
                          : 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border border-emerald-400 shadow-md hover:border-emerald-300 hover:scale-105'
                        : 'bg-stone-300/40 border border-dashed border-stone-400 opacity-40 hover:opacity-80'
                    }`}
                    style={{
                      left: `${panel.x}%`,
                      top: `${panel.y}%`,
                      width: '12%',
                      height: '22%',
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`Panel #${panel.id}: ${panel.wattage}W (${panel.isActive ? (isShadedByObstacle ? 'Active - Shaded by Structure' : 'Active - Full Sun') : 'Disabled'})`}
                  >
                    {/* Photovoltaic Busbar Grid Texture */}
                    <div className="w-full h-full p-0.5 flex flex-col justify-between overflow-hidden">
                      <div className="grid grid-cols-3 gap-0.5 h-full opacity-60">
                        <div className="border-r border-emerald-300/40"></div>
                        <div className="border-r border-emerald-300/40"></div>
                        <div></div>
                      </div>
                      <div className={`text-[8px] font-mono text-center font-bold truncate ${
                        isShadedByObstacle ? 'text-amber-300' : 'text-emerald-200'
                      }`}>
                        {panel.isActive ? (isShadedByObstacle ? '⚠️ SHADED' : `${panel.wattage}W`) : 'OFF'}
                      </div>
                    </div>
                  </div>
                );
              })}

              {panels.length === 0 && (
                <div className="text-center text-stone-500 text-xs space-y-2">
                  <p>No panels on roof.</p>
                  <button
                    onClick={autoFitPanels}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                  >
                    ✨ Click to Auto-Fit Optimal Layout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom System Summary Stats */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 shadow-sm">
            <div>
              <span className="text-[11px] text-stone-500 block font-medium">Total Solar Array</span>
              <span className="text-xl font-extrabold text-stone-900">
                {totalCapacityKwp} kWp
              </span>
              <span className="text-[10px] text-stone-500 block">
                {activePanels.length} Active Panels
              </span>
            </div>

            <div>
              <span className="text-[11px] text-stone-500 block font-medium">Estimated Daily Yield</span>
              <span className="text-xl font-extrabold text-emerald-700">
                ~{estimatedDailyUnits} Units/day
              </span>
              <span className="text-[10px] text-stone-500 block">
                ~{Math.round(estimatedDailyUnits * 30)} kWh/month
              </span>
            </div>

            <div>
              <span className="text-[11px] text-stone-500 block font-medium">PM Surya Ghar Subsidy</span>
              <span className="text-xl font-extrabold text-emerald-700">
                ₹{subsidyAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-stone-500 block">
                {totalCapacityKwp >= 3 ? 'Max Cap Eligible' : `${totalCapacityKwp} kW Slab`}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-stone-500 block font-medium">Estimated 25-Yr Savings</span>
              <span className="text-xl font-extrabold text-stone-900">
                ₹{Math.round(totalCapacityKwp * 1400 * 25 * 7.5).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-stone-500 block">
                Lifetime Clean Generation
              </span>
            </div>
          </div>

          {/* Quick AI Assessment Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 rounded-2xl p-4 text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/30">
                <Sparkles className="w-3 h-3" />
                <span>MNRE PM Surya Ghar & CEA Engineering Engine</span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white">
                Need a comprehensive solar feasibility report for this rooftop?
              </h4>
              <p className="text-xs text-stone-300">
                Get recommended kW capacity, net capital outlay, DBT bank subsidy, payback period, and CEA CO₂ offset.
              </p>
            </div>
            <button
              onClick={handleRunAiAssessment}
              disabled={isAssessing}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm disabled:opacity-60 cursor-pointer"
            >
              {isAssessing ? <Loader2 className="w-4 h-4 animate-spin text-stone-950" /> : <Sparkles className="w-4 h-4 text-stone-950" />}
              <span>{isAssessing ? 'Generating Assessment...' : 'Run AI Roof Assessment'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI ROOF ASSESSMENT MODAL */}
      {showAssessmentModal && assessmentResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-stone-900">
                      AI Rooftop Solar Feasibility Assessment
                    </h3>
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      Score: {assessmentResult.roofSuitabilityScore}/100
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    Location: <strong>{activeAddress}</strong> • Roof Area: <strong>{roofWidthFt * roofLengthFt} sq.ft</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssessmentModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Recommended Sizing</span>
                <span className="text-2xl font-extrabold text-emerald-700 font-mono block mt-0.5">
                  {assessmentResult.recommendedCapacityKw} <span className="text-xs font-sans">kWp</span>
                </span>
                <span className="text-[10px] text-stone-600 block">Optimal Rooftop Fit</span>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                <span className="text-[10px] text-stone-500 font-bold uppercase block">Central Subsidy</span>
                <span className="text-2xl font-extrabold text-emerald-600 font-mono block mt-0.5">
                  ₹{assessmentResult.centralSubsidy.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-stone-500 block">PM Surya Ghar DBT</span>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                <span className="text-[10px] text-stone-500 font-bold uppercase block">Net Cost Outlay</span>
                <span className="text-2xl font-extrabold text-stone-900 font-mono block mt-0.5">
                  ₹{assessmentResult.netCost.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-stone-500 block">Est: ₹{assessmentResult.estimatedCost.toLocaleString('en-IN')}</span>
              </div>

              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3">
                <span className="text-[10px] text-stone-500 font-bold uppercase block">Payback Period</span>
                <span className="text-2xl font-extrabold text-stone-900 font-mono block mt-0.5">
                  {assessmentResult.paybackYears} <span className="text-xs font-sans">Years</span>
                </span>
                <span className="text-[10px] text-stone-500 block">ROI: ~28-32% per yr</span>
              </div>
            </div>

            {/* Financial & Environmental Impact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white border border-stone-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Annual Yield & Energy Savings</span>
                </div>
                <div className="space-y-1 text-stone-600">
                  <div className="flex justify-between">
                    <span>Clean Generation:</span>
                    <strong className="text-stone-900 font-mono">~{assessmentResult.annualGenerationUnits.toLocaleString('en-IN')} Units (kWh)/yr</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Annual Electricity Savings:</span>
                    <strong className="text-emerald-700 font-mono">₹{assessmentResult.annualSavings.toLocaleString('en-IN')} / year</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Inverter System:</span>
                    <span className="text-stone-800 text-[11px] truncate max-w-[200px]" title={assessmentResult.inverterRecommendation}>
                      {assessmentResult.inverterRecommendation}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <Trees className="w-4 h-4 text-emerald-600" />
                  <span>Carbon Offset (CEA Grid Baseline)</span>
                </div>
                <div className="space-y-1 text-stone-600">
                  <div className="flex justify-between">
                    <span>Annual CO₂ Abatement:</span>
                    <strong className="text-emerald-700 font-mono">~{assessmentResult.co2OffsetAnnualKg.toLocaleString('en-IN')} kg CO₂/yr</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Equivalent Trees:</span>
                    <strong className="text-stone-900 font-mono">~{assessmentResult.treesEquivalent} Mature Trees</strong>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Emission Baseline Factor:</span>
                    <span className="font-mono text-emerald-800 font-semibold">0.82 kg CO₂/kWh (CEA)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Recommendations & Discom Notice */}
            <div className="space-y-2 text-xs bg-stone-50 border border-stone-200 rounded-xl p-3.5">
              <div className="flex items-start gap-2">
                <Sun className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block">Orientation & Tilt:</strong>
                  <p className="text-stone-600">{assessmentResult.orientationRecommendation}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-stone-200">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block">Shading & Obstacles Analysis:</strong>
                  <p className="text-stone-600">{assessmentResult.shadingAnalysis}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-stone-200">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block">DISCOM Net Metering Notice:</strong>
                  <p className="text-stone-600">{assessmentResult.discomNotice}</p>
                </div>
              </div>
            </div>

            {/* AI Engineering Notes */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs text-stone-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-900 block">Certified AI Solar Consultant Notes:</strong>
                <p className="text-[11px] leading-relaxed text-emerald-950">{assessmentResult.aiNotes}</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
              <button
                onClick={() => setShowAssessmentModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Close Report
              </button>
              <button
                onClick={() => {
                  setShowAssessmentModal(false);
                  autoFitPanels();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-2xs cursor-pointer"
              >
                Apply Optimal Layout to Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
