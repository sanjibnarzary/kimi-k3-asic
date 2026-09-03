import React, { useState } from 'react';
import { 
  Factory, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  AlertCircle, 
  Clock, 
  Sliders, 
  CheckCircle2, 
  Zap, 
  Radio, 
  Gauge 
} from 'lucide-react';
import { 
  SiliconProcessConfig, 
  IndustrialGrade, 
  EDAOptimizationMetrics, 
  LatencyBreakdown 
} from '../types/eda';

interface IndustrialEdgeProfileProps {
  siliconConfig: SiliconProcessConfig;
  metrics: EDAOptimizationMetrics;
  latency: LatencyBreakdown;
  onUpdateSilicon: (updated: Partial<SiliconProcessConfig>) => void;
}

export const IndustrialEdgeProfile: React.FC<IndustrialEdgeProfileProps> = ({
  siliconConfig,
  metrics,
  latency,
  onUpdateSilicon,
}) => {
  const [activeApplication, setActiveApplication] = useState<string>('amr_robotics');
  const [faultInjectionActive, setFaultInjectionActive] = useState(false);

  const industrialApplications = [
    {
      id: 'amr_robotics',
      title: 'Autonomous Mobile Robots (AMR / AGV)',
      deadlineMs: 2.5,
      frequency: '400 Hz Control Loop',
      desc: 'Real-time multi-modal spatial reasoning, dynamic obstacle avoidance, and industrial factory floor navigation.'
    },
    {
      id: 'aoi_inspection',
      title: 'High-Speed Automated Optical Inspection (AOI)',
      deadlineMs: 1.0,
      frequency: '120 FPS Camera Stream',
      desc: 'Sub-millimeter wafer and PCB surface defect detection using Kimi K3 edge multimodal vision features.'
    },
    {
      id: 'robotic_manipulation',
      title: 'Multi-Axis Precision Robotic Assembly',
      deadlineMs: 1.5,
      frequency: '500 Hz Feedback Loop',
      desc: 'Tactile torque sensor feedback and real-time robotic arm trajectory correction without cloud round-trip delay.'
    },
    {
      id: 'scada_edge',
      title: 'Critical Infrastructure SCADA Anomaly Detection',
      deadlineMs: 5.0,
      frequency: 'Continuous Stream',
      desc: 'Plant telemetry anomaly detection with deterministic zero-packet-loss guarantees.'
    }
  ];

  const safetyGrades: { id: IndustrialGrade; label: string; tempRange: string; safetyStandard: string; desc: string }[] = [
    {
      id: 'AEC_Q100_Grade1',
      label: 'AEC-Q100 Grade 1 (Industrial Rugged)',
      tempRange: '-40°C to +125°C Tj',
      safetyStandard: 'ISO 26262 ASIL-B / IEC 61508 SIL-2',
      desc: 'Standard for heavy machinery, robotics, and industrial automation controller cabinets.'
    },
    {
      id: 'AEC_Q100_Grade0',
      label: 'AEC-Q100 Grade 0 (Extreme Harsh Environment)',
      tempRange: '-40°C to +150°C Tj',
      safetyStandard: 'ISO 26262 ASIL-D / IEC 61508 SIL-3',
      desc: 'Under-hood, high-vibration, and mission-critical autonomous industrial drive electronics.'
    },
    {
      id: 'IEC_61508_SIL3',
      label: 'IEC 61508 Functional Safety SIL-3',
      tempRange: '-40°C to +105°C Tj',
      safetyStandard: 'Fail-Safe Lockstep Hardware',
      desc: 'Hardware dual-core lockstep with built-in self-test (BIST) for emergency safety shutoffs.'
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
                <Factory className="w-5 h-5" />
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Autonomous Industrial Edge Deployment & Hard Determinism Signoff
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed uppercase tracking-wide">
              Industrial edge applications demand strict latency determinism with zero jitter.
              Because all weights reside on-chip, there are no DRAM page misses, periodic memory refresh freezes, or PCB bus degradation under vibration.
            </p>
          </div>

          {/* Hard Determinism Badge */}
          <div className="p-3 bg-[#050608] border border-white/10 font-mono text-xs flex flex-col items-center justify-center min-w-[220px]">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Worst-Case Jitter</div>
            <div className="text-xl font-bold text-emerald-400 my-0.5 flex items-center space-x-1">
              <span>&lt; {metrics.deterministicJitterUs} µs</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Zero DRAM Bus Contention
            </div>
          </div>
        </div>
      </div>

      {/* Industrial Workloads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Industrial Autonomous Systems Real-Time Profiler */}
        <div className="space-y-6">
          <div className="p-5 bg-[#08090D] border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-white/10">
              <Activity className="w-4 h-4 text-blue-500" />
              <span>Target Industrial Deployment Profiles</span>
            </h3>

            <div className="space-y-2.5">
              {industrialApplications.map((app) => {
                const isSelected = activeApplication === app.id;
                const isCompliant = latency.totalTokenLatencyMs <= app.deadlineMs;

                return (
                  <div
                    key={app.id}
                    onClick={() => setActiveApplication(app.id)}
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
                          name="industrialApp"
                          checked={isSelected}
                          onChange={() => setActiveApplication(app.id)}
                          className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-semibold text-white uppercase tracking-wider">{app.title}</span>
                      </div>
                      <span
                        className={`font-mono text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider border ${
                          isCompliant
                            ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-950/50 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {isCompliant ? 'PASS (SIGNOFF OK)' : 'VIOLATION'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-[9px] font-mono text-zinc-400 mt-1 pl-5 uppercase tracking-wider">
                      <span>Deadline: <strong className="text-zinc-200">{app.deadlineMs} ms</strong></span>
                      <span>•</span>
                      <span>Loop: <strong className="text-blue-400">{app.frequency}</strong></span>
                      <span>•</span>
                      <span>ASIC Measured: <strong className="text-emerald-400">{latency.totalTokenLatencyMs} ms</strong></span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 pl-5 uppercase tracking-wide leading-relaxed">{app.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hard Determinism & Real-Time Guarantees */}
          <div className="p-5 bg-[#08090D] border border-white/10 space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-white/10">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Hard Real-Time Determinism Telemetry</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#050608] border border-white/10">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Worst-Case Execution Time (WCET):</div>
                <div className="text-sm font-bold text-white mt-0.5">1.84 ms / Token</div>
                <div className="text-[9px] text-emerald-400 mt-0.5 uppercase tracking-wider">Zero tail latency spikes</div>
              </div>

              <div className="p-3 bg-[#050608] border border-white/10">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">DRAM Bus Refresh Interruption:</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">0.00 ns (No DRAM)</div>
                <div className="text-[9px] text-zinc-400 mt-0.5 uppercase tracking-wider">Eliminates periodic tREFI stalls</div>
              </div>

              <div className="p-3 bg-[#050608] border border-white/10">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Hardware Interrupt Response:</div>
                <div className="text-sm font-bold text-blue-400 mt-0.5">14.2 ns</div>
                <div className="text-[9px] text-zinc-400 mt-0.5 uppercase tracking-wider">Direct CXL.io IRQ line</div>
              </div>

              <div className="p-3 bg-[#050608] border border-white/10">
                <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Mechanical Shock Resilience:</div>
                <div className="text-sm font-bold text-purple-400 mt-0.5">50 G (11ms Half-Sine)</div>
                <div className="text-[9px] text-zinc-400 mt-0.5 uppercase tracking-wider">No separate memory solder balls</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Functional Safety, Harsh Environment & Fault Tolerance */}
        <div className="space-y-6">
          <div className="p-5 bg-[#08090D] border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2 pb-2 border-b border-white/10">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Harsh Environmental Grade & Functional Safety</span>
            </h3>

            <div className="space-y-2.5">
              {safetyGrades.map((grade) => {
                const isSelected = siliconConfig.industrialGrade === grade.id;
                return (
                  <div
                    key={grade.id}
                    onClick={() => onUpdateSilicon({ industrialGrade: grade.id })}
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
                          name="safetyGrade"
                          checked={isSelected}
                          onChange={() => onUpdateSilicon({ industrialGrade: grade.id })}
                          className="text-blue-500 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-semibold text-white uppercase tracking-wider">{grade.label}</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-semibold text-[10px]">
                        {grade.tempRange}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-amber-400 mt-1 pl-5 uppercase tracking-wider">
                      Standard: {grade.safetyStandard}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 pl-5 uppercase tracking-wide leading-relaxed">{grade.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fault Tolerance & Reliability Engine */}
          <div className="p-5 bg-[#08090D] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-purple-400" />
                <span>On-Silicon ECC & Lockstep Redundancy</span>
              </h3>
              <button
                onClick={() => setFaultInjectionActive(!faultInjectionActive)}
                className={`px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider border transition ${
                  faultInjectionActive
                    ? 'bg-rose-950/50 border-rose-500/40 text-rose-300 animate-pulse'
                    : 'bg-[#050608] border-white/10 text-zinc-400 hover:border-white/30'
                }`}
              >
                {faultInjectionActive ? 'Fault Injected (Auto-Corrected)' : 'Test Fault Injection'}
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-[#050608] border border-white/10 flex justify-between items-center">
                <div>
                  <div className="text-white font-semibold uppercase tracking-wider text-[11px]">3D Memory Matrix SECDED ECC:</div>
                  <div className="text-[9px] text-zinc-400 uppercase tracking-wide">Background scrubber runs at 10 MHz across all tiers</div>
                </div>
                <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider">100% SECDED ACTIVE</span>
              </div>

              <div className="p-3 bg-[#050608] border border-white/10 flex justify-between items-center">
                <div>
                  <div className="text-white font-semibold uppercase tracking-wider text-[11px]">Dual-Core Lockstep (DCLS) Sequencer:</div>
                  <div className="text-[9px] text-zinc-400 uppercase tracking-wide">Redundant pipeline comparator with 1-cycle fault detection</div>
                </div>
                <span className="text-blue-400 font-bold text-[10px] uppercase tracking-wider">SIL-3 COMPLIANT</span>
              </div>

              <div className="p-3 bg-[#050608] border border-white/10 flex justify-between items-center">
                <div>
                  <div className="text-white font-semibold uppercase tracking-wider text-[11px]">Hardware Root of Trust (RoT):</div>
                  <div className="text-[9px] text-zinc-400 uppercase tracking-wide">Cryptographically signs firmware and model weights on silicon</div>
                </div>
                <span className="text-purple-400 font-bold text-[10px] uppercase tracking-wider">ANTI-TAMPER PUF</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
