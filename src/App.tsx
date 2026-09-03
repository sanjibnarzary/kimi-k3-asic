import React, { useState, useMemo } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  FloorplanViewer 
} from './components/FloorplanViewer';
import { 
  KimiWeightOptimizer 
} from './components/KimiWeightOptimizer';
import { 
  ThermalSimulator 
} from './components/ThermalSimulator';
import { 
  InterconnectAnalyzer 
} from './components/InterconnectAnalyzer';
import { 
  IndustrialEdgeProfile 
} from './components/IndustrialEdgeProfile';
import { 
  RTLSignoffModal 
} from './components/RTLSignoffModal';
import { 
  KimiModelConfig, 
  SiliconProcessConfig, 
  MacroBlock 
} from './types/eda';
import { 
  KIMI_PRESETS, 
  DEFAULT_SILICON_CONFIG, 
  generateInitialMacros, 
  calculateOptimizationMetrics, 
  calculatePowerMetrics, 
  calculateLatencyMetrics 
} from './utils/edaCalculations';

export default function App() {
  const [model, setModel] = useState<KimiModelConfig>(KIMI_PRESETS['kimi-k3-edge-moe']);
  const [siliconConfig, setSiliconConfig] = useState<SiliconProcessConfig>(DEFAULT_SILICON_CONFIG);
  const [macros, setMacros] = useState<MacroBlock[]>(generateInitialMacros(24, 24));
  const [activeTab, setActiveTab] = useState<'floorplan' | 'weights' | 'thermal' | 'interconnect' | 'industrial' | 'signoff'>('floorplan');
  const [signoffModalOpen, setSignoffModalOpen] = useState(false);

  // Compute live EDA metrics
  const metrics = useMemo(() => {
    return calculateOptimizationMetrics(model, siliconConfig, macros);
  }, [model, siliconConfig, macros]);

  const powerMetrics = useMemo(() => {
    return calculatePowerMetrics(model, siliconConfig, macros);
  }, [model, siliconConfig, macros]);

  const latencyMetrics = useMemo(() => {
    return calculateLatencyMetrics(model, siliconConfig);
  }, [model, siliconConfig]);

  const handleSelectPreset = (presetKey: string) => {
    if (KIMI_PRESETS[presetKey]) {
      setModel(KIMI_PRESETS[presetKey]);
    }
  };

  const handleUpdateModel = (updated: Partial<KimiModelConfig>) => {
    setModel((prev) => ({ ...prev, ...updated }));
  };

  const handleUpdateSilicon = (updated: Partial<SiliconProcessConfig>) => {
    setSiliconConfig((prev) => ({ ...prev, ...updated }));
  };

  const handleAutoFloorplan = () => {
    // Re-layout macros in symmetric, wirelength-optimal arrangement
    setMacros([
      {
        id: 'macro-weight-01',
        name: '3D Weight Storage Tile 01 (MoE Experts 0-7)',
        type: 'weight_macro',
        x: 2,
        y: 2,
        width: 9,
        height: 9,
        powerWatts: 4.8,
        tempCelsius: 64,
        activityRate: 0.65,
        tier: 'memory_tier_stack',
        description: '64-tier 3D ReRAM crossbar monolithic stack storing primary transformer expert weights.',
        color: '#0284c7',
      },
      {
        id: 'macro-weight-02',
        name: '3D Weight Storage Tile 02 (MoE Experts 8-15)',
        type: 'weight_macro',
        x: 13,
        y: 2,
        width: 9,
        height: 9,
        powerWatts: 4.6,
        tempCelsius: 63,
        activityRate: 0.62,
        tier: 'memory_tier_stack',
        description: '64-tier 3D ReRAM crossbar storing upper transformer MoE expert weights.',
        color: '#0284c7',
      },
      {
        id: 'macro-compute-01',
        name: 'Systolic GEMM Array 01 (MLA & Attention Core)',
        type: 'compute_core',
        x: 2,
        y: 12,
        width: 6,
        height: 6,
        powerWatts: 14.5,
        tempCelsius: 78,
        activityRate: 0.95,
        tier: 'logic_base',
        description: 'Multi-Head Latent Attention decompression and QKV systolic projection engine.',
        color: '#ea580c',
      },
      {
        id: 'macro-compute-02',
        name: 'Systolic GEMM Array 02 (MoE Feed-Forward)',
        type: 'compute_core',
        x: 9,
        y: 12,
        width: 6,
        height: 6,
        powerWatts: 16.2,
        tempCelsius: 82,
        activityRate: 0.92,
        tier: 'logic_base',
        description: 'Compute-in-Memory near-weight activation matrix multiplication units.',
        color: '#ea580c',
      },
      {
        id: 'macro-mla-kv',
        name: 'MLA Compressed KV-Cache SRAM Bank',
        type: 'mla_kv_cache',
        x: 16,
        y: 12,
        width: 6,
        height: 6,
        powerWatts: 5.2,
        tempCelsius: 68,
        activityRate: 0.70,
        tier: 'logic_base',
        description: 'Ultra-low latency dual-port SRAM storing latent compressed KV pairs for 128k context.',
        color: '#16a34a',
      },
      {
        id: 'macro-pcie-cxl',
        name: 'PCIe Gen 5 x16 / CXL 3.0 Controller & PHY',
        type: 'pcie_cxl_phy',
        x: 2,
        y: 19,
        width: 10,
        height: 3.5,
        powerWatts: 5.2,
        tempCelsius: 66,
        activityRate: 0.75,
        tier: 'logic_base',
        description: '32 GT/s PAM-4 PHY with CXL.io, CXL.mem, and CXL.cache flit link protocol engines.',
        color: '#8b5cf6',
      },
      {
        id: 'macro-noc-router',
        name: '2D Mesh NoC Interconnect & Crossbar',
        type: 'noc_router',
        x: 13,
        y: 19,
        width: 5,
        height: 3.5,
        powerWatts: 3.8,
        tempCelsius: 61,
        activityRate: 0.88,
        tier: 'logic_base',
        description: 'Ultra-low latency packet-switched routing matrix connecting compute tiles with memory.',
        color: '#0891b2',
      },
      {
        id: 'macro-rot-safety',
        name: 'AEC-Q100 / IEC 61508 Industrial Safety RoT',
        type: 'safety_rot',
        x: 19,
        y: 19,
        width: 3.5,
        height: 3.5,
        powerWatts: 1.4,
        tempCelsius: 58,
        activityRate: 0.40,
        tier: 'logic_base',
        description: 'Lockstep execution checkers, hardware ECC scrubbers, and cryptographic secure boot.',
        color: '#d97706',
      },
    ]);
  };

  const handleApplyThermalAwareFloorplan = () => {
    // Distribute hot systolic cores towards corners and periphery with high heat spreading
    setMacros((prev) =>
      prev.map((m) => {
        if (m.id === 'macro-compute-01') {
          return { ...m, x: 2, y: 12, tempCelsius: 68 };
        }
        if (m.id === 'macro-compute-02') {
          return { ...m, x: 16, y: 12, tempCelsius: 70 };
        }
        if (m.id === 'macro-mla-kv') {
          return { ...m, x: 9, y: 12, tempCelsius: 62 };
        }
        return { ...m, tempCelsius: Math.max(54, m.tempCelsius - 5) };
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#050608] text-[#D1D5DB] font-mono selection:bg-blue-500/30 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Background dot grid pattern overlay */}
      <div className="fixed inset-0 pointer-events-none geometric-grid-dots opacity-10 z-0"></div>

      {/* Top Header & Navigation */}
      <Header
        currentModel={model}
        siliconConfig={siliconConfig}
        metrics={metrics}
        powerMetrics={powerMetrics}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectPreset={handleSelectPreset}
        onOpenSignoff={() => setSignoffModalOpen(true)}
      />

      {/* Main EDA Workspace Views */}
      <main className="flex-1 flex flex-col relative z-10">
        {activeTab === 'floorplan' && (
          <FloorplanViewer
            macros={macros}
            siliconConfig={siliconConfig}
            metrics={metrics}
            model={model}
            onUpdateMacros={setMacros}
            onAutoFloorplan={handleAutoFloorplan}
          />
        )}

        {activeTab === 'weights' && (
          <KimiWeightOptimizer
            model={model}
            siliconConfig={siliconConfig}
            metrics={metrics}
            onUpdateModel={handleUpdateModel}
            onUpdateSilicon={handleUpdateSilicon}
          />
        )}

        {activeTab === 'thermal' && (
          <ThermalSimulator
            macros={macros}
            siliconConfig={siliconConfig}
            powerMetrics={powerMetrics}
            metrics={metrics}
            onUpdateSilicon={handleUpdateSilicon}
            onApplyThermalAwareFloorplan={handleApplyThermalAwareFloorplan}
          />
        )}

        {activeTab === 'interconnect' && (
          <InterconnectAnalyzer
            siliconConfig={siliconConfig}
            powerMetrics={powerMetrics}
            latency={latencyMetrics}
            model={model}
            onUpdateSilicon={handleUpdateSilicon}
          />
        )}

        {activeTab === 'industrial' && (
          <IndustrialEdgeProfile
            siliconConfig={siliconConfig}
            metrics={metrics}
            latency={latencyMetrics}
            onUpdateSilicon={handleUpdateSilicon}
          />
        )}
      </main>

      {/* Geometric Balance Technical Footer */}
      <footer className="h-10 border-t border-white/10 bg-[#0A0C12] flex items-center px-6 justify-between text-[10px] text-zinc-500 uppercase tracking-wider font-mono z-10 shrink-0">
        <span>Autonomous Industrial Spec // Industrial Edge Deployment</span>
        <span className="hidden sm:inline">Project ID: KIMI-K3-88219 • Node: {siliconConfig.processNode.replace('_', ' ')}</span>
        <span>Precision: {model.precision} Hybrid • 3D {siliconConfig.memoryTiersCount}-Tier</span>
      </footer>

      {/* RTL Synthesis & Signoff Modal */}
      <RTLSignoffModal
        isOpen={signoffModalOpen}
        onClose={() => setSignoffModalOpen(false)}
        model={model}
        siliconConfig={siliconConfig}
        metrics={metrics}
        powerMetrics={powerMetrics}
      />
    </div>
  );
}
