/**
 * Electronic Design Automation (EDA) Types for Kimi K3 On-Silicon ASIC
 */

export type MemoryTechType = '3d-reram' | '3d-fefet' | '3d-nand-ct' | 'dense-3d-sram' | 'mram-spin';

export type QuantizationPrecision = 'FP8_E4M3' | 'MXFP6' | 'MXFP4' | 'INT4' | 'TERNARY_1_58';

export type SerialLinkProtocol = 'PCIe_Gen5_x16' | 'CXL_3_0_Type2' | 'CXL_3_0_Type3' | 'PCIe_Gen5_x8_CXL_Combo';

export type CoolingSolution = 'copper_vapor_chamber' | 'diamond_heat_spreader' | 'microchannel_liquid' | 'passive_industrial_conduction';

export type IndustrialGrade = 'AEC_Q100_Grade1' | 'AEC_Q100_Grade0' | 'IEC_61508_SIL3' | 'Standard_Commercial';

export interface MacroBlock {
  id: string;
  name: string;
  type: 'weight_macro' | 'compute_core' | 'mla_kv_cache' | 'pcie_cxl_phy' | 'noc_router' | 'power_ivr' | 'pll_clock' | 'safety_rot';
  x: number; // in mm or grid units
  y: number;
  width: number;
  height: number;
  powerWatts: number;
  tempCelsius: number;
  activityRate: number; // 0 to 1
  tier: 'logic_base' | 'memory_tier_stack' | 'backside_power';
  description: string;
  color: string;
}

export interface KimiModelConfig {
  variantName: string;
  totalParamsBillion: number;
  activeParamsBillion: number;
  numLayers: number;
  hiddenDim: number;
  numAttentionHeads: number;
  numExperts: number;
  activeExpertsPerToken: number;
  contextWindowTokens: number;
  latentDimMLA: number; // Kimi's Multi-head Latent Attention compression dim
  precision: QuantizationPrecision;
}

export interface SiliconProcessConfig {
  processNode: '3nm_GAA' | '2nm_Nanosheet' | '18A_RibbonFET';
  dieWidthMm: number;
  dieHeightMm: number;
  reticleLimitMm2: number;
  memoryTiersCount: number; // 3D vertical stacked tiers (e.g. 16, 32, 64, 128)
  memoryTech: MemoryTechType;
  bondingPitchUm: number; // Cu-Cu Hybrid direct bonding pitch (e.g. 0.8 um)
  backsidePowerDelivery: boolean; // BSPDN / PowerVia
  cooling: CoolingSolution;
  ambientTempCelsius: number;
  targetTdpWatts: number;
  industrialGrade: IndustrialGrade;
}

export interface ThermalGridCell {
  x: number;
  y: number;
  temp: number;
  powerDensityWcm2: number;
  isHotspot: boolean;
}

export interface LatencyBreakdown {
  pcieCxlLinkLatencyNs: number;
  nocTraverseLatencyNs: number;
  onChipWeightReadNs: number; // near-zero!
  computeMlaGemmNs: number;
  kvCacheAccessNs: number;
  totalTokenLatencyMs: number;
  tokensPerSecond: number;
  timeToFirstTokenMs: number;
}

export interface PowerMetrics {
  computePowerW: number;
  weightMemoryPowerW: number; // 98% reduced from DRAM
  serialIoPowerW: number; // PCIe Gen 5 / CXL PHY
  leakagePowerW: number;
  clockNetworkPowerW: number;
  totalTdpW: number;
  energyPerTokenPicoJoules: number;
  dramEquivalentPowerW: number; // comparison metric
  powerSavingsPercent: number;
}

export interface EDAOptimizationMetrics {
  totalStorageRequiredGB: number;
  onChipStorageAvailableGB: number;
  storageFitPercentage: number;
  dieAreaMm2: number;
  siliconUtilizationPercent: number;
  maxJunctionTempCelsius: number;
  thermalThrottling: boolean;
  drcViolationCount: number;
  peakOnChipBandwidthTBps: number;
  deterministicJitterUs: number;
}
