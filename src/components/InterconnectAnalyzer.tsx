import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Zap, 
  Clock, 
  Cpu, 
  Database, 
  CheckCircle2, 
  Layers, 
  Activity, 
  Sliders, 
  ShieldCheck 
} from 'lucide-react';
import { 
  SiliconProcessConfig, 
  PowerMetrics, 
  LatencyBreakdown, 
  SerialLinkProtocol, 
  KimiModelConfig 
} from '../types/eda';

interface InterconnectAnalyzerProps {
  siliconConfig: SiliconProcessConfig;
  powerMetrics: PowerMetrics;
  latency: LatencyBreakdown;
  model: KimiModelConfig;
  onUpdateSilicon: (updated: Partial<SiliconProcessConfig>) => void;
}

export const InterconnectAnalyzer: React.FC<InterconnectAnalyzerProps> = ({
  siliconConfig,
  powerMetrics,
  latency,
  model,
  onUpdateSilicon,
}) => {
  const [activeProtocol, setActiveProtocol] = useState<SerialLinkProtocol>('CXL_3_0_Type2');
  const [packetSimRunning, setPacketSimRunning] = useState(true);

  const protocolDetails: Record<SerialLinkProtocol, { name: string; rawBw: string; latency: string; desc: string }> = {
    'CXL_3_0_Type2': {
      name: 'CXL 3.0 Type-2 (CXL.io + CXL.cache + CXL.mem)',
      rawBw: '64 GB/s Simplex (128 GB/s Duplex)',
      latency: '~68 ns Flit Latency',
      desc: 'Heterogeneous accelerator mode. Allows CPU host and ASIC to share coherent memory address spaces with zero-copy DMA for prompt tensors.'
    },
    'CXL_3_0_Type3': {
      name: 'CXL 3.0 Type-3 (CXL.mem Pooling)',
      rawBw: '64 GB/s Simplex',
      latency: '~75 ns',
      desc: 'Memory-attached expander mode. Exposes on-chip MLA KV cache and latent embedding buffers directly to the industrial host system.'
    },
    'PCIe_Gen5_x16': {
      name: 'PCIe Gen 5 x16 Native Serial',
      rawBw: '64 GB/s Bidirectional',
      latency: '~110 ns',
      desc: 'Standard 32 GT/s PAM-4 serial link with 128b/130b encoding for backward compatibility with standard industrial edge IPCs.'
    },
    'PCIe_Gen5_x8_CXL_Combo': {
      name: 'PCIe Gen 5 x8 Bifurcated / CXL Link',
      rawBw: '32 GB/s per Link',
      latency: '~72 ns',
      desc: 'Dual-link setup for daisy-chaining multiple industrial edge ASICs across an autonomous robot backplane.'
    }
  };

  return (
    <div className="p-4 min-h-[calc(100vh-120px)] bg-[#050608] text-[#D1D5DB] font-mono space-y-6">
      {/* Top Banner Overview */}
      <div className="p-4 bg-[#08090D] border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-blue-600/10 text-blue-400 border border-blue-500/20">
                <ArrowRightLeft className="w-5 h-5" />
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                High-Speed Serial I/O (PCIe Gen 5 / CXL 3.0) & Zero-DRAM Engine
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed uppercase tracking-wide">
              Eliminating external DRAM removes the primary memory wall bottleneck. Input prompts and token streams transmit via PCIe Gen 5 / CXL 3.0 at 32 GT/s, while weight tensors are retrieved directly from on-chip 3D silicon at &gt;48 TB/s.
            </p>
          </div>

          {/* Aggregate Bandwidth Gauge */}
          <div className="p-3 bg-[#050608] border border-white/10 font-mono text-xs flex flex-col items-center justify-center min-w-[220px]">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">On-Chip Weight Bandwidth</div>
            <div className="text-xl font-bold text-blue-400 my-0.5">
              48.2 Terabytes/sec
            </div>
            <div className="text-[10px] text-emerald-400 uppercase tracking-wider">
              40x Faster than External HBM3 (1.2 TB/s)
            </div>
          </div>
        </div>
      </div>

      {/* Zero-DRAM Bottleneck Elimination Matrix */}
      <div className="p-5 bg-[#08090D] border border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Zero-DRAM Elimination: On-Chip Silicon vs. Conventional External Memory</span>
          </h3>
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Architectural Benchmark</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 text-[10px] uppercase tracking-wider bg-[#050608]">
                <th className="p-3 font-semibold">Architectural Metric</th>
                <th className="p-3 font-semibold text-rose-400">Conventional Edge LLM (External LPDDR5X/HBM)</th>
                <th className="p-3 font-semibold text-emerald-400">This ASIC (Kimi K3 All-On-Silicon)</th>
                <th className="p-3 font-semibold text-blue-400">System Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr className="hover:bg-white/[0.02]">
                <td className="p-3 font-medium text-white uppercase tracking-wider">Weight Access Energy</td>
                <td className="p-3 text-rose-400 font-bold">18.0 - 22.0 pJ / bit</td>
                <td className="p-3 text-emerald-400 font-bold">0.18 pJ / bit (3D NVM Stack)</td>
                <td className="p-3 text-blue-400 font-bold">99.1% Energy Reduction</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="p-3 font-medium text-white uppercase tracking-wider">Weight Access Latency</td>
                <td className="p-3 text-rose-400">180 - 240 ns (Row buffer miss + PCB)</td>
                <td className="p-3 text-emerald-400 font-bold">3.8 ns (Vertical Cu-Cu Vias)</td>
                <td className="p-3 text-blue-400 font-bold">63x Faster Latency</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="p-3 font-medium text-white uppercase tracking-wider">Total System Board Power</td>
                <td className="p-3 text-rose-400 font-bold">{powerMetrics.dramEquivalentPowerW} Watts (Needs Fans/Chiller)</td>
                <td className="p-3 text-emerald-400 font-bold">{powerMetrics.totalTdpW} Watts (Edge Compatible)</td>
                <td className="p-3 text-blue-400 font-bold">-{powerMetrics.powerSavingsPercent}% Power Savings</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="p-3 font-medium text-white uppercase tracking-wider">Memory Wall Cycle Stalls</td>
                <td className="p-3 text-rose-400">68% - 78% pipeline stalls</td>
                <td className="p-3 text-emerald-400 font-bold">0% (Continuous streaming)</td>
                <td className="p-3 text-blue-400 font-bold">100% Compute Utilization</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="p-3 font-medium text-white uppercase tracking-wider">Board Surface Footprint</td>
                <td className="p-3 text-rose-400">&gt;2,400 mm² (ASIC + DRAM + PMIC)</td>
                <td className="p-3 text-emerald-400 font-bold">576 mm² (Single Monolithic Die)</td>
                <td className="p-3 text-blue-400 font-bold">4.2x Smaller Footprint</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="p-3 font-medium text-white uppercase tracking-wider">DRAM Refresh Degradation</td>
                <td className="p-3 text-rose-400">Periodic refresh causes jitter spikes</td>
                <td className="p-3 text-emerald-400 font-bold">Zero Refresh (Non-Volatile / Static)</td>
                <td className="p-3 text-blue-400 font-bold">Hard Determinism Guaranteed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Serial Link Configuration & Latency Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: PCIe Gen 5 / CXL 3.0 Protocol Controller */}
        <div className="p-5 bg-[#08090D] border border-white/10 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-white/10">
            <ArrowRightLeft className="w-4 h-4 text-blue-500" />
            <span>High-Speed Serial Controller (PCIe Gen 5 / CXL 3.0)</span>
          </h3>

          <div className="space-y-2.5">
            {(Object.keys(protocolDetails) as SerialLinkProtocol[]).map((key) => {
              const opt = protocolDetails[key];
              const isSelected = activeProtocol === key;
              return (
                <div
                  key={key}
                  onClick={() => setActiveProtocol(key)}
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
                        name="serialProtocol"
                        checked={isSelected}
                        onChange={() => setActiveProtocol(key)}
                        className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="font-semibold text-white uppercase tracking-wider">{opt.name}</span>
                    </div>
                    <span className="font-mono text-blue-400 font-semibold text-[10px]">
                      {opt.rawBw}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-1 pl-5 uppercase tracking-wider">
                    Link Latency: <strong className="text-emerald-400">{opt.latency}</strong>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 pl-5 uppercase tracking-wide leading-relaxed">{opt.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Serial Lane Visual Packet Animator */}
          <div className="p-4 bg-[#050608] border border-white/10 space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-zinc-400 text-[10px] uppercase tracking-wider">
              <span>PCIe Gen 5 x16 Physical Lanes (32 GT/s PAM-4):</span>
              <span className="text-emerald-400 font-bold">CXL 256B Flits Flowing</span>
            </div>
            <div className="grid grid-cols-16 gap-1 py-1">
              {Array.from({ length: 16 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-4 transition-all duration-300 ${
                    packetSimRunning && (idx % 2 === 0)
                      ? 'bg-blue-500 shadow-sm shadow-blue-400 animate-pulse'
                      : 'bg-blue-950/60 border border-white/10'
                  }`}
                  title={`PCIe Lane ${idx}: 32 GT/s`}
                ></div>
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-zinc-500 uppercase tracking-widest">
              <span>Lane 0 (Primary Clock & IRQ)</span>
              <span>128 GB/s Duplex Payload</span>
              <span>Lane 15</span>
            </div>
          </div>
        </div>

        {/* Right: Latency Waterfall & Pipeline Breakdown */}
        <div className="p-5 bg-[#08090D] border border-white/10 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-white/10">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>End-to-End Latency Waterfall (Per-Token Inference)</span>
          </h3>

          <div className="space-y-3 text-xs font-mono">
            {/* Step 1: CXL/PCIe Link */}
            <div>
              <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
                <span className="text-zinc-400">1. Host CXL.mem / PCIe Serial Link Packetization:</span>
                <span className="text-blue-400 font-bold">{latency.pcieCxlLinkLatencyNs} ns</span>
              </div>
              <div className="w-full bg-black h-2 overflow-hidden border border-white/10">
                <div className="bg-blue-500 h-full" style={{ width: '18%' }}></div>
              </div>
            </div>

            {/* Step 2: 2D Mesh NoC Crossbar */}
            <div>
              <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
                <span className="text-zinc-400">2. On-Chip 2D Torus / Mesh Network Traversal:</span>
                <span className="text-cyan-400 font-bold">{latency.nocTraverseLatencyNs} ns</span>
              </div>
              <div className="w-full bg-black h-2 overflow-hidden border border-white/10">
                <div className="bg-cyan-500 h-full" style={{ width: '8%' }}></div>
              </div>
            </div>

            {/* Step 3: On-Chip Weight Access */}
            <div>
              <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
                <span className="text-zinc-400">3. 3D Monolithic Memory Weight Retrieval:</span>
                <span className="text-emerald-400 font-bold">{latency.onChipWeightReadNs} ns (Zero-DRAM!)</span>
              </div>
              <div className="w-full bg-black h-2 overflow-hidden border border-white/10">
                <div className="bg-emerald-500 h-full" style={{ width: '3%' }}></div>
              </div>
            </div>

            {/* Step 4: Systolic GEMM & MLA Compute */}
            <div>
              <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
                <span className="text-zinc-400">4. Kimi MLA Decompression & MoE Systolic Multiply:</span>
                <span className="text-amber-400 font-bold">{latency.computeMlaGemmNs} ns</span>
              </div>
              <div className="w-full bg-black h-2 overflow-hidden border border-white/10">
                <div className="bg-amber-500 h-full" style={{ width: '68%' }}></div>
              </div>
            </div>

            {/* Step 5: KV Cache Update */}
            <div>
              <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
                <span className="text-zinc-400">5. On-Chip Latent KV-Cache SRAM Commit:</span>
                <span className="text-purple-400 font-bold">{latency.kvCacheAccessNs} ns</span>
              </div>
              <div className="w-full bg-black h-2 overflow-hidden border border-white/10">
                <div className="bg-purple-500 h-full" style={{ width: '4%' }}></div>
              </div>
            </div>

            {/* Total Summary */}
            <div className="p-4 bg-[#050608] border border-white/10 mt-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white uppercase tracking-wider font-semibold">Total Edge Token Latency:</span>
                <span className="text-emerald-400 font-bold text-sm font-mono">
                  {latency.totalTokenLatencyMs} ms / token
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 uppercase tracking-wider">Edge Inference Throughput:</span>
                <span className="text-blue-400 font-bold font-mono">
                  ~{latency.tokensPerSecond} tokens / sec
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400 uppercase tracking-wider">Time To First Token (TTFT):</span>
                <span className="text-purple-400 font-bold font-mono">
                  {latency.timeToFirstTokenMs} ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
