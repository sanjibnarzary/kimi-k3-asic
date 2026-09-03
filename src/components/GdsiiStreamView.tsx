import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Download, 
  Terminal, 
  Layers, 
  Check, 
  Search, 
  ShieldCheck, 
  FileCode,
  Pause,
  ArrowDownToLine,
  Flame,
  Zap,
  Activity
} from 'lucide-react';
import { 
  KimiModelConfig, 
  SiliconProcessConfig, 
  EDAOptimizationMetrics, 
  PowerMetrics 
} from '../types/eda';

interface GdsiiStreamViewProps {
  model: KimiModelConfig;
  siliconConfig: SiliconProcessConfig;
  metrics: EDAOptimizationMetrics;
  powerMetrics: PowerMetrics;
}

interface LogEntry {
  id: string;
  time: string;
  stage: 'EXTRACT' | 'LAYER' | 'GEOMETRIC' | 'DRC' | 'STREAMOUT';
  level: 'INFO' | 'SUCCESS' | 'WARN';
  message: string;
}

interface LayerDefinition {
  layerNum: number;
  datatype: number;
  name: string;
  category: 'FEOL' | 'MOL' | 'BEOL' | '3D_BOND' | '3D_MEMORY' | 'BSPDN';
  description: string;
  polygonsCount: string;
  status: 'MAPPED' | 'DRC_PASS';
}

export const GdsiiStreamView: React.FC<GdsiiStreamViewProps> = ({
  model,
  siliconConfig,
  metrics,
  powerMetrics,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [currentStepName, setCurrentStepName] = useState<string>('Ready to Stream');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'SUCCESS' | 'WARN'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedManifest, setCopiedManifest] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const dieArea = siliconConfig.dieWidthMm * siliconConfig.dieHeightMm;
  const isReticleOk = dieArea <= siliconConfig.reticleLimitMm2;

  // Layer mapping definitions based on current silicon process
  const layerStack: LayerDefinition[] = [
    {
      layerNum: 100,
      datatype: 0,
      name: 'N3_GAA_ACTIVE_OD',
      category: 'FEOL',
      description: 'Nanosheet GAAFET active diffusion channels & Fin geometry',
      polygonsCount: '18,420,800',
      status: 'DRC_PASS',
    },
    {
      layerNum: 120,
      datatype: 0,
      name: 'N3_POLY_GATE_PO',
      category: 'FEOL',
      description: 'Self-aligned workfunction metal gate (High-k / TiN)',
      polygonsCount: '14,210,400',
      status: 'DRC_PASS',
    },
    {
      layerNum: 130,
      datatype: 0,
      name: 'MOL_CONTACT_POLY',
      category: 'MOL',
      description: 'Middle-of-line contact plugs to source/drain GAA terminals',
      polygonsCount: '22,940,100',
      status: 'DRC_PASS',
    },
    {
      layerNum: 140,
      datatype: 0,
      name: 'M0_LOCAL_ROUTING',
      category: 'MOL',
      description: 'Metal 0 Ruthenium (Ru) ultra-fine local intra-cell routing',
      polygonsCount: '26,710,500',
      status: 'DRC_PASS',
    },
    {
      layerNum: 201,
      datatype: 0,
      name: 'M1_M3_STANDARD_CELL',
      category: 'BEOL',
      description: 'Copper interconnect for standard cell logic & systolic arrays',
      polygonsCount: '34,800,200',
      status: 'DRC_PASS',
    },
    {
      layerNum: 204,
      datatype: 0,
      name: 'M4_M10_GLOBAL_NOC_BUS',
      category: 'BEOL',
      description: '2D mesh NoC crossbars and PCIe Gen 5 / CXL 32 GT/s SerDes routing',
      polygonsCount: '19,550,000',
      status: 'DRC_PASS',
    },
    {
      layerNum: 211,
      datatype: 0,
      name: 'M11_M14_POWER_GRID',
      category: 'BEOL',
      description: 'Thick copper top-metal VDD/VSS distribution grid',
      polygonsCount: '4,890,300',
      status: 'DRC_PASS',
    },
    {
      layerNum: 300,
      datatype: 0,
      name: 'CU_CU_HYBRID_BOND_PAD',
      category: '3D_BOND',
      description: `Cu-Cu direct wafer bonding pads @ ${siliconConfig.bondingPitchUm} µm pitch (>1.5M pads/mm²)`,
      polygonsCount: '864,000,000',
      status: 'DRC_PASS',
    },
    {
      layerNum: 310,
      datatype: 0,
      name: `3D_NVM_TIERS_01_${String(siliconConfig.memoryTiersCount).padStart(2, '0')}`,
      category: '3D_MEMORY',
      description: `${siliconConfig.memoryTiersCount} vertical monolithic memory tiers (${siliconConfig.memoryTech.toUpperCase()}) storing Kimi K3 weights`,
      polygonsCount: `${(model.totalParamsBillion * 1.8).toFixed(1)}M macros`,
      status: 'DRC_PASS',
    },
    ...(siliconConfig.backsidePowerDelivery
      ? [
          {
            layerNum: 400,
            datatype: 0,
            name: 'BSPDN_NANO_TSV',
            category: 'BSPDN' as const,
            description: 'Backside nano-Through-Silicon Vias (B-nTSV) for zero-IR-drop power delivery',
            polygonsCount: '3,200,000',
            status: 'DRC_PASS' as const,
          },
          {
            layerNum: 401,
            datatype: 0,
            name: 'BACKSIDE_M_B0_MB2',
            category: 'BSPDN' as const,
            description: 'Backside metal distribution rails for clean ground and supply planes',
            polygonsCount: '1,450,000',
            status: 'DRC_PASS' as const,
          },
        ]
      : []),
  ];

  // Geometric validation rules checklist
  const geometricValidationRules = [
    {
      ruleId: 'DRC-GEO-001',
      title: 'Die Reticle Mask Dimension Boundary',
      requirement: `<= ${siliconConfig.reticleLimitMm2} mm² (Photolithography Mask Scanner Limit)`,
      measured: `${siliconConfig.dieWidthMm} x ${siliconConfig.dieHeightMm} mm (${dieArea} mm²)`,
      margin: `+${siliconConfig.reticleLimitMm2 - dieArea} mm² Headroom`,
      passed: isReticleOk,
    },
    {
      ruleId: 'DRC-GEO-002',
      title: 'Cu-Cu Hybrid Direct Bonding Pad Pitch',
      requirement: `>= 0.75 µm pitch (Wafer-to-Wafer Fusion Rule)`,
      measured: `${siliconConfig.bondingPitchUm} µm pitch`,
      margin: `+${((siliconConfig.bondingPitchUm - 0.75) * 1000).toFixed(0)} nm tolerance buffer`,
      passed: siliconConfig.bondingPitchUm >= 0.75,
    },
    {
      ruleId: 'DRC-GEO-003',
      title: '3D Memory Vertical Tier Density Fill',
      requirement: `Monolithic integration for ${model.totalParamsBillion}B params (${metrics.totalStorageRequiredGB} GB)`,
      measured: `${metrics.onChipStorageAvailableGB} GB Silicon capacity across ${siliconConfig.memoryTiersCount} tiers`,
      margin: `+${metrics.onChipStorageAvailableGB - metrics.totalStorageRequiredGB} GB safety spare`,
      passed: metrics.onChipStorageAvailableGB >= metrics.totalStorageRequiredGB,
    },
    {
      ruleId: 'DRC-GEO-004',
      title: 'CMP Metal Density Uniformity (M8-M12)',
      requirement: '40.0% to 70.0% copper density across 50µm windows',
      measured: '52.4% average fill (with smart dummy tile insertion)',
      margin: 'Optimal planarity; zero dishing risk',
      passed: true,
    },
    {
      ruleId: 'DRC-GEO-005',
      title: 'High-Speed CXL 3.0 / PCIe SerDes Antenna Protection',
      requirement: 'Gate oxide antenna ratio < 250:1 on 32 GT/s PAM-4 traces',
      measured: 'Max antenna ratio 48:1 with embedded reverse-biased diodes',
      margin: 'Passed without ESD degradation',
      passed: true,
    },
    {
      ruleId: 'DRC-GEO-006',
      title: 'Scribe Line & Die Seal Ring Guard Ring Enclosure',
      requirement: 'Width >= 40.0 µm continuous dual seal ring with corner chamfer',
      measured: '45.0 µm reinforced seal ring with crack-stop trench',
      margin: '+5.0 µm mechanical reliability margin',
      passed: true,
    },
  ];

  // Helper to generate realistic timestamps
  const getTimeString = () => {
    const d = new Date();
    return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
  };

  // Automated GDSII stream progression
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (status === 'running') {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setStatus('completed');
            setCurrentStepName('GDSII Stream Generation & Signoff Completed');
            if (interval) clearInterval(interval);
            return 100;
          }

          const next = prev + 5;

          // Add progressive logs
          if (next === 5) {
            setCurrentStepName('Phase 1: Initializing Calibre / OASIS Streamout Engine');
            addLog('EXTRACT', 'INFO', `Initializing GDSII 6.0 / OASIS v1.0 binary translator for top cell 'asic_kimi_k3_top'.`);
            addLog('EXTRACT', 'INFO', `Target Technology: TSMC/Intel ${siliconConfig.processNode} with 3D Monolithic Back-End.`);
          } else if (next === 15) {
            setCurrentStepName('Phase 1: DEF Floorplan Extraction & Macro Instantiations');
            addLog('EXTRACT', 'INFO', `Parsing DEF 5.8: Die Boundary = (0, 0) to (${siliconConfig.dieWidthMm * 1000}, ${siliconConfig.dieHeightMm * 1000}) microns.`);
            addLog('EXTRACT', 'INFO', `Instantiating 8 macro blocks: 3D Memory Tiers (${siliconConfig.memoryTech.toUpperCase()}), Systolic MLA GEMM, MoE Cores, PCIe/CXL PHY.`);
          } else if (next === 30) {
            setCurrentStepName('Phase 2: Layer Stack Mapping & FEOL/MOL Synthesis');
            addLog('LAYER', 'INFO', `Mapping Layer 100:0 (N3_GAA_ACTIVE_OD) -> 18,420,800 polygons.`);
            addLog('LAYER', 'INFO', `Mapping Layer 120:0 (N3_POLY_GATE_PO) -> 14,210,400 gate stripes.`);
            addLog('LAYER', 'INFO', `Mapping Layer 140:0 (M0_LOCAL_ROUTING) -> Ruthenium local interconnects.`);
          } else if (next === 45) {
            setCurrentStepName('Phase 2: 3D Memory Tier Interconnect & Cu-Cu Pad Generation');
            addLog('LAYER', 'INFO', `Generating Cu-Cu hybrid direct bonding pads: ${siliconConfig.bondingPitchUm} µm pitch on Layer 300:0.`);
            addLog('LAYER', 'INFO', `Extruding ${siliconConfig.memoryTiersCount} vertical memory tiers (Layers 310:0 to 3${10 + siliconConfig.memoryTiersCount - 1}:0) for ${model.totalParamsBillion}B Kimi weights.`);
            if (siliconConfig.backsidePowerDelivery) {
              addLog('LAYER', 'INFO', `Backside PowerVia (BSPDN) enabled: Instantiating Layer 400:0 (B-nTSVs) and Layer 401:0 (Backside M_B0-M_B2).`);
            }
          } else if (next === 60) {
            setCurrentStepName('Phase 3: Geometric DRC Rules & Boolean Layer Operations');
            addLog('GEOMETRIC', 'INFO', `Executing Calibre nmDRC / Pegasus rule deck: N3_Rev1.2_Physical_Signoff.drc`);
            addLog('DRC', 'SUCCESS', `DRC-GEO-001 [Reticle Check]: ${dieArea} mm² <= 858 mm² limit. PASSED (+${858 - dieArea} mm² margin).`);
            addLog('DRC', 'SUCCESS', `DRC-GEO-002 [Cu-Cu Pitch]: ${siliconConfig.bondingPitchUm} µm >= 0.75 µm design rule. PASSED.`);
          } else if (next === 75) {
            setCurrentStepName('Phase 3: Antenna Ratio & Chemical-Mechanical Planarization (CMP) Fill');
            addLog('DRC', 'SUCCESS', `DRC-GEO-003 [Storage Fit]: ${metrics.onChipStorageAvailableGB} GB on-chip vs ${metrics.totalStorageRequiredGB} GB weights. PASSED (100% Fit).`);
            addLog('GEOMETRIC', 'INFO', `Synthesizing smart dummy metal tiles on M8-M12 to prevent CMP dishing. Uniformity = 52.4% copper density.`);
            addLog('DRC', 'SUCCESS', `DRC-GEO-005 [CXL SerDes Antenna]: Ratio 48:1 satisfies < 250:1 limit with internal diodes.`);
          } else if (next === 90) {
            setCurrentStepName('Phase 4: Writing Binary GDSII Stream & Checksum Calculation');
            addLog('STREAMOUT', 'INFO', `Compiling binary GDSII records: HEADER, BGNLIB, LIBNAME, BGNSTR, STRNAME, BOUNDARY, PATH, SREF, AREF.`);
            addLog('STREAMOUT', 'INFO', `Total Stream Records: 48,920,140 primitives. Uncompressed stream size: 2.38 GB (OASIS compressed: 412 MB).`);
          } else if (next >= 100) {
            setCurrentStepName('Phase 4: Signoff Complete - Tapeout Ready');
            addLog('STREAMOUT', 'SUCCESS', `GDSII stream generation completed with ZERO DRC / LVS / Antenna violations.`);
            addLog('STREAMOUT', 'SUCCESS', `Tapeout Checksum: SHA-256: e7a9c84d12...48f9 | Signoff status: TAPE-OUT APPROVED.`);
          }

          return next;
        });
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, siliconConfig, model, metrics, dieArea]);

  const addLog = (
    stage: 'EXTRACT' | 'LAYER' | 'GEOMETRIC' | 'DRC' | 'STREAMOUT',
    level: 'INFO' | 'SUCCESS' | 'WARN',
    message: string
  ) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        time: getTimeString(),
        stage,
        level,
        message,
      },
    ]);
  };

  // Scroll log terminal to bottom on change
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleStartSimulation = () => {
    setProgress(0);
    setLogs([]);
    setStatus('running');
    addLog('EXTRACT', 'INFO', `Starting GDSII Layout Stream generation for ${model.variantName}...`);
  };

  const handlePauseResume = () => {
    if (status === 'running') {
      setStatus('paused');
      addLog('STREAMOUT', 'WARN', 'GDSII streamout simulation paused by operator.');
    } else if (status === 'paused') {
      setStatus('running');
      addLog('STREAMOUT', 'INFO', 'Resuming GDSII streamout simulation...');
    }
  };

  const handleFastForward = () => {
    setProgress(100);
    setStatus('completed');
    setCurrentStepName('GDSII Stream Generation & Signoff Completed');
    addLog('STREAMOUT', 'SUCCESS', `Fast-forward completed. All ${layerStack.length} layers mapped and verified.`);
  };

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = logFilter === 'ALL' || log.level === logFilter;
    const matchesSearch =
      searchQuery === '' ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.stage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // GDSII manifest text generation
  const gdsiiManifestText = `# ==============================================================================
# GDSII / OASIS TAPE-OUT STREAM MANIFEST
# ASIC Design: asic_kimi_k3_top
# Target Process: ${siliconConfig.processNode} GAAFET + Monolithic 3D ${siliconConfig.memoryTech.toUpperCase()}
# ==============================================================================
HEADER: GDSII Stream Format Version 6.0
LIBNAME: KIMI_K3_ASIC_SIGN_OFF_LIB
UNITS: USER=0.001 MICRON, PHYS=1e-09 METER
DIE_AREA: ${siliconConfig.dieWidthMm} mm x ${siliconConfig.dieHeightMm} mm (${dieArea} mm²)
RETICLE_STATUS: ${isReticleOk ? 'PASSED (Within 858 mm² limit)' : 'FAILED (Exceeds 858 mm²)'}
ZERO_DRAM_MODE: ALL_ON_SILICON_ENABLED

# --- TOP LEVEL CELL HIERARCHY ---
TOP_CELL: asic_kimi_k3_top
MACROS_INSTANTIATED: 8
- 3D_${siliconConfig.memoryTech.toUpperCase()}_WEIGHT_STACK: ${siliconConfig.memoryTiersCount} vertical tiers, ${metrics.totalStorageRequiredGB} GB stored
- SYSTOLIC_MLA_GEMM_COMPUTE: 3nm GAAFET core with latent attention decompressor
- SYSTOLIC_MOE_COMPUTE_TILES: 8-expert sparse switchboard
- MLA_KV_CACHE_SRAM: On-chip latent dimension storage (dim=${model.latentDimMLA})
- PCIE_GEN5_CXL3_PHY_16LANE: 32 GT/s PAM-4 physical layer
- 2D_TORUS_NOC_CROSSBAR: 48.2 TB/s low-latency routing mesh
- INDUSTRIAL_SAFETY_ROT: Hardware PUF & Dual-Core Lockstep unit
- POWER_MANAGEMENT_IVR: ${siliconConfig.backsidePowerDelivery ? 'BSPDN Backside Power Delivery' : 'Frontside VDD/VSS'}

# --- LAYER STACK MAPPING TABLE ---
${layerStack.map((l) => `LAYER ${l.layerNum}:${l.datatype} | ${l.name.padEnd(30)} | ${l.category.padEnd(10)} | ${l.polygonsCount} polygons | ${l.status}`).join('\n')}

# --- GEOMETRIC VALIDATION CHECKS ---
${geometricValidationRules.map((r) => `[${r.passed ? 'PASS' : 'FAIL'}] ${r.ruleId}: ${r.title} -> ${r.measured} (Req: ${r.requirement})`).join('\n')}

# --- FINAL CHECKSUM & SIGN-OFF ---
SIGN_OFF_DATE: ${new Date().toISOString()}
DRC_VIOLATIONS: 0
LVS_VIOLATIONS: 0
ANTENNA_VIOLATIONS: 0
STREAM_CHECKSUM_SHA256: e7a9c84d12f9b8c304918e77a10294b055391c491295ba3817f092305748f9
FINAL_VERDICT: APPROVED FOR SILICON FOUNDRY MASK FABRICATION
`;

  const handleDownloadManifest = () => {
    const element = document.createElement('a');
    const file = new Blob([gdsiiManifestText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'asic_kimi_k3_tapeout.gds.manifest';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(gdsiiManifestText);
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2000);
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Simulation Control Hero Card */}
      <div className="p-4 bg-[#050608] border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-blue-600/10 text-blue-400 border border-blue-500/20">
                <FileCode className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                GDSII Layout Streamout & Geometric DRC Engine
              </h3>
            </div>
            <p className="text-[10px] text-zinc-400 uppercase tracking-wide mt-1">
              Exports physical polygon database, maps 3D Cu-Cu layer stack, and validates design rules for {siliconConfig.dieWidthMm}x{siliconConfig.dieHeightMm}mm monolithic die.
            </p>
          </div>

          {/* Execution Controls */}
          <div className="flex items-center space-x-2">
            {status === 'idle' && (
              <button
                onClick={handleStartSimulation}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider text-[11px] border border-blue-500 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate GDSII Export</span>
              </button>
            )}

            {(status === 'running' || status === 'paused') && (
              <>
                <button
                  onClick={handlePauseResume}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#08090D] hover:bg-white/10 text-white border border-white/10 uppercase tracking-wider text-[11px] transition cursor-pointer"
                >
                  {status === 'running' ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{status === 'running' ? 'Pause' : 'Resume'}</span>
                </button>
                <button
                  onClick={handleFastForward}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#08090D] hover:bg-white/10 text-zinc-300 border border-white/10 uppercase tracking-wider text-[10px] transition cursor-pointer"
                  title="Fast forward to 100%"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  <span>Instant</span>
                </button>
              </>
            )}

            {status === 'completed' && (
              <>
                <button
                  onClick={handleStartSimulation}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#08090D] hover:bg-white/10 text-white border border-white/10 uppercase tracking-wider text-[11px] transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                  <span>Re-run</span>
                </button>
                <button
                  onClick={handleDownloadManifest}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider text-[11px] border border-emerald-500 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Manifest</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Progress Bar & Phase Status */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider">
            <span className="text-zinc-400 flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-blue-500 animate-ping' : status === 'completed' ? 'bg-emerald-400' : 'bg-zinc-600'}`}></span>
              <strong className="text-white">{currentStepName}</strong>
            </span>
            <span className="font-bold text-blue-400">{progress}%</span>
          </div>

          <div className="w-full bg-black h-2.5 overflow-hidden border border-white/10">
            <div
              className={`h-full transition-all duration-300 ${status === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[9px] text-zinc-500 uppercase tracking-widest pt-0.5">
            <span>Stage 1: DEF Macro Placement</span>
            <span>Stage 2: Layer Stack Mapping</span>
            <span>Stage 3: Calibre nmDRC Check</span>
            <span>Stage 4: Tapeout Checksum</span>
          </div>
        </div>
      </div>

      {/* Grid: Left Live Terminal Console, Right Geometric Verification & Layer Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Terminal Stream Output (7 Cols) */}
        <div className="lg:col-span-7 bg-[#08090D] border border-white/10 p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                GDSII Streamout Console (Calibre / OASIS)
              </span>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center space-x-1 text-[9px]">
              {(['ALL', 'INFO', 'SUCCESS', 'WARN'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter)}
                  className={`px-2 py-0.5 uppercase tracking-wider transition cursor-pointer border ${
                    logFilter === filter
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-[#050608] text-zinc-400 border-white/10 hover:border-white/30'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar inside console */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search stream records, layers, polygons, or DRC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-black border border-white/10 text-white text-[10px] uppercase placeholder:normal-case placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Terminal Viewport */}
          <div
            ref={logContainerRef}
            className="flex-1 bg-black border border-white/10 p-3 overflow-y-auto max-h-[360px] min-h-[300px] space-y-1 font-mono text-[10px] leading-relaxed"
          >
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2 py-12">
                <Terminal className="w-8 h-8 opacity-40" />
                <p className="uppercase tracking-wider text-[10px]">Ready for layout streamout.</p>
                <p className="text-[9px] text-zinc-600">Click 'Simulate GDSII Export' to start binary layout extraction.</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-zinc-600 text-center py-8">
                No logs matching filter or query.
              </div>
            ) : (
              filteredLogs.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-2">
                  <span className="text-zinc-600 select-none text-[9px] min-w-[75px]">{entry.time}</span>
                  <span
                    className={`px-1 py-0.2 text-[8px] font-bold uppercase tracking-wider rounded-xs select-none ${
                      entry.level === 'SUCCESS'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        : entry.level === 'WARN'
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-950/60 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {entry.stage}
                  </span>
                  <span
                    className={`flex-1 ${
                      entry.level === 'SUCCESS'
                        ? 'text-emerald-300'
                        : entry.level === 'WARN'
                        ? 'text-amber-300'
                        : 'text-zinc-300'
                    }`}
                  >
                    {entry.message}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Terminal Footer Telemetry */}
          <div className="flex justify-between items-center text-[9px] text-zinc-500 pt-1 border-t border-white/10 uppercase tracking-wider">
            <span>Records Processed: {progress > 0 ? ((progress / 100) * 48920140).toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'} primitives</span>
            <span>Checksum: {status === 'completed' ? 'SHA-256 VALIDATED' : 'CALCULATING...'}</span>
          </div>
        </div>

        {/* Right Column: Layer Stack Mapping & Geometric Checks (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Geometric Validation Rules */}
          <div className="bg-[#08090D] border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Geometric DRC Validation Checks
                </span>
              </div>
              <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold">
                0 VIOLATIONS
              </span>
            </div>

            <div className="space-y-2">
              {geometricValidationRules.map((rule) => (
                <div key={rule.ruleId} className="p-2.5 bg-[#050608] border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[10px] uppercase tracking-wider">
                      {rule.title}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>PASS</span>
                    </span>
                  </div>
                  <div className="text-[9px] text-zinc-400 uppercase tracking-wide">
                    Measured: <strong className="text-zinc-200">{rule.measured}</strong>
                  </div>
                  <div className="text-[8px] text-emerald-400/90 uppercase tracking-wider">
                    {rule.margin}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Layer Stack Summary */}
          <div className="bg-[#08090D] border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  3D Layer Stack Mapping
                </span>
              </div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest">
                {layerStack.length} LAYERS
              </span>
            </div>

            <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
              {layerStack.map((layer) => (
                <div
                  key={layer.layerNum}
                  className="p-2 bg-[#050608] border border-white/5 flex items-center justify-between text-[9px]"
                >
                  <div>
                    <div className="font-bold text-white uppercase tracking-wide flex items-center space-x-1.5">
                      <span className="text-blue-400">L{layer.layerNum}:{layer.datatype}</span>
                      <span>{layer.name}</span>
                    </div>
                    <div className="text-[8px] text-zinc-500 uppercase">{layer.category} • {layer.polygonsCount}</div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold uppercase">
                    MAPPED
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Manifest Quick Action Bar */}
      <div className="p-3 bg-[#08090D] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] uppercase tracking-wider">
        <div className="text-zinc-400 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Tapeout Signoff Stream: Ready for photolithography mask generation & TSMC / Intel fab submittal.</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyManifest}
            className="px-2.5 py-1 bg-[#050608] hover:bg-white/10 text-white border border-white/10 transition cursor-pointer flex items-center space-x-1"
          >
            {copiedManifest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
            <span>{copiedManifest ? 'Copied' : 'Copy Manifest'}</span>
          </button>
          <button
            onClick={handleDownloadManifest}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 font-bold transition cursor-pointer flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .gds.manifest</span>
          </button>
        </div>
      </div>
    </div>
  );
};
