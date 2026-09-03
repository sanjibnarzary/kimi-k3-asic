import React from 'react';
import { 
  Cpu, 
  Layers, 
  Flame, 
  Zap, 
  ShieldCheck, 
  FileCode, 
  Sliders, 
  ArrowRightLeft,
  Factory
} from 'lucide-react';
import { 
  KimiModelConfig, 
  SiliconProcessConfig, 
  EDAOptimizationMetrics, 
  PowerMetrics 
} from '../types/eda';
import { KIMI_PRESETS } from '../utils/edaCalculations';

interface HeaderProps {
  currentModel: KimiModelConfig;
  siliconConfig: SiliconProcessConfig;
  metrics: EDAOptimizationMetrics;
  powerMetrics: PowerMetrics;
  activeTab: 'floorplan' | 'weights' | 'thermal' | 'interconnect' | 'industrial' | 'signoff';
  setActiveTab: (tab: 'floorplan' | 'weights' | 'thermal' | 'interconnect' | 'industrial' | 'signoff') => void;
  onSelectPreset: (presetKey: string) => void;
  onOpenSignoff: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModel,
  siliconConfig,
  metrics,
  powerMetrics,
  activeTab,
  setActiveTab,
  onSelectPreset,
  onOpenSignoff,
}) => {
  return (
    <header className="border-b border-white/10 bg-[#0A0C12] sticky top-0 z-40 font-mono">
      {/* Top Banner / Telemetry strip */}
      <div className="flex flex-wrap items-center justify-between px-6 py-2 text-[11px] border-b border-white/10 bg-[#08090D] text-zinc-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-2 text-blue-400 font-semibold tracking-wider">
            <span className="w-2 h-2 bg-emerald-400 animate-pulse"></span>
            <span className="uppercase">ASIC-EDA: SILICON-READY</span>
          </span>
          <span className="text-white/20">|</span>
          <span className="tracking-wide">DIE: {siliconConfig.dieWidthMm}x{siliconConfig.dieHeightMm}mm ({metrics.dieAreaMm2} mm²)</span>
          <span className="text-white/20">|</span>
          <span className="tracking-wide">NODE: {siliconConfig.processNode.replace('_', ' ')}</span>
          <span className="text-white/20">|</span>
          <span className="text-emerald-400 font-medium tracking-wide">3D MEMORY: {siliconConfig.memoryTiersCount} TIERS ({siliconConfig.memoryTech.toUpperCase()})</span>
        </div>

        <div className="flex items-center space-x-5 text-[10px] tracking-wider uppercase">
          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500">ZERO-DRAM:</span>
            <span className="px-2 py-0.5 bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-bold">
              100% ON-CHIP
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500">SERIAL LINK:</span>
            <span className="px-2 py-0.5 bg-blue-600/15 text-blue-300 border border-blue-500/30 font-bold">
              PCIe Gen5 / CXL 3.0
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500">Tj:</span>
            <span className={`font-bold ${metrics.thermalThrottling ? 'text-rose-400' : 'text-amber-300'}`}>
              {metrics.maxJunctionTempCelsius}°C
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-zinc-500">POWER SAVINGS:</span>
            <span className="text-emerald-400 font-bold">-{powerMetrics.powerSavingsPercent}% VS DRAM</span>
          </div>
        </div>
      </div>

      {/* Main navigation and Controls bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3.5 gap-4 bg-[#0A0C12]">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow-sm">
            K
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-base lg:text-lg font-bold tracking-tight text-white uppercase font-mono">
                Kimi K3 <span className="text-blue-500 font-normal">// ASIC Architect v4.2</span>
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-blue-600/15 text-blue-400 border border-blue-600/30">
                Single-Chip Reticle
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
              Monolithic 3D NVM • PCIe Gen 5 / CXL 3.0 • Zero External DRAM • Industrial Real-Time
            </p>
          </div>
        </div>

        {/* Model Presets Selector */}
        <div className="flex items-center space-x-2 bg-[#08090D] px-2.5 py-1.5 border border-white/10 text-xs">
          <Sliders className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500 font-medium uppercase text-[10px] tracking-wider">Model:</span>
          <select
            aria-label="Select Kimi K3 Model Variant"
            className="bg-[#050608] text-zinc-200 border border-white/15 px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer font-mono text-xs uppercase"
            value={
              Object.entries(KIMI_PRESETS).find(
                ([, val]) => val.variantName === currentModel.variantName
              )?.[0] || 'kimi-k3-edge-moe'
            }
            onChange={(e) => onSelectPreset(e.target.value)}
          >
            {Object.entries(KIMI_PRESETS).map(([key, val]) => (
              <option key={key} value={key}>
                {val.variantName} ({val.precision})
              </option>
            ))}
          </select>
        </div>

        {/* Tab Navigation */}
        <nav className="flex items-center space-x-1 bg-[#08090D] p-1 border border-white/10" aria-label="EDA Modules">
          <button
            onClick={() => setActiveTab('floorplan')}
            className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'floorplan'
                ? 'bg-blue-600 text-white font-bold border border-blue-500'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Silicon Floorplan</span>
          </button>

          <button
            onClick={() => setActiveTab('weights')}
            className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'weights'
                ? 'bg-blue-600 text-white font-bold border border-blue-500'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>3D Memory & Weights</span>
          </button>

          <button
            onClick={() => setActiveTab('thermal')}
            className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'thermal'
                ? 'bg-blue-600 text-white font-bold border border-blue-500'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Thermal Solver</span>
          </button>

          <button
            onClick={() => setActiveTab('interconnect')}
            className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'interconnect'
                ? 'bg-blue-600 text-white font-bold border border-blue-500'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>PCIe / CXL Serial</span>
          </button>

          <button
            onClick={() => setActiveTab('industrial')}
            className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition ${
              activeTab === 'industrial'
                ? 'bg-blue-600 text-white font-bold border border-blue-500'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Industrial Edge</span>
          </button>
        </nav>

        {/* Action Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSignoff}
            className="flex items-center space-x-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-[0.15em] border border-blue-500 shadow-sm transition cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Verilog Signoff</span>
          </button>
        </div>
      </div>
    </header>
  );
};
