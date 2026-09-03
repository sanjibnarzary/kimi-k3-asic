# Kimi K3 On-Silicon ASIC EDA Suite

An Electronic Design Automation (EDA) suite and architectural co-design workbench for single-chip monolithic 3D ASICs that integrate all pretrained **Kimi K3** transformer weights directly on silicon. Designed for zero-DRAM edge robotics, real-time automated optical inspection (AOI), and autonomous industrial systems requiring hard determinism with zero external memory bus contention.

---

## Architecture Overview

Traditional Large Language Model (LLM) inference suffers from the "memory wall": off-chip DRAM / HBM access consumes 10–100× more energy than compute and introduces periodic refresh latency spikes ($t_{\text{REFI}}$ stalls). 

The **Kimi K3 On-Silicon ASIC EDA Suite** models a monolithic 3D semiconductor architecture that stacks non-volatile memory (ReRAM, FeRAM, MRAM, PCM) directly atop a 3nm GAAFET logic tier using Cu-Cu direct hybrid bonding (<1 µm pitch). By holding 100% of Kimi K3's pretrained weights on-chip:
- **Zero DRAM Latency Spikes**: Eliminates DDR/HBM bus arbitration, page miss overheads, and thermal throttling of external memory controllers.
- **Sub-Microsecond Determinism**: Guarantees worst-case execution time (WCET) jitter $< 0.12\ \mu\text{s}$ for safety-critical closed-loop industrial controls.
- **Massive Energy Reduction**: Replaces 20 pJ/bit external bus transitions with $< 0.5$ pJ/bit vertical Cu-Cu via interconnects.

---

## Core Modules & Capabilities

### 1. ASIC Floorplan & Monolithic 3D Die Editor
- **Interactive Macro Placement**: Arrange compute cores, systolic attention engines, 3D memory tiles, NoC crossbars, and PCIe/CXL PHYs.
- **Reticle Mask Limits**: Real-time checking against photolithography stepper reticle boundaries ($\le 858\text{ mm}^2$).
- **3D Memory Stacking**: Configurable memory tiers (16 to 128 vertical tiers) with density scaling for FeRAM, ReRAM, MRAM, and 3D NAND.
- **Advanced Packaging Options**: Toggle Backside Power Delivery Network (BSPDN / PowerVia) and sub-micron Cu-Cu hybrid bonding pitches.

### 2. Kimi K3 Weight & Architecture Optimizer
- **Model Variants**: Preconfigured for Kimi K3 Edge MoE (8B active / 16 experts), Vision-Language (14B), and Compact Real-Time (4B).
- **Precision Scaling**: Evaluate FP8, INT4, Ternary 1.58-bit ($W \in \{-1, 0, 1\}$), and sparse 2-bit quantization for expert parameters.
- **Multi-Head Latent Attention (MLA)**: Models KV cache compression using low-rank latent projections, slashing on-chip SRAM requirements by up to 80%.

### 3. 3D Thermal & Junction Simulator ($T_j$)
- **8×8 Finite-Element Thermal Grid**: Calculates localized power density ($W/\text{cm}^2$) and thermal gradient dissipation across monolithic stacked tiers.
- **Cooling Profiles**: Simulate passive convection, 100 CFM forced air, microchannel liquid cold plates, and vapor-chamber heat spreaders.
- **Thermal Throttling Protection**: Live warning when peak junction temperature exceeds $105^\circ\text{C}$ safe limits.

### 4. PCIe Gen 5 & CXL 3.0 Interconnect Analyzer
- **SerDes Configuration**: Select lane widths from x4 to x16 at 32 GT/s PAM-4 signaling (delivering up to 128 GB/s bidirectional throughput).
- **Latency Breakdown**: Sub-microsecond protocol analysis across SerDes PHY, CXL link layers, DMA engines, and NoC crossbars.
- **Protocol Modes**: Supports both CXL.io (traditional control) and CXL.mem (direct host-to-device memory semantic streaming).

### 5. Autonomous Industrial Edge & Determinism Signoff
- **Hard Real-Time Latency Verification**: Benchmarks inference against industrial control deadlines (e.g., 2 kHz quadruped robotics, 10 kHz magnetic levitation, 500 Hz AOI sorting).
- **Reliability Standards**: AEC-Q100 automotive grade ratings (Grade 1 to 3: $-40^\circ\text{C}$ to $+125^\circ\text{C}$) and IEC 61508 SIL-3 compliance.
- **Fault-Tolerant Silicon**: Dual-Core Lockstep (DCLS) pipeline comparators, background SECDED ECC scrubbers, and hardware Root of Trust (RoT) with Physical Unclonable Functions (PUF).

### 6. Signoff Verification, RTL Exporter & GDSII Streamout
- **Comprehensive Signoff Checklist**: Single-view verification for physical DRC, weight fit, thermal safety margins, power ceilings, and STA timing closure.
- **SystemVerilog RTL Exporter**: Generates synthesizable top-level RTL (`asic_kimi_k3_top.v`) with CXL 3.0 controller, systolic MLA GEMM arrays, and 3D memory tier interfaces.
- **Floorplan DEF 5.8 Exporter**: Produces physical layout manifests (`kimi_k3_floorplan.def`) with component coordinates and pin placements.
- **GDSII / OASIS Streamout Simulator**: Simulates full layer stack mapping (FEOL, MOL, BEOL, Cu-Cu pads, 3D memory tiers, BSPDN), Calibre nmDRC checks, and tapeout checksum generation (`.gds.manifest`).

---

## Technical Specifications

| Parameter | Default Value | Configurable Range |
| :--- | :--- | :--- |
| **Logic Process Node** | 3nm GAAFET (Nanosheet) | 2nm, 3nm, 5nm FinFET |
| **Die Dimensions** | 24.0 mm × 24.0 mm (576 mm²) | 12.0 mm to 30.0 mm |
| **Reticle Boundary Limit** | 858 mm² (Photolithography Mask) | 858 mm² |
| **Monolithic Memory Tiers** | 64 vertical layers | 16 to 128 layers |
| **Memory Technology** | 3D ReRAM (Crossbar array) | FeRAM, ReRAM, MRAM, PCM, NAND |
| **Cu-Cu Hybrid Bond Pitch** | 0.85 µm | 0.50 µm to 2.00 µm |
| **Host Interconnect** | PCIe Gen 5 / CXL 3.0 x16 | x4, x8, x16 (32 GT/s) |
| **Max Clock Frequency** | 1.40 GHz | 0.80 GHz to 2.20 GHz |
| **Max Safe Junction Temp ($T_j$)** | 105°C | 85°C to 125°C |

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### Installation
```bash
# Clone or open the repository
git clone https://github.com/sanjibnarzary/kimi-k3-asic.git
cd kimi-k3-asic

# Install dependencies
npm install
```

### Running Locally
```bash
# Start the Vite development server (bound to port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the EDA suite.

### Building for Production
```bash
# Compile and package production bundle
npm run build

# Preview production build
npm run preview
```

### Type Checking & Linting
```bash
# Run TypeScript compilation checks
npm run lint
```

---

## Project Structure

```
├── public/                     # Static assets and favicon
├── src/
│   ├── components/
│   │   ├── FloorplanViewer.tsx         # 2D/3D silicon die layout & macro placement
│   │   ├── GdsiiStreamView.tsx         # GDSII/OASIS layout stream simulation & console
│   │   ├── Header.tsx                  # Global navbar, model presets, and metrics banner
│   │   ├── IndustrialEdgeProfile.tsx   # Hard determinism, SIL-3 safety & AEC-Q100 checks
│   │   ├── InterconnectAnalyzer.tsx    # PCIe Gen 5 & CXL 3.0 PHY latency analysis
│   │   ├── KimiWeightOptimizer.tsx     # Quantization, MLA KV cache & tier capacity
│   │   ├── RTLSignoffModal.tsx         # SystemVerilog, DEF 5.8 & GDSII export modal
│   │   └── ThermalSimulator.tsx        # Finite-element 3D junction temperature grid
│   ├── types/
│   │   └── eda.ts                      # TypeScript models for EDA configuration & metrics
│   ├── utils/
│   │   └── edaCalculations.ts          # Physical formulas, latency models, and Verilog generator
│   ├── App.tsx                         # Main container and EDA state coordinator
│   ├── index.css                       # Tailwind CSS styling and theme configuration
│   └── main.tsx                        # React application entry point
├── metadata.json               # AI Studio project configuration & permissions
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite bundler configuration
```

---

## License

This project is open-source under the MIT License.
