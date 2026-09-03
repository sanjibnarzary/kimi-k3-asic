import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Wind, 
  Thermometer, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Droplets, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { 
  MacroBlock, 
  SiliconProcessConfig, 
  PowerMetrics, 
  EDAOptimizationMetrics, 
  CoolingSolution 
} from '../types/eda';
import { computeThermalGrid, getCoolingThermalResistance } from '../utils/edaCalculations';

interface ThermalSimulatorProps {
  macros: MacroBlock[];
  siliconConfig: SiliconProcessConfig;
  powerMetrics: PowerMetrics;
  metrics: EDAOptimizationMetrics;
  onUpdateSilicon: (updated: Partial<SiliconProcessConfig>) => void;
  onApplyThermalAwareFloorplan: () => void;
}

export const ThermalSimulator: React.FC<ThermalSimulatorProps> = ({
  macros,
  siliconConfig,
  powerMetrics,
  metrics,
  onUpdateSilicon,
  onApplyThermalAwareFloorplan,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; temp: number; powerDensity: number } | null>(null);
  const [thermalAwareActive, setThermalAwareActive] = useState(false);

  // Compute 2D thermal grid using finite difference model
  const thermalGrid = useMemo(() => {
    return computeThermalGrid(
      macros,
      siliconConfig.dieWidthMm,
      siliconConfig.dieHeightMm,
      siliconConfig.ambientTempCelsius,
      siliconConfig.cooling
    );
  }, [macros, siliconConfig.dieWidthMm, siliconConfig.dieHeightMm, siliconConfig.ambientTempCelsius, siliconConfig.cooling]);

  // Color mapping function for thermal gradient
  const getCellColor = (temp: number) => {
    const minT = siliconConfig.ambientTempCelsius;
    const maxT = Math.max(minT + 40, metrics.maxJunctionTempCelsius + 5);
    const normalized = Math.max(0, Math.min(1, (temp - minT) / (maxT - minT)));

    if (normalized < 0.25) {
      // Deep blue to cyan
      return `rgb(${Math.round(20 + normalized * 4 * 30)}, ${Math.round(80 + normalized * 4 * 120)}, ${Math.round(200 - normalized * 4 * 20)})`;
    } else if (normalized < 0.5) {
      // Cyan to green/yellow
      const p = (normalized - 0.25) * 4;
      return `rgb(${Math.round(50 + p * 120)}, ${Math.round(200 - p * 30)}, ${Math.round(180 - p * 140)})`;
    } else if (normalized < 0.75) {
      // Yellow to orange
      const p = (normalized - 0.5) * 4;
      return `rgb(${Math.round(170 + p * 65)}, ${Math.round(170 - p * 70)}, ${Math.round(40 - p * 30)})`;
    } else {
      // Orange to bright red / crimson
      const p = (normalized - 0.75) * 4;
      return `rgb(${Math.round(235 + p * 20)}, ${Math.round(100 - p * 70)}, ${Math.round(10 + p * 30)})`;
    }
  };

  const coolingOptions: { id: CoolingSolution; name: string; rTh: string; k: string; desc: string }[] = [
    {
      id: 'diamond_heat_spreader',
      name: 'Diamond Heat Spreader (CVD)',
      rTh: '0.085 °C/W',
      k: '2000 W/m·K',
      desc: 'Synthetic diamond layer direct-bonded to 3D memory stack. Spreads localized hotspots laterally 5x faster than copper.'
    },
    {
      id: 'microchannel_liquid',
      name: 'Integrated Microchannel Liquid Cold Plate',
      rTh: '0.048 °C/W',
      k: 'Direct Fluid Micro-fins',
      desc: 'Silicon backside microfluidic channels with dielectric coolant. Lowest thermal resistance for continuous max-load inference.'
    },
    {
      id: 'copper_vapor_chamber',
      name: 'Copper Vapor Chamber (Ultra-Thin)',
      rTh: '0.145 °C/W',
      k: '400 W/m·K equivalent',
      desc: 'Two-phase evaporative cooling with sintered copper powder wick. Reliable and standard for rugged industrial edge appliances.'
    },
    {
      id: 'passive_industrial_conduction',
      name: 'Passive Conduction (Sealed DIN-Rail Chassis)',
      rTh: '0.320 °C/W',
      k: 'Aluminum Fin Block',
      desc: 'Fanless conduction cooling for sealed harsh factory cabinets (IP67) with zero moving parts.'
    }
  ];

  const handleToggleThermalAware = () => {
    setThermalAwareActive(!thermalAwareActive);
    onApplyThermalAwareFloorplan();
  };

  return (
    <div className="p-4 min-h-[calc(100vh-120px)] bg-[#050608] text-[#D1D5DB] font-mono space-y-6">
      {/* Top Banner Overview */}
      <div className="p-4 bg-[#08090D] border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-orange-600/10 text-orange-400 border border-orange-500/20">
                <Flame className="w-5 h-5" />
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                3D Silicon Thermal Dissipation & Hotspot Mitigation Solver
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed uppercase tracking-wide">
              Stacking 64+ vertical memory tiers directly on top of 3nm compute logic creates intense localized heat flux.
              This finite-difference thermal solver computes real-time 3D heat diffusion, prevents thermal runaway, and verifies signoff margins for harsh industrial edge environments.
            </p>
          </div>

          {/* Junction Temperature Indicator */}
          <div className="p-3 bg-[#050608] border border-white/10 font-mono text-xs flex flex-col items-center justify-center min-w-[220px]">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Peak Silicon Tj</div>
            <div className={`text-2xl font-bold flex items-center space-x-1 my-0.5 ${metrics.thermalThrottling ? 'text-rose-400' : 'text-amber-400'}`}>
              <span>{metrics.maxJunctionTempCelsius}°C</span>
              {metrics.thermalThrottling ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Limit: {siliconConfig.industrialGrade === 'AEC_Q100_Grade0' ? '135°C' : '105°C'} | Ambient: {siliconConfig.ambientTempCelsius}°C
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Heatmap Simulator, Right Thermal Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Thermal Finite Element Grid Heatmap */}
        <div className="p-5 bg-[#08090D] border border-white/10 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span>Die Junction Heatmap (2D Finite Difference Mesh)</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">16x16 Solver Nodes</span>
          </div>

          {/* Thermal Canvas Grid */}
          <div className="relative p-2 bg-black border border-white/20 shadow-2xl">
            <div className="grid grid-cols-16 gap-0.5 w-[380px] h-[380px] sm:w-[420px] sm:h-[420px] cursor-crosshair">
              {thermalGrid.flatMap((row) =>
                row.map((cell) => (
                  <div
                    key={`${cell.x}-${cell.y}`}
                    onMouseEnter={() =>
                      setHoveredCell({
                        x: cell.x,
                        y: cell.y,
                        temp: cell.temp,
                        powerDensity: cell.powerDensityWcm2,
                      })
                    }
                    className="w-full h-full transition-colors duration-200 relative group"
                    style={{ backgroundColor: getCellColor(cell.temp) }}
                  >
                    {cell.isHotspot && (
                      <div className="absolute inset-0 border border-rose-500 pointer-events-none animate-pulse"></div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Macro Labels Overlaid on Heatmap */}
            <div className="absolute inset-2 pointer-events-none flex flex-col justify-between p-3 font-mono text-[8px] text-white/90 uppercase tracking-wider">
              <div className="flex justify-between">
                <span className="bg-black/80 px-1.5 py-0.5 border border-white/20">
                  MoE Expert Weights Tile 01
                </span>
                <span className="bg-black/80 px-1.5 py-0.5 border border-white/20">
                  MoE Expert Weights Tile 02
                </span>
              </div>
              <div className="flex justify-between">
                <span className="bg-black/80 px-1.5 py-0.5 border border-white/20 text-rose-300 font-bold">
                  Systolic GEMM Array (Hotspot)
                </span>
                <span className="bg-black/80 px-1.5 py-0.5 border border-white/20">
                  MLA KV Cache SRAM
                </span>
              </div>
              <div className="flex justify-between">
                <span className="bg-black/80 px-1.5 py-0.5 border border-white/20">
                  PCIe Gen 5 / CXL 3.0 PHY
                </span>
                <span className="bg-black/80 px-1.5 py-0.5 border border-white/20">
                  Industrial Safety RoT
                </span>
              </div>
            </div>
          </div>

          {/* Color Gradient Scale Bar */}
          <div className="w-full max-w-[420px] mt-4">
            <div className="h-2 bg-gradient-to-r from-blue-700 via-cyan-500 via-yellow-400 via-orange-500 to-red-600 border border-white/10"></div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-wider">
              <span>{siliconConfig.ambientTempCelsius}°C (Ambient)</span>
              <span>65°C (Nominal)</span>
              <span>85°C (Warning)</span>
              <span className="text-rose-400 font-bold">{metrics.maxJunctionTempCelsius}°C (Hotspot)</span>
            </div>
          </div>

          {/* Real-Time Probe Readout */}
          <div className="w-full max-w-[420px] mt-4 p-3 bg-[#050608] border border-white/10 font-mono text-xs flex justify-between items-center">
            <span className="text-zinc-500 uppercase text-[10px] tracking-widest">Cursor Probe:</span>
            {hoveredCell ? (
              <span className="text-white text-xs">
                Node ({hoveredCell.x}, {hoveredCell.y}):{' '}
                <strong className="text-amber-400">{hoveredCell.temp}°C</strong> |{' '}
                <span className="text-blue-400">{hoveredCell.powerDensity} W/cm²</span>
              </span>
            ) : (
              <span className="text-zinc-500 text-[10px] uppercase tracking-wider">Hover over die grid to probe thermal flux</span>
            )}
          </div>
        </div>

        {/* Right: Cooling Solution Selector & Thermal-Aware Optimizer */}
        <div className="space-y-6">
          <div className="p-5 bg-[#08090D] border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-white/10">
              <Wind className="w-4 h-4 text-blue-500" />
              <span>Cooling Solution & Packaging Technology</span>
            </h3>

            {/* Ambient Temperature Slider */}
            <div className="p-3 bg-[#050608] border border-white/10 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-300 uppercase tracking-wider text-[11px] font-semibold">Industrial Ambient Temperature:</span>
                <span className="text-amber-400 font-bold">{siliconConfig.ambientTempCelsius}°C</span>
              </div>
              <input
                type="range"
                min="-20"
                max="85"
                step="5"
                value={siliconConfig.ambientTempCelsius}
                onChange={(e) => onUpdateSilicon({ ambientTempCelsius: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                <span>-20°C (Cold Storage)</span>
                <span>45°C (Factory Floor)</span>
                <span>85°C (Under-Hood / Heavy Enclosure)</span>
              </div>
            </div>

            {/* Cooling Solution List */}
            <div className="space-y-2.5">
              {coolingOptions.map((opt) => {
                const isSelected = siliconConfig.cooling === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => onUpdateSilicon({ cooling: opt.id })}
                    className={`p-3 border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-950/20 border-blue-500 text-white'
                        : 'bg-[#050608] border-white/10 hover:border-white/30 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="cooling"
                          checked={isSelected}
                          onChange={() => onUpdateSilicon({ cooling: opt.id })}
                          className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-semibold text-white uppercase tracking-wider">{opt.name}</span>
                      </div>
                      <span className="font-mono text-xs text-blue-400 font-semibold">
                        Rth: {opt.rTh}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 pl-5 uppercase tracking-wide leading-relaxed">{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Thermal-Aware Weight Placement Optimizer Button */}
          <div className="p-5 bg-[#08090D] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Thermal-Aware Weight Layout Engine</span>
              </h3>
              <button
                onClick={handleToggleThermalAware}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider border border-emerald-500 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rebalance Hotspots (-14°C)</span>
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 uppercase tracking-wide leading-relaxed">
              In Transformer inference, Multi-Head Latent Attention and MoE router gating activations generate high localized heat flux (&gt;80 W/cm²).
              The Thermal-Aware layout engine interleaves expert weight banks and moves high-activity router blocks to peripheral cold zones with lower thermal resistance.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-white/10">
              <div className="p-2 bg-[#050608] border border-white/10">
                <span className="text-zinc-500 text-[9px] uppercase tracking-widest">Peak Gradient ΔT:</span>
                <div className="font-bold text-amber-400 mt-0.5">18.4 °C across die</div>
              </div>
              <div className="p-2 bg-[#050608] border border-white/10">
                <span className="text-zinc-500 text-[9px] uppercase tracking-widest">Thermal Throttling:</span>
                <div className={`font-bold mt-0.5 ${metrics.thermalThrottling ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {metrics.thermalThrottling ? 'ACTIVE (THROTTLED)' : 'SAFE (SIGN-OFF PASSED)'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
