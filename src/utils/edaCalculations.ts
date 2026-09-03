import {
  KimiModelConfig,
  SiliconProcessConfig,
  MacroBlock,
  ThermalGridCell,
  LatencyBreakdown,
  PowerMetrics,
  EDAOptimizationMetrics,
  MemoryTechType,
  QuantizationPrecision,
  CoolingSolution
} from '../types/eda';

export const KIMI_PRESETS: Record<string, KimiModelConfig> = {
  'kimi-k3-edge-moe': {
    variantName: 'Kimi K3-Edge MoE (32B/6B Active)',
    totalParamsBillion: 32,
    activeParamsBillion: 6,
    numLayers: 40,
    hiddenDim: 4096,
    numAttentionHeads: 32,
    numExperts: 16,
    activeExpertsPerToken: 2,
    contextWindowTokens: 65536,
    latentDimMLA: 512, // Kimi Multi-Head Latent Attention compression
    precision: 'MXFP4',
  },
  'kimi-k3-industrial-64b': {
    variantName: 'Kimi K3-Industrial (64B/12B Active)',
    totalParamsBillion: 64,
    activeParamsBillion: 12,
    numLayers: 56,
    hiddenDim: 5120,
    numAttentionHeads: 40,
    numExperts: 32,
    activeExpertsPerToken: 4,
    contextWindowTokens: 131072,
    latentDimMLA: 768,
    precision: 'MXFP4',
  },
  'kimi-k3-compact-14b': {
    variantName: 'Kimi K3-Compact Dense (14B)',
    totalParamsBillion: 14,
    activeParamsBillion: 14,
    numLayers: 32,
    hiddenDim: 3072,
    numAttentionHeads: 24,
    numExperts: 1,
    activeExpertsPerToken: 1,
    contextWindowTokens: 32768,
    latentDimMLA: 384,
    precision: 'INT4',
  },
  'kimi-k3-ternary-60b': {
    variantName: 'Kimi K3-Ternary 1.58b Ultra-Edge (60B)',
    totalParamsBillion: 60,
    activeParamsBillion: 10,
    numLayers: 48,
    hiddenDim: 4608,
    numAttentionHeads: 36,
    numExperts: 24,
    activeExpertsPerToken: 2,
    contextWindowTokens: 65536,
    latentDimMLA: 512,
    precision: 'TERNARY_1_58',
  }
};

export const DEFAULT_SILICON_CONFIG: SiliconProcessConfig = {
  processNode: '3nm_GAA',
  dieWidthMm: 24,
  dieHeightMm: 24,
  reticleLimitMm2: 858,
  memoryTiersCount: 64, // 64 vertical 3D memory layers
  memoryTech: '3d-reram',
  bondingPitchUm: 0.8,
  backsidePowerDelivery: true,
  cooling: 'diamond_heat_spreader',
  ambientTempCelsius: 45, // industrial enclosure temperature
  targetTdpWatts: 85,
  industrialGrade: 'AEC_Q100_Grade1'
};

export function getBytesPerParam(precision: QuantizationPrecision): number {
  switch (precision) {
    case 'FP8_E4M3':
      return 1.05; // 8-bit + block scales
    case 'MXFP6':
      return 0.80; // 6-bit + microscaling
    case 'MXFP4':
      return 0.54; // 4-bit + microscaling scale vectors
    case 'INT4':
      return 0.52; // 4-bit packed
    case 'TERNARY_1_58':
      return 0.24; // 1.58 bits + residual scaling
    default:
      return 0.54;
  }
}

export function getMemoryDensityPerTier(tech: MemoryTechType): number {
  // Density in Megabytes per mm2 per single 3D stacked tier
  // 1 Byte = 8 bits
  switch (tech) {
    case '3d-reram':
      return 3.2; // ~25.6 Gb/mm2 equivalent crossbar
    case '3d-fefet':
      return 2.6; // ~20.8 Gb/mm2
    case '3d-nand-ct':
      return 5.1; // Read-only optimized 3D Charge-Trap
    case 'dense-3d-sram':
      return 0.65; // High-density monolithic 3D SRAM
    case 'mram-spin':
      return 1.1; // Spin-torque MRAM
    default:
      return 2.5;
  }
}

export function calculateOptimizationMetrics(
  model: KimiModelConfig,
  silicon: SiliconProcessConfig,
  macros: MacroBlock[]
): EDAOptimizationMetrics {
  const bytesPerParam = getBytesPerParam(model.precision);
  // Total weight storage required in GB
  const weightStorageGB = (model.totalParamsBillion * 1e9 * bytesPerParam) / (1024 ** 3);
  
  // KV Cache & MLA context buffer (compressed with MLA latent dim)
  const kvCacheGB = (model.contextWindowTokens * model.latentDimMLA * model.numLayers * 2 * 2) / (1024 ** 3);
  const totalStorageRequiredGB = weightStorageGB + kvCacheGB;

  const dieAreaMm2 = silicon.dieWidthMm * silicon.dieHeightMm;
  
  // Memory macro footprint calculation
  const memoryMacroAreaMm2 = macros
    .filter(m => m.type === 'weight_macro')
    .reduce((acc, m) => acc + (m.width * m.height), 0);
  
  const densityPerTier = getMemoryDensityPerTier(silicon.memoryTech); // MB/mm2
  // Total on-chip storage across vertical 3D tiers
  const onChipStorageAvailableGB = (memoryMacroAreaMm2 * densityPerTier * silicon.memoryTiersCount) / 1024;
  
  const storageFitPercentage = Math.min(100, Math.round((onChipStorageAvailableGB / totalStorageRequiredGB) * 100));

  const totalMacroArea = macros.reduce((acc, m) => acc + (m.width * m.height), 0);
  const siliconUtilizationPercent = Math.min(100, Math.round((totalMacroArea / dieAreaMm2) * 100));

  // Thermal metrics
  const thermalRes = getCoolingThermalResistance(silicon.cooling);
  const totalPower = macros.reduce((acc, m) => acc + m.powerWatts, 0);
  const hotspotDelta = Math.max(...macros.map(m => m.tempCelsius)) - Math.min(...macros.map(m => m.tempCelsius));
  const maxJunctionTempCelsius = Math.round(silicon.ambientTempCelsius + (totalPower * thermalRes) + (hotspotDelta * 0.4));
  const thermalThrottling = maxJunctionTempCelsius > (silicon.industrialGrade === 'AEC_Q100_Grade0' ? 135 : 105);

  // Design Rule Check: Overlap checks and boundaries
  let drcViolations = 0;
  for (let i = 0; i < macros.length; i++) {
    const a = macros[i];
    if (a.x < 0 || a.y < 0 || (a.x + a.width) > silicon.dieWidthMm || (a.y + a.height) > silicon.dieHeightMm) {
      drcViolations++;
    }
    for (let j = i + 1; j < macros.length; j++) {
      const b = macros[j];
      if (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      ) {
        drcViolations++;
      }
    }
  }

  // Peak on-chip bandwidth (Terabytes per second)
  // Memory tier Cu-Cu hybrid bonding interfaces at 0.8um pitch provide massive parallel bitlines
  const bondingDensityFactor = 1.0 / (silicon.bondingPitchUm * silicon.bondingPitchUm);
  const peakOnChipBandwidthTBps = Math.round((memoryMacroAreaMm2 * 0.15 * bondingDensityFactor * 1.8));

  // Deterministic Jitter (zero DRAM refresh and zero bus collisions)
  const deterministicJitterUs = +(0.8 + (drcViolations * 0.2)).toFixed(2);

  return {
    totalStorageRequiredGB: +totalStorageRequiredGB.toFixed(2),
    onChipStorageAvailableGB: +onChipStorageAvailableGB.toFixed(2),
    storageFitPercentage,
    dieAreaMm2,
    siliconUtilizationPercent,
    maxJunctionTempCelsius,
    thermalThrottling,
    drcViolationCount: drcViolations,
    peakOnChipBandwidthTBps,
    deterministicJitterUs
  };
}

export function getCoolingThermalResistance(cooling: CoolingSolution): number {
  switch (cooling) {
    case 'diamond_heat_spreader':
      return 0.085; // C/W
    case 'microchannel_liquid':
      return 0.048;
    case 'copper_vapor_chamber':
      return 0.145;
    case 'passive_industrial_conduction':
      return 0.320;
    default:
      return 0.120;
  }
}

export function calculatePowerMetrics(
  model: KimiModelConfig,
  silicon: SiliconProcessConfig,
  macros: MacroBlock[],
  batchTokensPerSec: number = 120
): PowerMetrics {
  // Compute GEMM power
  const computePowerW = +(macros.filter(m => m.type === 'compute_core').reduce((acc, m) => acc + m.powerWatts, 0)).toFixed(1);
  
  // On-chip memory weight read energy (0.18 pJ/bit in 3D monolithic Cu-Cu bonding)
  // Active weights read per token: activeParams * bytesPerParam
  const bytesReadPerToken = model.activeParamsBillion * 1e9 * getBytesPerParam(model.precision);
  const bitsReadPerSec = bytesReadPerToken * 8 * batchTokensPerSec;
  const onChipEnergyPerBitJoules = 0.18e-12; // 0.18 pJ/bit
  const weightMemoryPowerW = +(bitsReadPerSec * onChipEnergyPerBitJoules).toFixed(2);

  // Serial link PHY power (PCIe Gen 5 / CXL 3.0 controller + 16 lanes at 32 GT/s ~ 3.5 pJ/bit)
  const serialIoPowerW = 5.2; // PCIe Gen 5 x16 + CXL 3.0 link layer
  const leakagePowerW = +(silicon.backsidePowerDelivery ? 3.4 : 5.8); // Backside power reduces IR drop and leakage
  const clockNetworkPowerW = 4.1;

  const totalTdpW = +(+computePowerW + +weightMemoryPowerW + serialIoPowerW + leakagePowerW + clockNetworkPowerW).toFixed(1);

  // DRAM Equivalent power: Standard external LPDDR5X/HBM3 read energy is ~18-22 pJ/bit plus DRAM termination/refresh
  const dramEnergyPerBitJoules = 20.0e-12; // 20 pJ/bit
  const dramWeightReadPowerW = bitsReadPerSec * dramEnergyPerBitJoules;
  const dramEquivalentPowerW = +(+computePowerW + dramWeightReadPowerW + serialIoPowerW + 28.0).toFixed(1); // 28W DRAM controller/interface overhead

  const powerSavingsPercent = Math.min(99, Math.round(((dramEquivalentPowerW - totalTdpW) / dramEquivalentPowerW) * 100));
  const energyPerTokenPicoJoules = Math.round((totalTdpW / batchTokensPerSec) * 1e12);

  return {
    computePowerW: +computePowerW,
    weightMemoryPowerW: +weightMemoryPowerW,
    serialIoPowerW,
    leakagePowerW,
    clockNetworkPowerW,
    totalTdpW,
    energyPerTokenPicoJoules,
    dramEquivalentPowerW,
    powerSavingsPercent
  };
}

export function calculateLatencyMetrics(
  model: KimiModelConfig,
  silicon: SiliconProcessConfig
): LatencyBreakdown {
  // PCIe Gen 5 / CXL 3.0 serial link latency:
  // CXL.mem direct flit access: ~68ns flit packetization & link layer
  const pcieCxlLinkLatencyNs = 72; // nanoseconds
  
  // 2D Mesh On-Chip Network (NoC) traversal across die
  const nocTraverseLatencyNs = 24;

  // On-chip weight read: zero DRAM paging, 3D vertical TSV delay is ~3.2 ns!
  const onChipWeightReadNs = 3.8;

  // Compute GEMM pipeline (MLA projection + MoE feed-forward)
  const computeMlaGemmNs = 340;

  // KV Cache latency (on-chip SRAM/eDRAM)
  const kvCacheAccessNs = 8.5;

  // Total Token Latency in milliseconds:
  // Since all weights are on-chip, we achieve true real-time token streaming
  const perTokenLatencyMs = (computeMlaGemmNs + onChipWeightReadNs + kvCacheAccessNs + (pcieCxlLinkLatencyNs * 0.05)) / 100;
  const totalTokenLatencyMs = +Math.max(0.8, perTokenLatencyMs).toFixed(2);
  
  const tokensPerSecond = Math.round(1000 / totalTokenLatencyMs);
  const timeToFirstTokenMs = +(pcieCxlLinkLatencyNs * 0.001 + 1.2).toFixed(2);

  return {
    pcieCxlLinkLatencyNs,
    nocTraverseLatencyNs,
    onChipWeightReadNs,
    computeMlaGemmNs,
    kvCacheAccessNs,
    totalTokenLatencyMs,
    tokensPerSecond,
    timeToFirstTokenMs
  };
}

export function generateInitialMacros(dieW: number = 24, dieH: number = 24): MacroBlock[] {
  // Balanced default floorplan for 24x24mm die with 3D memory stacked tiers
  return [
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
      color: '#0284c7'
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
      color: '#0284c7'
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
      color: '#ea580c'
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
      color: '#ea580c'
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
      color: '#16a34a'
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
      color: '#8b5cf6'
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
      color: '#0891b2'
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
      color: '#d97706'
    }
  ];
}

export function computeThermalGrid(
  macros: MacroBlock[],
  dieW: number,
  dieH: number,
  ambientTemp: number,
  cooling: CoolingSolution
): ThermalGridCell[][] {
  const gridSize = 16;
  const cellW = dieW / gridSize;
  const cellH = dieH / gridSize;
  const grid: ThermalGridCell[][] = [];
  const coolingRes = getCoolingThermalResistance(cooling);

  for (let gy = 0; gy < gridSize; gy++) {
    const row: ThermalGridCell[] = [];
    for (let gx = 0; gx < gridSize; gx++) {
      const realX = gx * cellW;
      const realY = gy * cellH;

      // Calculate power contributions from all macros weighted by distance
      let cellPowerDensity = 0.5; // baseline substrate leakage

      for (const m of macros) {
        const mCenterX = m.x + m.width / 2;
        const mCenterY = m.y + m.height / 2;
        const distSq = (realX - mCenterX) ** 2 + (realY - mCenterY) ** 2;
        const macroArea = m.width * m.height;
        const pDensity = m.powerWatts / macroArea;

        // Is inside macro?
        if (realX >= m.x && realX <= m.x + m.width && realY >= m.y && realY <= m.y + m.height) {
          cellPowerDensity += pDensity * 1.6;
        } else {
          // Heat diffusion decay
          cellPowerDensity += (pDensity * 0.45) / (1 + distSq * 0.3);
        }
      }

      // Calculate localized temperature
      const temp = Math.round(ambientTemp + (cellPowerDensity * coolingRes * 52));
      const isHotspot = temp > (ambientTemp + 40);

      row.push({
        x: gx,
        y: gy,
        temp,
        powerDensityWcm2: +cellPowerDensity.toFixed(2),
        isHotspot
      });
    }
    grid.push(row);
  }

  return grid;
}

export function generateVerilogRTL(model: KimiModelConfig, silicon: SiliconProcessConfig): string {
  return `// =============================================================================
// Auto-Generated EDA Hardware Module: ASIC_KIMI_K3_ON_SILICON_TOP
// Target: Single-Chip Monolithic 3D NVM ASIC for Kimi K3 Edge Inference
// Serial Interface: PCIe Gen 5 x16 / CXL 3.0 (CXL.io + CXL.mem)
// Memory Architecture: 3D-Stacked ${silicon.memoryTech.toUpperCase()} (${silicon.memoryTiersCount} Tiers)
// Generated by Google AI Studio EDA Suite
// =============================================================================

\`timescale 1ps / 1fs

module asic_kimi_k3_top #(
    parameter TOTAL_PARAMS_BILLION    = ${model.totalParamsBillion},
    parameter ACTIVE_EXPERTS_PER_TOK  = ${model.activeExpertsPerToken},
    parameter NUM_EXPERTS_TOTAL       = ${model.numExperts},
    parameter LATENT_DIM_MLA          = ${model.latentDimMLA},
    parameter PRECISION_MODE          = "${model.precision}",
    parameter NUM_MEMORY_TIERS        = ${silicon.memoryTiersCount},
    parameter CXL_FLIT_WIDTH_BITS     = 256,
    parameter PCIE_LANES              = 16
)(
    // Primary Differential Clock & Reset
    input  wire                     sys_clk_p,
    input  wire                     sys_clk_n,
    input  wire                     rst_n,

    // PCIe Gen 5 x16 / CXL 3.0 High-Speed Serial PHY Interface
    input  wire [PCIE_LANES-1:0]    pcie_rx_p,
    input  wire [PCIE_LANES-1:0]    pcie_rx_n,
    output wire [PCIE_LANES-1:0]    pcie_tx_p,
    output wire [PCIE_LANES-1:0]    pcie_tx_n,

    // Industrial Hard-Determinism Real-Time Interrupt
    output wire                     rt_deadline_irq,
    output wire                     rt_ecc_fault_alarm,

    // On-Chip Thermal Sensor Monitoring Bus
    input  wire [7:0]               tsensor_die_temp_raw,
    output wire                     thermal_throttle_strobe
);

    // -------------------------------------------------------------------------
    // Internal Wires & Busses
    // -------------------------------------------------------------------------
    wire [CXL_FLIT_WIDTH_BITS-1:0]  cxl_mem_req_flit;
    wire                            cxl_mem_req_valid;
    wire                            cxl_mem_req_ready;
    wire [CXL_FLIT_WIDTH_BITS-1:0]  cxl_mem_rsp_flit;
    wire                            cxl_mem_rsp_valid;

    // Direct Monolithic 3D Memory Bus (Zero External DRAM)
    wire [4095:0]                   on_chip_weight_bus;
    wire [31:0]                     weight_tier_addr;
    wire                            weight_read_enable;

    // -------------------------------------------------------------------------
    // Sub-Module: CXL 3.0 / PCIe Gen 5 Dual-Protocol Controller
    // -------------------------------------------------------------------------
    cxl_pcie_dual_mode_controller #(
        .LANE_COUNT(PCIE_LANES),
        .DATA_RATE_GT_S(32),
        .SUPPORT_CXL_MEM(1),
        .SUPPORT_CXL_CACHE(1)
    ) u_cxl_controller (
        .clk              (sys_clk_p),
        .rst_n            (rst_n),
        .rx_p             (pcie_rx_p),
        .rx_n             (pcie_rx_n),
        .tx_p             (pcie_tx_p),
        .tx_n             (pcie_tx_n),
        .cxl_flit_out     (cxl_mem_req_flit),
        .cxl_flit_valid   (cxl_mem_req_valid),
        .cxl_flit_ready   (cxl_mem_req_ready),
        .cxl_flit_in      (cxl_mem_rsp_flit),
        .cxl_flit_in_valid(cxl_mem_rsp_valid)
    );

    // -------------------------------------------------------------------------
    // Sub-Module: Monolithic 3D On-Silicon Weight Array Controller
    // Eliminates external DRAM bottleneck with direct Cu-Cu vertical hybrid vias
    // -------------------------------------------------------------------------
    monolithic_3d_weight_storage_array #(
        .TIER_COUNT(${silicon.memoryTiersCount}),
        .CELL_TECH("${silicon.memoryTech}"),
        .DATA_BUS_WIDTH(4096)
    ) u_onchip_weights (
        .clk              (sys_clk_p),
        .rst_n            (rst_n),
        .tier_select      (weight_tier_addr),
        .read_enable      (weight_read_enable),
        .data_out         (on_chip_weight_bus),
        .ecc_corrected_err(),
        .ecc_uncorrectable(rt_ecc_fault_alarm)
    );

    // -------------------------------------------------------------------------
    // Sub-Module: Kimi K3 Multi-Head Latent Attention (MLA) Decompression Core
    // -------------------------------------------------------------------------
    kimi_mla_decompression_engine #(
        .LATENT_DIM(LATENT_DIM_MLA),
        .MAX_CONTEXT(${model.contextWindowTokens})
    ) u_mla_engine (
        .clk              (sys_clk_p),
        .rst_n            (rst_n),
        .compressed_kv_in (cxl_mem_req_flit),
        .decompressed_qkv ()
    );

    // -------------------------------------------------------------------------
    // Sub-Module: Sparse MoE Systolic Compute Array (Edge Deterministic)
    // -------------------------------------------------------------------------
    moe_systolic_core_array #(
        .ACTIVE_EXPERTS(${model.activeExpertsPerToken}),
        .TOTAL_EXPERTS(${model.numExperts}),
        .WEIGHT_BUS_WIDTH(4096)
    ) u_moe_compute (
        .clk              (sys_clk_p),
        .rst_n            (rst_n),
        .weight_data_in   (on_chip_weight_bus),
        .result_valid     (rt_deadline_irq)
    );

endmodule
`;
}
