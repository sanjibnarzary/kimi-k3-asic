import React, { useState } from 'react';
import { 
  Layers, 
  Move, 
  CheckCircle2, 
  AlertTriangle, 
  Maximize2, 
  RotateCcw, 
  Zap, 
  Flame, 
  Eye, 
  Box, 
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { 
  MacroBlock, 
  SiliconProcessConfig, 
  EDAOptimizationMetrics, 
  KimiModelConfig 
} from '../types/eda';

interface FloorplanViewerProps {
  macros: MacroBlock[];
  siliconConfig: SiliconProcessConfig;
  metrics: EDAOptimizationMetrics;
  model: KimiModelConfig;
  onUpdateMacros: (macros: MacroBlock[]) => void;
  onAutoFloorplan: () => void;
}

export const FloorplanViewer: React.FC<FloorplanViewerProps> = ({
  macros,
  siliconConfig,
  metrics,
  model,
  onUpdateMacros,
  onAutoFloorplan,
}) => {
  const [viewMode, setViewMode] = useState<'2d_floorplan' | '3d_cross_section'>('2d_floorplan');
  const [selectedMacroId, setSelectedMacroId] = useState<string | null>(macros[0]?.id || null);
  const [showPowerDensity, setShowPowerDensity] = useState(true);
  const [showThermalOverlay, setShowThermalOverlay] = useState(false);
  const [showMeshNoC, setShowMeshNoC] = useState(true);
  const [showBSPDN, setShowBSPDN] = useState(true);
  
  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const selectedMacro = macros.find((m) => m.id === selectedMacroId);

  // Die coordinate scaling (canvas width is 560px, representing dieWidthMm)
  const scale = 540 / siliconConfig.dieWidthMm;

  const handleMouseDown = (e: React.MouseEvent, macro: MacroBlock) => {
    e.stopPropagation();
    setSelectedMacroId(macro.id);
    setDraggingId(macro.id);
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (rect) {
      const clickX = (e.clientX - rect.left) / scale;
      const clickY = (e.clientY - rect.top) / scale;
      setDragOffset({
        x: clickX - macro.x,
        y: clickY - macro.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / scale;
    const currentY = (e.clientY - rect.top) / scale;

    const newX = Math.max(0, Math.min(siliconConfig.dieWidthMm - 2, +(currentX - dragOffset.x).toFixed(1)));
    const newY = Math.max(0, Math.min(siliconConfig.dieHeightMm - 2, +(currentY - dragOffset.y).toFixed(1)));

    const updated = macros.map((m) => {
      if (m.id === draggingId) {
        return {
          ...m,
          x: Math.min(newX, siliconConfig.dieWidthMm - m.width),
          y: Math.min(newY, siliconConfig.dieHeightMm - m.height),
        };
      }
      return m;
    });
    onUpdateMacros(updated);
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 min-h-[calc(100vh-120px)] bg-[#050608] text-[#D1D5DB] font-mono">
      {/* Left Column: Interactive Canvas & Floorplan Controls */}
      <div className="flex-1 flex flex-col bg-[#08090D] border border-white/10 p-4">
        {/* Subheader / Canvas Toolbar */}
        <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-white/10 gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex bg-[#050608] p-0.5 border border-white/10 text-xs font-mono">
              <button
                onClick={() => setViewMode('2d_floorplan')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 uppercase tracking-wider text-xs transition ${
                  viewMode === '2d_floorplan'
                    ? 'bg-blue-600 text-white font-bold border border-blue-500'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2D Silicon Floorplan</span>
              </button>
              <button
                onClick={() => setViewMode('3d_cross_section')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 uppercase tracking-wider text-xs transition ${
                  viewMode === '3d_cross_section'
                    ? 'bg-blue-600 text-white font-bold border border-blue-500'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D Monolithic Stack</span>
              </button>
            </div>

            {/* DRC Status Badge */}
            <div
              className={`flex items-center space-x-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border ${
                metrics.drcViolationCount === 0
                  ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {metrics.drcViolationCount === 0 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DRC: 0 VIOLATIONS (PASS)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>DRC: {metrics.drcViolationCount} VIOLATIONS</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <button
              onClick={onAutoFloorplan}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-[0.1em] border border-blue-500 transition cursor-pointer"
              title="Automatically arrange macros for minimum wirelength and thermal balance"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Auto-Floorplan</span>
            </button>

            <button
              onClick={() => setShowPowerDensity(!showPowerDensity)}
              className={`px-2.5 py-1.5 border text-[10px] uppercase tracking-wider transition ${
                showPowerDensity
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-[#050608] border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              Power W/cm²
            </button>

            <button
              onClick={() => setShowThermalOverlay(!showThermalOverlay)}
              className={`px-2.5 py-1.5 border text-[10px] uppercase tracking-wider transition ${
                showThermalOverlay
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                  : 'bg-[#050608] border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              Thermal Tj
            </button>

            <button
              onClick={() => setShowMeshNoC(!showMeshNoC)}
              className={`px-2.5 py-1.5 border text-[10px] uppercase tracking-wider transition ${
                showMeshNoC
                  ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                  : 'bg-[#050608] border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              NoC Mesh
            </button>
          </div>
        </div>

        {/* Canvas Display */}
        {viewMode === '2d_floorplan' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-3 bg-[#050608] border border-white/10 overflow-hidden relative select-none">
            {/* Legend / Coordinate tags */}
            <div className="w-full flex flex-wrap items-center justify-between text-[10px] font-mono text-zinc-500 mb-2 px-2 uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 bg-blue-500 inline-block"></span>
                <span>3D Weight Storage ({siliconConfig.memoryTiersCount} Tiers)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 bg-orange-500 inline-block"></span>
                <span>Systolic MLA Compute</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 bg-purple-500 inline-block"></span>
                <span>PCIe Gen 5 / CXL 3.0</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 bg-emerald-500 inline-block"></span>
                <span>MLA KV Cache</span>
              </span>
              <span className="text-zinc-400">Die: {siliconConfig.dieWidthMm} x {siliconConfig.dieHeightMm} mm</span>
            </div>

            {/* Geometric Die Canvas Border Box */}
            <div className="p-2 border-2 border-white/20 bg-black shadow-2xl">
              <div
                className="relative border border-white/40 bg-zinc-950 overflow-hidden cursor-crosshair"
                style={{ width: `${scale * siliconConfig.dieWidthMm}px`, height: `${scale * siliconConfig.dieHeightMm}px` }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Die Grid Pattern */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                  <defs>
                    <pattern id="grid" width={scale * 2} height={scale * 2} patternUnits="userSpaceOnUse">
                      <path d={`M ${scale * 2} 0 L 0 0 0 ${scale * 2}`} fill="none" stroke="#3b82f6" strokeWidth="0.75" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Backside Power Delivery Network (BSPDN) Visual Mesh */}
                {showBSPDN && (
                  <div className="absolute inset-0 pointer-events-none opacity-10">
                    <div className="w-full h-full bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  </div>
                )}

                {/* NoC (Network on Chip) Mesh Interconnect Traces */}
                {showMeshNoC && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {/* Draw inter-macro data buses */}
                    <line
                      x1={scale * 6.5}
                      y1={scale * 6.5}
                      x2={scale * 6.5}
                      y2={scale * 15}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="opacity-70"
                    />
                    <line
                      x1={scale * 17.5}
                      y1={scale * 6.5}
                      x2={scale * 12}
                      y2={scale * 15}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="opacity-70"
                    />
                    <line
                      x1={scale * 7}
                      y1={scale * 15}
                      x2={scale * 7}
                      y2={scale * 20.5}
                      stroke="#a855f7"
                      strokeWidth="2.5"
                      className="opacity-80"
                    />
                    <line
                      x1={scale * 12}
                      y1={scale * 15}
                      x2={scale * 15.5}
                      y2={scale * 20.5}
                      stroke="#06b6d4"
                      strokeWidth="2"
                      className="opacity-60"
                    />
                  </svg>
                )}

                {/* Placed Macro Blocks */}
                {macros.map((macro) => {
                  const isSelected = selectedMacroId === macro.id;
                  const isMemory = macro.type === 'weight_macro';
                  return (
                    <div
                      key={macro.id}
                      onMouseDown={(e) => handleMouseDown(e, macro)}
                      className={`absolute select-none border transition-all cursor-grab active:cursor-grabbing ${
                        isSelected
                          ? 'border-white ring-1 ring-blue-400 z-20 shadow-lg shadow-blue-500/20'
                          : 'border-white/20 hover:border-white/50 z-10'
                      }`}
                      style={{
                        left: `${macro.x * scale}px`,
                        top: `${macro.y * scale}px`,
                        width: `${macro.width * scale}px`,
                        height: `${macro.height * scale}px`,
                        backgroundColor: isMemory ? `${macro.color}20` : `${macro.color}30`,
                      }}
                    >
                      {/* Header bar of macro */}
                      <div
                        className="px-1.5 py-0.5 text-[9px] font-mono font-bold flex items-center justify-between truncate uppercase tracking-wider"
                        style={{ backgroundColor: macro.color, color: '#fff' }}
                      >
                        <span className="truncate">{macro.name}</span>
                        <span className="text-[8px] opacity-90">{macro.width}x{macro.height}mm</span>
                      </div>

                      {/* Macro interior details */}
                      <div className="p-1 flex flex-col justify-between h-[calc(100%-20px)] text-[9px] font-mono">
                        <div className="flex flex-col text-zinc-300">
                          {isMemory && (
                            <div className="flex items-center space-x-1 text-blue-300 font-bold text-[9px] uppercase">
                              <Layers className="w-2.5 h-2.5" />
                              <span>{siliconConfig.memoryTiersCount} TIERS 3D</span>
                            </div>
                          )}
                          <div className="text-[8px] text-zinc-500 truncate uppercase">
                            {macro.type.replace('_', ' ')}
                          </div>
                        </div>

                        {/* Power / Thermal badge inside macro */}
                        <div className="flex items-center justify-between text-[8px] pt-1 border-t border-white/10">
                          {showPowerDensity && (
                            <span className="flex items-center space-x-0.5 text-amber-300 font-bold">
                              <Zap className="w-2 h-2" />
                              <span>{macro.powerWatts}W</span>
                            </span>
                          )}
                          {showThermalOverlay && (
                            <span
                              className={`flex items-center space-x-0.5 ${
                                macro.tempCelsius > 75 ? 'text-rose-400 font-bold' : 'text-emerald-400'
                              }`}
                            >
                              <Flame className="w-2 h-2" />
                              <span>{macro.tempCelsius}°C</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Silicon Edge I/O Serial Physical Boundary Indicators (PCIe Gen 5 / CXL 3.0 Balls) */}
                <div className="absolute bottom-0 left-4 right-4 h-2 bg-gradient-to-t from-purple-600/60 to-transparent border-t border-purple-400/50 flex items-center justify-around pointer-events-none">
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <div key={idx} className="w-1.5 h-1.5 bg-purple-400 animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Geometric Metrics Display with Vertical Dividers */}
            <div className="w-full max-w-xl flex items-center justify-around py-3 mt-3 border-t border-b border-white/10 bg-[#0A0C12] text-center font-mono">
              <div className="flex flex-col items-center">
                <span className="text-xl lg:text-2xl font-bold text-white leading-none">
                  {((metrics.macrosPlacedAreaMm2 / metrics.dieAreaMm2) * 100).toFixed(1)}%
                </span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Area Efficiency</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10"></div>
              <div className="flex flex-col items-center">
                <span className="text-xl lg:text-2xl font-bold text-white leading-none">0.82ms</span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Inference Latency</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10"></div>
              <div className="flex flex-col items-center">
                <span className="text-xl lg:text-2xl font-bold text-white leading-none">
                  {macros.reduce((acc, m) => acc + m.powerWatts, 0).toFixed(0)}W
                </span>
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Peak Power Draw</span>
              </div>
            </div>

            {/* Bottom scale indicator */}
            <div className="w-full flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-2 px-2 uppercase tracking-wider">
              <span>Origin (0.0, 0.0) mm</span>
              <span className="text-blue-400 font-semibold">
                Die: {siliconConfig.dieWidthMm} x {siliconConfig.dieHeightMm} mm • Area: {metrics.dieAreaMm2} mm² (Reticle Cap: 858 mm²)
              </span>
              <span>Boundary ({siliconConfig.dieWidthMm}.0, {siliconConfig.dieHeightMm}.0) mm</span>
            </div>
          </div>
        ) : (
          /* 3D Monolithic Stack Cross-Section View */
          <div className="flex-1 flex flex-col bg-[#050608] border border-white/10 p-5 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Box className="w-4 h-4 text-blue-500" />
                <span>Vertical Monolithic 3D Silicon Stack Cross-Section</span>
              </h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                Physical layer stack enabling all Kimi K3 weights to fit directly on silicon with zero external DRAM.
              </p>
            </div>

            {/* Vertical Stack Diagram */}
            <div className="flex flex-col space-y-2 max-w-2xl mx-auto w-full font-mono text-xs">
              {/* Layer 1: Diamond Heat Spreader */}
              <div className="p-3 bg-[#08090D] border border-cyan-500/50">
                <div className="flex justify-between items-center text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
                  <span>TOP: Integrated Diamond Heat Spreader</span>
                  <span className="text-[9px] text-cyan-400">Thickness: 500 µm (k = 2000 W/m·K)</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wide">
                  Ultra-high thermal conductivity dissipates heat directly from the monolithic stack at 45°C ambient.
                </p>
              </div>

              {/* Layer 2: Thermal Interface Material */}
              <div className="p-2 bg-[#050608] border border-white/10 text-[10px] flex justify-between text-zinc-400 uppercase tracking-wider">
                <span>Thermal Interface Material (TIM-2) Liquid Metal Bond</span>
                <span>Thickness: 25 µm</span>
              </div>

              {/* Layer 3: 3D Monolithic Memory Tiers Stack */}
              <div className="p-4 bg-blue-950/20 border-2 border-blue-500">
                <div className="flex justify-between items-center text-white font-bold text-xs uppercase tracking-wider">
                  <span className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>3D Monolithic Weight Storage: {siliconConfig.memoryTiersCount} Vertical Tiers</span>
                  </span>
                  <span className="px-2 py-0.5 bg-blue-600/20 text-blue-300 border border-blue-500/40 text-[10px]">
                    {metrics.onChipStorageAvailableGB} GB ON-CHIP ({siliconConfig.memoryTech.toUpperCase()})
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-zinc-300 space-y-1 uppercase tracking-wide">
                  <p>• Zero External DRAM: Stores complete Kimi K3 pretrained model weights.</p>
                  <p>• Ultra-High Density: Vertical crossbar array (~25.6 Gb/mm² per tier).</p>
                  <p>• Vertical Bitlines: Sub-nanosecond weight activation with 0.18 pJ/bit read energy.</p>
                </div>

                {/* Sub-tier visual representation */}
                <div className="mt-3 grid grid-cols-8 gap-1 opacity-70">
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <div key={idx} className="h-2 bg-blue-500"></div>
                  ))}
                </div>
              </div>

              {/* Layer 4: Cu-Cu Hybrid Direct Bonding Interface */}
              <div className="p-2 bg-[#08090D] border border-amber-500/40 text-[10px] flex justify-between text-amber-300 uppercase tracking-wider">
                <span>Cu-Cu Direct Hybrid Wafer Bonding Interface ({siliconConfig.bondingPitchUm} µm Pitch)</span>
                <span>Density: &gt;1.5x10⁶ vias/mm²</span>
              </div>

              {/* Layer 5: Base Active Logic Die */}
              <div className="p-3 bg-[#08090D] border border-orange-500/50">
                <div className="flex justify-between items-center text-orange-300 font-bold uppercase tracking-wider text-[11px]">
                  <span>BASE LOGIC: 3nm GAAFET Tensor & Systolic Engine</span>
                  <span className="text-[9px] text-orange-400">Thickness: 55 µm</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wide">
                  Hosts Kimi MLA decompression, Sparse MoE matrix units, 2D mesh routers, and PCIe Gen 5 / CXL 3.0 controllers.
                </p>
              </div>

              {/* Layer 6: Backside Power Delivery Network (BSPDN) */}
              <div className="p-3 bg-[#08090D] border border-purple-500/50 text-purple-300">
                <div className="flex justify-between items-center font-bold uppercase tracking-wider text-[11px]">
                  <span>BACKSIDE: Backside Power Delivery Network (BSPDN / PowerVia)</span>
                  <span className="text-[9px] text-purple-400">Zero IR-Drop Degradation</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wide">
                  Direct backside TSV power routing isolates high-current rails from signal metal layers.
                </p>
              </div>

              {/* Layer 7: Micro-bumps */}
              <div className="p-2 bg-[#050608] border border-white/10 text-[10px] flex justify-between text-zinc-500 uppercase tracking-wider">
                <span>C4 Micro-Bumps to High-Speed Serial Package (PCIe Gen 5 / CXL 3.0)</span>
                <span>Bump Pitch: 40 µm</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Macro Inspector & Silicon Summary Panel */}
      <div className="w-full lg:w-80 flex flex-col space-y-4">
        {/* Selected Macro Inspector */}
        <div className="p-4 bg-[#08090D] border border-white/10">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Move className="w-3.5 h-3.5 text-blue-500" />
              <span>Macro Inspector</span>
            </h3>
            <span className="text-[10px] font-mono text-blue-400">{selectedMacro?.id}</span>
          </div>

          {selectedMacro ? (
            <div className="space-y-3 text-xs font-mono">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Macro Name</div>
                <div className="font-semibold text-white mt-0.5">{selectedMacro.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-[#050608] border border-white/10">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Position</div>
                  <div className="font-bold text-white mt-0.5">{selectedMacro.x} mm, {selectedMacro.y} mm</div>
                </div>
                <div className="p-2 bg-[#050608] border border-white/10">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Area</div>
                  <div className="font-bold text-white mt-0.5">
                    {(selectedMacro.width * selectedMacro.height).toFixed(1)} mm²
                  </div>
                </div>
                <div className="p-2 bg-[#050608] border border-white/10">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Power</div>
                  <div className="font-bold text-amber-400 mt-0.5">{selectedMacro.powerWatts} W</div>
                </div>
                <div className="p-2 bg-[#050608] border border-white/10">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Tj Temp</div>
                  <div className={`font-bold mt-0.5 ${selectedMacro.tempCelsius > 75 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedMacro.tempCelsius} °C
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Architecture Function</div>
                <p className="text-[10px] text-zinc-400 leading-relaxed bg-[#050608] p-2.5 border border-white/10">
                  {selectedMacro.description}
                </p>
              </div>

              <div className="p-2.5 bg-blue-950/20 border border-blue-600/30 text-[10px] text-blue-300">
                <span className="font-bold text-white uppercase tracking-wide">Kimi Mapping: </span>
                {selectedMacro.type === 'weight_macro'
                  ? 'All MoE Expert matrices directly fabricated in 3D NVM stack.'
                  : selectedMacro.type === 'compute_core'
                  ? 'Executes Multi-Head Latent Attention and QKV Feed-Forward tensor math.'
                  : selectedMacro.type === 'pcie_cxl_phy'
                  ? '32 GT/s Serial Links carrying input prompts and output tokens with CXL.mem.'
                  : 'Hardware support macro.'}
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 py-6 text-center uppercase tracking-wider">Click a macro to inspect</div>
          )}
        </div>

        {/* Silicon Architecture Quick Metrics Card */}
        <div className="p-4 bg-[#08090D] border border-white/10 text-xs space-y-3 font-mono">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-white/10">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Silicon Area & Storage Fit</span>
          </h3>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 uppercase text-[10px] tracking-wider">Total Weight Size:</span>
              <span className="text-white font-bold">{metrics.totalStorageRequiredGB} GB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 uppercase text-[10px] tracking-wider">On-Chip Capacity:</span>
              <span className="text-emerald-400 font-bold">{metrics.onChipStorageAvailableGB} GB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 uppercase text-[10px] tracking-wider">Storage Fit Ratio:</span>
              <span className="text-emerald-400 font-bold">{metrics.storageFitPercentage}% (100% On-Chip)</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-500"
                style={{ width: `${metrics.storageFitPercentage}%` }}
              ></div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center">
              <span className="text-zinc-500 uppercase text-[10px] tracking-wider">Aggregate BW:</span>
              <span className="text-blue-400 font-bold">{metrics.peakOnChipBandwidthTBps} TB/s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 uppercase text-[10px] tracking-wider">Real-Time Jitter:</span>
              <span className="text-emerald-300 font-bold">&lt;{metrics.deterministicJitterUs} µs</span>
            </div>
          </div>

          <div className="p-2.5 bg-emerald-400/10 border border-emerald-400/20 text-[10px] text-emerald-400 leading-relaxed uppercase tracking-wide">
            <strong>Zero-DRAM Achieved:</strong> Embedding all weights in monolithic 3D silicon cuts memory latency by 63x and eliminates DRAM refresh power.
          </div>
        </div>
      </div>
    </div>
  );
};
