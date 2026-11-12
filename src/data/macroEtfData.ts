// ============================================================================
// MACRO & INSTITUTIONAL ETF INTELLIGENCE DATA REPOSITORY
// Benchmarked against MacroMicro (Global M2), St. Louis Fed FRED,
// Farside Investors (Spot ETF Daily Flows), and Arkham Intelligence (On-Chain Holdings).
// STATUS: BENCHMARK SURVEY SAMPLE (Explicitly labeled for transparent data provenance)
// ============================================================================

export interface DataProvenanceTag {
  isSampleData: boolean;
  status: 'LIVE_STREAM' | 'LIVE_API' | 'BENCHMARK_SAMPLE' | 'SYNTHETIC_MODEL';
  sourceName: string;
  sourceUrl?: string;
  lastUpdated: string;
  provenanceNoticeVi: string;
  provenanceNoticeEn: string;
}

export const ETF_PROVENANCE_TAG: DataProvenanceTag = {
  isSampleData: true,
  status: 'BENCHMARK_SAMPLE',
  sourceName: 'Farside Investors / Arkham Intelligence / Newhedge Snapshot',
  sourceUrl: 'https://newhedge.io/product/bitcoin-etf-data',
  lastUpdated: '2026-11-09',
  provenanceNoticeVi: 'Dữ liệu khảo sát mẫu tĩnh (Snapshot 09/11/2026), chưa có feed API trực tiếp',
  provenanceNoticeEn: 'Static benchmark survey snapshot (2026-11-09), direct live API feed pending',
};

export const M2_PROVENANCE_TAG: DataProvenanceTag = {
  isSampleData: true,
  status: 'BENCHMARK_SAMPLE',
  sourceName: 'St. Louis Fed FRED / MacroMicro Global M2 Survey',
  sourceUrl: 'https://fred.stlouisfed.org',
  lastUpdated: '2026-11',
  provenanceNoticeVi: 'Chuỗi 25 mốc khảo sát mẫu từ 2020 đến 11/2026, chưa có feed API FRED tự động',
  provenanceNoticeEn: 'Sample 25-point survey series from 2020 to 2026-11, automated FRED API pending',
};

export interface GlobalM2DataPoint {
  date: string;          // YYYY-MM
  m2TrillionsUSD: number;// Aggregate Global M2 in Trillions USD (Fed + ECB + PBoC + BoJ)
  m2YoYGrowth: number;   // Year-over-Year Growth Rate (%)
  btcPrice: number;      // BTC Close at period ($)
  regime: 'EXPANSION' | 'CONTRACTION' | 'NEUTRAL';
  leadSignal: string;    // Actionable institutional interpretation
}

export interface SpotEtfFundDetail {
  ticker: string;
  name: string;
  issuer: string;
  btcHoldings: number;
  aumMillionsUSD: number;
  flow24hMillionsUSD: number;
  flow7dMillionsUSD: number;
  expenseRatio: number;  // Fee %
  custodian: string;
  sharePct: number;      // % of total US ETF BTC holdings
}

export interface EtfDailyFlowPoint {
  date: string;          // YYYY-MM-DD
  netFlowMillionsUSD: number;
  cumulativeMillionsUSD: number;
  btcAbsorbed: number;   // Net BTC bought (or sold if negative)
  minerDailySupply: number; // 450 BTC/day post-April 2024 halving
}

// ----------------------------------------------------------------------------
// 1. GLOBAL M2 MONEY SUPPLY & BITCOIN LIQUIDITY CYCLE (2020 - 2026)
// Sources: St. Louis Fed FRED, PBoC Quarterly Bulletin, ECB Statistical Data Warehouse, Bank of Japan
// ----------------------------------------------------------------------------
export const GLOBAL_M2_SERIES: GlobalM2DataPoint[] = [
  { date: '2020-03', m2TrillionsUSD: 84.2, m2YoYGrowth: 6.8, btcPrice: 6400, regime: 'EXPANSION', leadSignal: 'Bơm tiền COVID-19 khẩn cấp: Khởi đầu siêu chu kỳ thanh khoản' },
  { date: '2020-06', m2TrillionsUSD: 89.5, m2YoYGrowth: 14.2, btcPrice: 9100, regime: 'EXPANSION', leadSignal: 'Fed mở bảng cân đối kế toán, M2 toàn cầu lập kỷ lục tăng trưởng' },
  { date: '2020-09', m2TrillionsUSD: 93.1, m2YoYGrowth: 17.5, btcPrice: 10800, regime: 'EXPANSION', leadSignal: 'Thanh khoản bùng nổ vượt 17% YoY; MicroStrategy bắt đầu tích lũy' },
  { date: '2020-12', m2TrillionsUSD: 96.4, m2YoYGrowth: 19.8, btcPrice: 28900, regime: 'EXPANSION', leadSignal: 'M2 đạt đỉnh tốc độ mở rộng; Bitcoin phá vỡ đỉnh lịch sử 20k' },
  { date: '2021-03', m2TrillionsUSD: 98.2, m2YoYGrowth: 16.5, btcPrice: 58800, regime: 'EXPANSION', leadSignal: 'Sóng tăng parabol theo quán tính thanh khoản toàn cầu' },
  { date: '2021-06', m2TrillionsUSD: 99.8, m2YoYGrowth: 11.2, btcPrice: 35000, regime: 'NEUTRAL', leadSignal: 'Tốc độ cung tiền giảm tốc, Trung Quốc cấm đào coin cục bộ' },
  { date: '2021-11', m2TrillionsUSD: 102.5, m2YoYGrowth: 8.4, btcPrice: 67500, regime: 'NEUTRAL', leadSignal: 'Đỉnh chu kỳ giá BTC; Fed phát tín hiệu chuẩn bị thắt chặt định lượng (QT)' },
  { date: '2022-03', m2TrillionsUSD: 103.1, m2YoYGrowth: 3.5, btcPrice: 45500, regime: 'CONTRACTION', leadSignal: 'Fed nâng lãi suất lần đầu tiên; chu kỳ thắt chặt thanh khoản bắt đầu' },
  { date: '2022-06', m2TrillionsUSD: 100.8, m2YoYGrowth: -1.2, btcPrice: 19900, regime: 'CONTRACTION', leadSignal: 'M2 suy giảm âm; khủng hoảng thanh khoản tiền số (Terra/Luna, 3AC)' },
  { date: '2022-11', m2TrillionsUSD: 98.4, m2YoYGrowth: -4.8, btcPrice: 16500, regime: 'CONTRACTION', leadSignal: 'Đáy chu kỳ thanh khoản thắt chặt nhất thập kỷ; sự cố sụp đổ FTX' },
  { date: '2023-03', m2TrillionsUSD: 99.2, m2YoYGrowth: -3.2, btcPrice: 28400, regime: 'CONTRACTION', leadSignal: 'Khủng hoảng ngân hàng Mỹ (SVB); Fed bơm thanh khoản cứu trợ khẩn cấp BTFP' },
  { date: '2023-09', m2TrillionsUSD: 100.5, m2YoYGrowth: -0.8, btcPrice: 27000, regime: 'NEUTRAL', leadSignal: 'M2 thoát đáy thu hẹp, bắt đầu đi ngang tích lũy đáy vĩ mô' },
  { date: '2023-12', m2TrillionsUSD: 102.1, m2YoYGrowth: 1.5, btcPrice: 42200, regime: 'EXPANSION', leadSignal: 'M2 toàn cầu chính thức chuyển sang dương (+1.5%); kỳ vọng US Spot ETF' },
  { date: '2024-03', m2TrillionsUSD: 103.8, m2YoYGrowth: 3.2, btcPrice: 71200, regime: 'EXPANSION', leadSignal: 'US Spot ETF thu hút dòng vốn kỷ lục; phá ATH trước thềm Halving' },
  { date: '2024-06', m2TrillionsUSD: 104.9, m2YoYGrowth: 3.9, btcPrice: 62700, regime: 'EXPANSION', leadSignal: 'Halving lần 4 hoàn tất, nguồn cung mới giảm về 450 BTC/ngày' },
  { date: '2024-09', m2TrillionsUSD: 106.1, m2YoYGrowth: 4.8, btcPrice: 63300, regime: 'EXPANSION', leadSignal: 'Fed hạ lãi suất 50 bps; PBoC tung gói kích thích kinh tế khổng lồ' },
  { date: '2024-11', m2TrillionsUSD: 106.5, m2YoYGrowth: 4.9, btcPrice: 79800, regime: 'EXPANSION', leadSignal: 'Thanh khoản M2 toàn cầu mở rộng; lực hấp thụ áp đảo' },
  { date: '2024-12', m2TrillionsUSD: 106.8, m2YoYGrowth: 4.5, btcPrice: 87400, regime: 'EXPANSION', leadSignal: 'Các ngân hàng trung ương nới lỏng; dòng vốn tổ chức gia tốc' },
  { date: '2025-03', m2TrillionsUSD: 107.9, m2YoYGrowth: 4.0, btcPrice: 84400, regime: 'EXPANSION', leadSignal: 'M2 mở rộng ổn định, thanh khoản duy trì nền giá cao' },
  { date: '2025-07', m2TrillionsUSD: 109.5, m2YoYGrowth: 4.4, btcPrice: 117800, regime: 'EXPANSION', leadSignal: 'Dòng vốn tổ chức mở rộng, Bitcoin vượt qua các ngưỡng kháng cự' },
  { date: '2025-10', m2TrillionsUSD: 110.2, m2YoYGrowth: 3.8, btcPrice: 121600, regime: 'EXPANSION', leadSignal: 'Thanh khoản M2 lập đỉnh chu kỳ mới; bắt đầu xuất hiện áp lực chốt lời lớn' },
  { date: '2026-02', m2TrillionsUSD: 109.4, m2YoYGrowth: 1.4, btcPrice: 68800, regime: 'NEUTRAL', leadSignal: 'Tăng trưởng M2 chững lại, thị trường hạ nhiệt và tái tích lũy' },
  { date: '2026-06', m2TrillionsUSD: 108.9, m2YoYGrowth: -0.5, btcPrice: 64200, regime: 'CONTRACTION', leadSignal: 'Áp lực DXY và lợi suất trái phiếu thực thử thách vùng đệm 200W' },
  { date: '2026-11', m2TrillionsUSD: 108.6, m2YoYGrowth: 1.2, btcPrice: 75900, regime: 'NEUTRAL', leadSignal: 'M2 toàn cầu tạo nền phục hồi; thanh khoản bị kiềm tỏa bởi DXY > 104' },
];

export const CURRENT_GLOBAL_M2_STATS = {
  totalM2Trillions: 108.6,
  yoyGrowthPct: 1.2,
  regime: 'NEUTRAL' as const,
  leadLagCorrelation: 0.82, // Empirical correlation with 60-90 day forward BTC performance
  historicalLeadDays: 75,   // M2 leads BTC cycle by ~60-90 days with macro constraints
  macroConstraints: {
    dxyIndex: 104.2,        // US Dollar Index
    us10yRealYield: 1.85,   // US 10-Year Real Yield
    correlationNote: 'Tương quan 0.82 trong lịch sử nhưng hiện bị kiềm tỏa bởi DXY > 104 và lợi suất thực 1.85%; M2 tăng trưởng chậm +1.2% YoY (vùng tái tích lũy thận trọng).'
  },
  centralBankBreakdown: [
    { bank: 'PBoC (Trung Quốc)', m2EqUSDTrillions: 44.2, status: 'Nới lỏng tiền tệ mạnh mẽ', trend: 'UP' },
    { bank: 'US Fed (Mỹ)', m2EqUSDTrillions: 21.5, status: 'Chu kỳ hạ lãi suất điều hành', trend: 'UP' },
    { bank: 'ECB (Châu Âu)', m2EqUSDTrillions: 16.4, status: 'Cắt giảm lãi suất liên tiếp', trend: 'UP' },
    { bank: 'BoJ (Nhật Bản)', m2EqUSDTrillions: 10.6, status: 'Thắt chặt thận trọng', trend: 'STABLE' },
    { bank: 'Các NHTW khác', m2EqUSDTrillions: 15.9, status: 'Đồng pha nới lỏng toàn cầu', trend: 'UP' },
  ]
};

// ----------------------------------------------------------------------------
// 2. US SPOT BITCOIN ETF INSTITUTIONAL DASHBOARD
// Benchmarked against Farside Investors & Arkham Intelligence On-Chain ETF Reserves
// ----------------------------------------------------------------------------
export const US_SPOT_BITCOIN_ETFS: SpotEtfFundDetail[] = [
  {
    ticker: 'IBIT',
    name: 'iShares Bitcoin Trust',
    issuer: 'BlackRock',
    btcHoldings: 920770,
    aumMillionsUSD: 69880,
    flow24hMillionsUSD: 112.5,
    flow7dMillionsUSD: 1245.8,
    expenseRatio: 0.25,
    custodian: 'Coinbase Prime',
    sharePct: 61.8,
  },
  {
    ticker: 'FBTC',
    name: 'Fidelity Wise Origin Bitcoin Fund',
    issuer: 'Fidelity',
    btcHoldings: 198640,
    aumMillionsUSD: 15080,
    flow24hMillionsUSD: 35.2,
    flow7dMillionsUSD: 410.5,
    expenseRatio: 0.25,
    custodian: 'Fidelity Digital Assets',
    sharePct: 13.3,
  },
  {
    ticker: 'GBTC',
    name: 'Grayscale Bitcoin Trust',
    issuer: 'Grayscale',
    btcHoldings: 192350,
    aumMillionsUSD: 14600,
    flow24hMillionsUSD: -72.4,
    flow7dMillionsUSD: -115.0,
    expenseRatio: 1.50,
    custodian: 'Coinbase Prime',
    sharePct: 12.9,
  },
  {
    ticker: 'ARKB',
    name: 'ARK 21Shares Bitcoin ETF',
    issuer: 'ARK Invest / 21Shares',
    btcHoldings: 52190,
    aumMillionsUSD: 3960,
    flow24hMillionsUSD: 5.1,
    flow7dMillionsUSD: 98.4,
    expenseRatio: 0.21,
    custodian: 'Coinbase Prime',
    sharePct: 3.5,
  },
  {
    ticker: 'BITB',
    name: 'Bitwise Bitcoin ETF',
    issuer: 'Bitwise',
    btcHoldings: 46820,
    aumMillionsUSD: 3550,
    flow24hMillionsUSD: 3.2,
    flow7dMillionsUSD: 105.2,
    expenseRatio: 0.20,
    custodian: 'Coinbase Prime',
    sharePct: 3.1,
  },
  {
    ticker: 'BTC',
    name: 'Grayscale Bitcoin Mini Trust',
    issuer: 'Grayscale',
    btcHoldings: 38400,
    aumMillionsUSD: 2915,
    flow24hMillionsUSD: 0.0,
    flow7dMillionsUSD: 72.3,
    expenseRatio: 0.15,
    custodian: 'Coinbase Prime',
    sharePct: 2.6,
  },
  {
    ticker: 'HODL',
    name: 'VanEck Bitcoin ETF',
    issuer: 'VanEck',
    btcHoldings: 13950,
    aumMillionsUSD: 1060,
    flow24hMillionsUSD: 0.8,
    flow7dMillionsUSD: 28.5,
    expenseRatio: 0.20,
    custodian: 'Gemini',
    sharePct: 0.9,
  },
  {
    ticker: 'BRRR',
    name: 'Valkyrie Bitcoin Fund',
    issuer: 'CoinShares / Valkyrie',
    btcHoldings: 9810,
    aumMillionsUSD: 745,
    flow24hMillionsUSD: 0.0,
    flow7dMillionsUSD: 14.2,
    expenseRatio: 0.25,
    custodian: 'Coinbase Prime',
    sharePct: 0.7,
  },
  {
    ticker: 'BTCO',
    name: 'Invesco Galaxy Bitcoin ETF',
    issuer: 'Invesco Galaxy',
    btcHoldings: 8750,
    aumMillionsUSD: 665,
    flow24hMillionsUSD: 0.0,
    flow7dMillionsUSD: 11.0,
    expenseRatio: 0.25,
    custodian: 'Coinbase Prime',
    sharePct: 0.6,
  },
  {
    ticker: 'EZBC',
    name: 'Franklin Bitcoin ETF',
    issuer: 'Franklin Templeton',
    btcHoldings: 6920,
    aumMillionsUSD: 525,
    flow24hMillionsUSD: 0.2,
    flow7dMillionsUSD: 8.5,
    expenseRatio: 0.19,
    custodian: 'Coinbase Prime',
    sharePct: 0.5,
  },
  {
    ticker: 'BTCW',
    name: 'WisdomTree Bitcoin Fund',
    issuer: 'WisdomTree',
    btcHoldings: 3240,
    aumMillionsUSD: 245,
    flow24hMillionsUSD: 0.0,
    flow7dMillionsUSD: 2.4,
    expenseRatio: 0.30,
    custodian: 'Coinbase Prime',
    sharePct: 0.2,
  },
];

// Recent 20 trading sessions net flow timeline (Farside Benchmark)
export const RECENT_ETF_DAILY_FLOWS: EtfDailyFlowPoint[] = [
  { date: 'T-19', netFlowMillionsUSD: 287.4, cumulativeMillionsUSD: 33410, btcAbsorbed: 3590, minerDailySupply: 450 },
  { date: 'T-18', netFlowMillionsUSD: 412.8, cumulativeMillionsUSD: 33822, btcAbsorbed: 5120, minerDailySupply: 450 },
  { date: 'T-17', netFlowMillionsUSD: 184.2, cumulativeMillionsUSD: 34006, btcAbsorbed: 2280, minerDailySupply: 450 },
  { date: 'T-16', netFlowMillionsUSD: -78.4, cumulativeMillionsUSD: 33928, btcAbsorbed: -980, minerDailySupply: 450 },
  { date: 'T-15', netFlowMillionsUSD: 310.5, cumulativeMillionsUSD: 34238, btcAbsorbed: 3880, minerDailySupply: 450 },
  { date: 'T-14', netFlowMillionsUSD: 520.1, cumulativeMillionsUSD: 34758, btcAbsorbed: 6420, minerDailySupply: 450 },
  { date: 'T-13', netFlowMillionsUSD: 622.8, cumulativeMillionsUSD: 35381, btcAbsorbed: 7550, minerDailySupply: 450 },
  { date: 'T-12', netFlowMillionsUSD: -124.6, cumulativeMillionsUSD: 35256, btcAbsorbed: -1510, minerDailySupply: 450 },
  { date: 'T-11', netFlowMillionsUSD: 245.9, cumulativeMillionsUSD: 35502, btcAbsorbed: 2950, minerDailySupply: 450 },
  { date: 'T-10', netFlowMillionsUSD: 489.2, cumulativeMillionsUSD: 35991, btcAbsorbed: 5890, minerDailySupply: 450 },
  { date: 'T-9',  netFlowMillionsUSD: 893.4, cumulativeMillionsUSD: 36884, btcAbsorbed: 10450, minerDailySupply: 450 },
  { date: 'T-8',  netFlowMillionsUSD: 512.6, cumulativeMillionsUSD: 37397, btcAbsorbed: 5980, minerDailySupply: 450 },
  { date: 'T-7',  netFlowMillionsUSD: -91.2, cumulativeMillionsUSD: 37306, btcAbsorbed: -1050, minerDailySupply: 450 },
  { date: 'T-6',  netFlowMillionsUSD: 320.1, cumulativeMillionsUSD: 37626, btcAbsorbed: 3680, minerDailySupply: 450 },
  { date: 'T-5',  netFlowMillionsUSD: 673.5, cumulativeMillionsUSD: 38299, btcAbsorbed: 7720, minerDailySupply: 450 },
  { date: 'T-4',  netFlowMillionsUSD: -188.4, cumulativeMillionsUSD: 38748, btcAbsorbed: -2480, minerDailySupply: 450 },
  { date: 'T-3',  netFlowMillionsUSD: -312.0, cumulativeMillionsUSD: 38436, btcAbsorbed: -4120, minerDailySupply: 450 },
  { date: 'T-2',  netFlowMillionsUSD: 145.2, cumulativeMillionsUSD: 38581, btcAbsorbed: 1910, minerDailySupply: 450 },
  { date: 'T-1',  netFlowMillionsUSD: -210.5, cumulativeMillionsUSD: 38370, btcAbsorbed: -2770, minerDailySupply: 450 },
  { date: 'Phiên gần nhất', netFlowMillionsUSD: 84.6, cumulativeMillionsUSD: 38455, btcAbsorbed: 1115, minerDailySupply: 450 },
];

export const ETF_AGGREGATE_SUMMARY = {
  totalBtcHeld: 1491840,     // Total BTC held across US Spot ETFs (~1.49M BTC; Newhedge records 1.69M BTC globally)
  pctOfCirculating: 7.53,    // ~7.53% of circulating BTC supply
  totalAumBillionsUSD: 113.2,// Real market value at ~$75.9k
  cumulativeInflowsBillionsUSD: 38.45,
  dayNetInflowMillionsUSD: 84.6, // Strictly equals sum of flow24hMillionsUSD across all funds
  dayBtcAbsorbed: 1115,
  dailyMinerIssuance: 450,
  absorptionMultiple: 2.48, // Absorbed 2.5x daily miner supply
  blackRockDominationPct: 61.8,
  benchmarkSource: 'Farside Investors / Newhedge / Arkham On-Chain'
};
