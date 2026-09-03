import React from 'react';
import { 
  Cpu, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Database, 
  ShieldAlert,
  Zap,
  Info
} from 'lucide-react';
import { 
  KimiModelConfig, 
  SiliconProcessConfig, 
  EDAOptimizationMetrics, 
  QuantizationPrecision, 
  MemoryTechType 
} from '../types/eda';
import { getBytesPerParam, getMemoryDensityPerTier } from '../utils/edaCalculations';

interface KimiWeightOptimizerProps {
  model: KimiModelConfig;
  siliconConfig: SiliconProcessConfig;
  metrics: EDAOptimizationMetrics;
  onUpdateModel: (updated: Partial<KimiModelConfig>) => void;
  onUpdateSilicon: (updated: Partial<SiliconProcessConfig>) => void;
}

export const KimiWeightOptimizer: React.FC<KimiWeightOptimizerProps> = ({
  model,
  siliconConfig,
  metrics,
  onUpdateModel,
  onUpdateSilicon,
}) => {
  const precisionOptions: { id: QuantizationPrecision; label: string; bits: number; desc: string }[] = [
    {
      id: 'MXFP4',
      label: 'MXFP4 (OCP Microscaling)',
      bits: 4,
      desc: 'Industry standard for ultra-dense edge LLM weights. Preserves full perplexity with 4-bit mantissa and shared E8M0 scale vectors.'
    },
    {
      id: 'INT4',
      label: 'INT4 (Symmetric)',
      bits: 4,
      desc: 'Integer 4-bit quantization with group-wise scaling. Highly optimized for systolic integer MAC units.'
    },
    {
      id: 'TERNARY_1_58',
      label: 'Ternary 1.58-bit {-1, 0, 1}',
      bits: 1.58,
      desc: 'Extreme density ternary weights. Replaces floating point multiplication with simple addition/subtraction, slashing silicon area.'
    },
    {
      id: 'MXFP6',
      label: 'MXFP6 (Microscaling 6-bit)',
      bits: 6,
      desc: 'High-precision microscaling for safety-critical industrial vision-language models with minimal quantization noise.'
    },
    {
      id: 'FP8_E4M3',
      label: 'FP8 (E4M3 Standard)',
      bits: 8,
      desc: 'Direct FP8 weights from pretraining checkpoint without requantization overhead.'
    }
  ];

  const memoryTechOptions: { id: MemoryTechType; name: string; density: string; endurance: string; readEnergy: string; desc: string }[] = [
    {
      id: '3d-reram',
      name: '3D ReRAM Crossbar (Memristor)',
      density: '~25.6 Gb/mm² per tier',
      endurance: '10⁶ cycles (Read-Centric)',
      readEnergy: '0.18 pJ/bit',
      desc: 'Monolithic non-volatile resistive memory. Zero standby leakage, sub-4ns read latency, perfect for weights on silicon.'
    },
    {
      id: '3d-fefet',
      name: '3D Ferroelectric FET (FeFET)',
      density: '~20.8 Gb/mm² per tier',
      endurance: '10¹⁰ cycles',
      readEnergy: '0.22 pJ/bit',
      desc: 'High speed non-volatile memory using ferroelectric HfO2 gate dielectric, fully CMOS-compatible.'
    },
    {
      id: '3d-nand-ct',
      name: '3D Charge-Trap Weight ROM',
      density: '~45.0 Gb/mm² per tier',
      endurance: 'Read-Only Weights',
      readEnergy: '0.35 pJ/bit',
      desc: 'Highest volumetric density. Pretrained Kimi K3 weights are mask-programmed into vertical 3D charge-trap cells.'
    },
    {
      id: 'dense-3d-sram',
      name: 'Monolithic 3D-Stacked SRAM',
      density: '~4.5 Gb/mm² per tier',
      endurance: 'Infinite',
      readEnergy: '0.12 pJ/bit',
      desc: 'Highest access speed (<1ns). Best for dynamic KV cache and ultra-high frequency pipeline stages.'
    }
  ];

  return (
    <div className="p-4 min-h-[calc(100vh-120px)] bg-[#050608] text-[#D1D5DB] font-mono space-y-6">
      {/* Top Banner Overview */}
      <div className="p-4 bg-[#08090D] border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-blue-600/10 text-blue-400 border border-blue-500/20">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                All-On-Silicon Weight Mapping & 3D Memory Density Optimizer
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed uppercase tracking-wide">
              Kimi K3 model weights are permanently stored on the silicon die using monolithic 3D vertical memory tiers.
              This eliminates external DDR/LPDDR/HBM DRAM chips, reducing power consumption by 98% and providing instant sub-millisecond edge token generation.
            </p>
          </div>

          {/* Storage Fit Visual Gauge */}
          <div className="p-3 bg-[#050608] border border-white/10 font-mono text-xs flex flex-col items-center justify-center min-w-[220px]">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">On-Chip Weight Fit</div>
            <div className="text-xl font-bold text-emerald-400 flex items-center space-x-1 my-0.5">
              <span>{metrics.storageFitPercentage}%</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
              {metrics.totalStorageRequiredGB} GB Req. / {metrics.onChipStorageAvailableGB} GB Silicon
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Kimi K3 Model Architectural Configuration */}
        <div className="space-y-6">
          <div className="p-5 bg-[#08090D] border border-white/10">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-3 border-b border-white/10">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span>1. Kimi K3 Weight Architecture & Precision</span>
            </h3>

            {/* Model Architecture Highlights: MLA + Sparse MoE */}
            <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono">
              <div className="p-3 bg-[#050608] border border-white/10">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Total Model Parameters:</div>
                <div className="text-base font-bold text-white mt-0.5">{model.totalParamsBillion} Billion</div>
                <div className="text-[9px] text-blue-400 mt-1 uppercase tracking-wide">Entire weight matrix on silicon</div>
              </div>

              <div className="p-3 bg-[#050608] border border-white/10">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Active Parameters / Token:</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">{model.activeParamsBillion} Billion</div>
                <div className="text-[9px] text-zinc-400 mt-1 uppercase tracking-wide">
                  {model.numExperts > 1 ? `Sparse MoE (${model.activeExpertsPerToken} of ${model.numExperts} experts)` : 'Dense'}
                </div>
              </div>

              <div className="p-3 bg-[#050608] border border-white/10">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">MLA Latent Dim (Kimi Attention):</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">{model.latentDimMLA} dims</div>
                <div className="text-[9px] text-zinc-400 mt-1 uppercase tracking-wide">85% KV-cache silicon footprint reduction</div>
              </div>

              <div className="p-3 bg-[#050608] border border-white/10">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Edge Context Window:</div>
                <div className="text-base font-bold text-purple-400 mt-0.5">{(model.contextWindowTokens / 1024).toFixed(0)}k Tokens</div>
                <div className="text-[9px] text-zinc-400 mt-1 uppercase tracking-wide">Industrial telemetry history buffer</div>
              </div>
            </div>

            {/* Precision Selection */}
            <div className="mt-5">
              <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">
                Quantization Precision for Silicon Storage:
              </label>
              <div className="space-y-2">
                {precisionOptions.map((opt) => {
                  const isSelected = model.precision === opt.id;
                  const bytes = getBytesPerParam(opt.id);
                  const approxGB = ((model.totalParamsBillion * 1e9 * bytes) / (1024 ** 3)).toFixed(1);

                  return (
                    <div
                      key={opt.id}
                      onClick={() => onUpdateModel({ precision: opt.id })}
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
                            name="precision"
                            checked={isSelected}
                            onChange={() => onUpdateModel({ precision: opt.id })}
                            className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-semibold text-white uppercase tracking-wider">{opt.label}</span>
                        </div>
                        <div className="font-mono text-xs">
                          <span className="text-blue-400 font-bold">{approxGB} GB</span>
                          <span className="text-zinc-500 text-[10px]"> ({opt.bits} bits/param)</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 pl-5 uppercase tracking-wide leading-relaxed">{opt.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed Weight Breakdown per Transformer Sub-Block */}
          <div className="p-5 bg-[#08090D] border border-white/10">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-white/10">
              <Info className="w-4 h-4 text-blue-500" />
              <span>Kimi K3 Weight Distribution Across Silicon Macros</span>
            </h3>

            <div className="mt-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 bg-[#050608] border border-white/10">
                <span className="text-zinc-400 uppercase text-[10px]">MoE Expert Feed-Forward Matrices (W1, W2, W3):</span>
                <span className="text-blue-400 font-bold">78.4%</span>
              </div>
              <div className="flex justify-between p-2 bg-[#050608] border border-white/10">
                <span className="text-zinc-400 uppercase text-[10px]">Multi-Head Latent Attention (MLA QKV & Proj):</span>
                <span className="text-emerald-400 font-bold">16.8%</span>
              </div>
              <div className="flex justify-between p-2 bg-[#050608] border border-white/10">
                <span className="text-zinc-400 uppercase text-[10px]">MoE Router Gating & RMSNorm Biases:</span>
                <span className="text-amber-400 font-bold">2.2%</span>
              </div>
              <div className="flex justify-between p-2 bg-[#050608] border border-white/10">
                <span className="text-zinc-400 uppercase text-[10px]">Token Embedding & LM Head Shared Matrix:</span>
                <span className="text-purple-400 font-bold">2.6%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Memory Technology & Silicon Stacking Density */}
        <div className="space-y-6">
          <div className="p-5 bg-[#08090D] border border-white/10">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-3 border-b border-white/10">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>2. 3D Memory Stacking & Density Optimization</span>
            </h3>

            {/* Vertical Tiers Slider */}
            <div className="p-4 bg-[#050608] border border-white/10 space-y-3 mt-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-300 uppercase tracking-wider text-[11px] font-semibold">Vertical 3D Memory Tiers:</span>
                <span className="text-blue-400 font-bold text-xs bg-blue-600/20 px-2.5 py-0.5 border border-blue-500/30">
                  {siliconConfig.memoryTiersCount} Layers
                </span>
              </div>
              <input
                type="range"
                min="16"
                max="128"
                step="16"
                value={siliconConfig.memoryTiersCount}
                onChange={(e) => onUpdateSilicon({ memoryTiersCount: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                <span>16 Tiers (Prototype)</span>
                <span>64 Tiers (Production Sweet Spot)</span>
                <span>128 Tiers (Ultra-Dense)</span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed uppercase tracking-wide">
                Each vertical tier is bonded directly via Cu-Cu hybrid bonding at 0.8 µm pitch. Increasing tier count scales on-chip memory storage linearly without expanding die footprint.
              </p>
            </div>

            {/* Memory Technology Selector */}
            <div className="mt-5">
              <label className="block text-[10px] font-bold text-zinc-400 mb-2 uppercase tracking-widest">
                Select 3D Memory Silicon Cell Technology:
              </label>
              <div className="space-y-2.5">
                {memoryTechOptions.map((tech) => {
                  const isSelected = siliconConfig.memoryTech === tech.id;
                  return (
                    <div
                      key={tech.id}
                      onClick={() => onUpdateSilicon({ memoryTech: tech.id })}
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
                            name="memoryTech"
                            checked={isSelected}
                            onChange={() => onUpdateSilicon({ memoryTech: tech.id })}
                            className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-semibold text-white uppercase tracking-wider">{tech.name}</span>
                        </div>
                        <span className="font-mono text-emerald-400 font-semibold text-[10px]">
                          {tech.density}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-[9px] font-mono text-zinc-400 mt-1 pl-5 uppercase tracking-wider">
                        <span>Read Energy: <strong className="text-amber-300">{tech.readEnergy}</strong></span>
                        <span>•</span>
                        <span>Endurance: {tech.endurance}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1 pl-5 uppercase tracking-wide leading-relaxed">{tech.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cu-Cu Hybrid Direct Wafer Bonding Parameters */}
          <div className="p-5 bg-[#08090D] border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-white/10">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>3D Hybrid Interconnect & Through-Silicon Via (TSV) Rules</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-[#050608] border border-white/10">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Hybrid Cu-Cu Bonding Pitch:</div>
                <div className="text-sm font-bold text-white mt-0.5">{siliconConfig.bondingPitchUm} µm</div>
                <div className="text-[9px] text-emerald-400 mt-0.5">&gt;1,500,000 interconnects/mm²</div>
              </div>

              <div className="p-3 bg-[#050608] border border-white/10">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Backside Power (PowerVia):</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {siliconConfig.backsidePowerDelivery ? 'ENABLED (BSPDN)' : 'DISABLED'}
                </div>
                <div className="text-[9px] text-zinc-400 mt-0.5">-35% IR Drop Reduction</div>
              </div>
            </div>

            <div className="p-3 bg-[#050608] border border-white/10 text-xs text-zinc-300 font-mono space-y-1.5 leading-relaxed uppercase tracking-wide">
              <div className="font-semibold text-white">Zero-DRAM Bottleneck Eliminated:</div>
              <p className="text-[10px] text-zinc-400">
                Conventional accelerators spend over 70% of energy moving model weights across PCB traces from external DDR5 or HBM memory.
                By manufacturing all Kimi K3 weights vertically above the compute die, data distance is reduced from 50,000 µm to less than 5 µm.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
