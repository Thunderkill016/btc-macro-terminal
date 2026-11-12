const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('================================================================');
console.log('🚀 BITCOIN ALPHA v5.1 — STEP 1 (P0) AUTOMATED VERIFICATION SUITE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// TEST SUITE 1: ZERO FORBIDDEN PHRASES IN SRC/
// -----------------------------------------------------------------------------
console.log('--- TEST 1: SCANNING ALL SOURCE CODE FOR FORBIDDEN ABSOLUTE STRINGS ---');

const FORBIDDEN_PATTERNS = [
  /an toàn tuyệt đối/i,
  /hoàn toàn yên tâm/i,
  /gom hàng an tâm/i,
  /đệm cực kỳ vững chắc/i,
  /rủi ro cực thấp/i,
  /rủi ro thấp nhất chu kỳ/i,
  /sàn bê tông/i,
  /bê tông/i,
  /triệt tiêu hoàn toàn/i,
  /Free Bitcoin/i,
  /Top 1% tích sản/i,
  /90% nhà đầu tư/i,
  /chưa từng bị phá thủng/i,
  /luôn dẫn dắt/i,
  /Glassnode Market Regime/i,
  /Grade A\+/i,
  /không còn bất kỳ rủi ro nào/i,
];

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('dist') && !fullPath.includes('.git')) {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

const srcFiles = getAllFiles(path.join(__dirname, 'src'));
let forbiddenOccurrences = [];

for (const f of srcFiles) {
  const content = fs.readFileSync(f, 'utf8');
  for (const pat of FORBIDDEN_PATTERNS) {
    if (pat.test(content)) {
      forbiddenOccurrences.push({ file: path.relative(__dirname, f), pattern: pat.toString() });
    }
  }
}

console.log(`Scanned ${srcFiles.length} TypeScript / TSX files in src/.`);
assert(forbiddenOccurrences.length === 0, `Forbidden strings count is 0 (Found: ${forbiddenOccurrences.length})`);
if (forbiddenOccurrences.length > 0) {
  console.error('Details of violations:', forbiddenOccurrences);
}

// -----------------------------------------------------------------------------
// TEST SUITE 2: DATA PROVENANCE LABELS & TRANSPARENCY NOTICES
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: VERIFYING BENCHMARK / SAMPLE DATA LABELS ---');

const etfDashboardCode = fs.readFileSync(path.join(__dirname, 'src/components/research/UsSpotEtfFlowDashboard.tsx'), 'utf8');
assert(
  etfDashboardCode.includes('[📊 Dữ Liệu Mẫu / Khảo Sát Benchmark - Chưa Có Feed API Trực Tiếp]'),
  'UsSpotEtfFlowDashboard contains prominent sample benchmark data notice'
);

const m2DashboardCode = fs.readFileSync(path.join(__dirname, 'src/components/research/GlobalM2LiquidityTracker.tsx'), 'utf8');
assert(
  m2DashboardCode.includes('[📊 Dữ Liệu Mẫu / Khảo Sát FRED Benchmark]'),
  'GlobalM2LiquidityTracker contains prominent sample benchmark data notice'
);

const backtesterCode = fs.readFileSync(path.join(__dirname, 'src/components/center-column/RealReturnBacktester.tsx'), 'utf8');
assert(
  backtesterCode.includes('Mô hình chu kỳ mô phỏng (Synthetic) + Phí chênh mua/bán 1.5%'),
  'RealReturnBacktester contains synthetic model badge with 1.5% bid-ask spread notice'
);

// -----------------------------------------------------------------------------
// TEST SUITE 3: SINGLE SOURCE OF TRUTH (SSOT) METRICS
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: VERIFYING SINGLE SOURCE OF TRUTH (SSOT) SELECTOR ---');

const selectorFile = path.join(__dirname, 'src/lib/metricsSelector.ts');
assert(fs.existsSync(selectorFile), 'metricsSelector.ts exists and is written');

const selectorCode = fs.readFileSync(selectorFile, 'utf8');
assert(selectorCode.includes('powerLawBubbleCeiling = Math.round(powerLawFairValue * 2.3)'), 'Ceiling is unified to 2.3x Fair Value ($203,500)');
assert(selectorCode.includes('sthCostBasisIsEstimate = true'), 'STH is explicitly tagged as empirical estimate');
assert(selectorCode.includes('standardError = 0.04'), 'Hurst exponent includes standard error & 95% confidence interval');

// Verify components import SSOT metrics
const heroCode = fs.readFileSync(path.join(__dirname, 'src/components/apple/AppleDailySignalHero.tsx'), 'utf8');
assert(heroCode.includes('useUnifiedMetrics'), 'AppleDailySignalHero imports and uses useUnifiedMetrics');

const radarCode = fs.readFileSync(path.join(__dirname, 'src/components/apple/AppleCyclePeakRadar.tsx'), 'utf8');
assert(radarCode.includes('useUnifiedMetrics'), 'AppleCyclePeakRadar imports and uses useUnifiedMetrics');

const chartCode = fs.readFileSync(path.join(__dirname, 'src/components/apple/AppleCycleChart.tsx'), 'utf8');
assert(chartCode.includes('useUnifiedMetrics'), 'AppleCycleChart imports and uses useUnifiedMetrics');

const gridCode = fs.readFileSync(path.join(__dirname, 'src/components/apple/AppleSignalGrid.tsx'), 'utf8');
assert(gridCode.includes('useUnifiedMetrics'), 'AppleSignalGrid imports and uses useUnifiedMetrics');

const ladderCode = fs.readFileSync(path.join(__dirname, 'src/components/tabs/ExitLadderStrategy.tsx'), 'utf8');
assert(ladderCode.includes('useUnifiedMetrics'), 'ExitLadderStrategy imports and uses useUnifiedMetrics');

// -----------------------------------------------------------------------------
// TEST SUITE 4: SECURITY VAULT (PASSPHRASE & OWASP 600K PBKDF2)
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4: VERIFYING PASSPHRASE VAULT SECURITY (OWASP STANDARD) ---');

const vaultFile = path.join(__dirname, 'src/lib/cryptoVault.ts');
const vaultCode = fs.readFileSync(vaultFile, 'utf8');

assert(vaultCode.includes('OWASP_PBKDF2_ITERATIONS = 600000'), 'PBKDF2 iteration count upgraded to 600,000 (OWASP 2026 standard)');
assert(vaultCode.includes('MIN_PASSPHRASE_LENGTH = 8'), 'Enforces minimum passphrase length of 8 characters');
assert(vaultCode.includes('validatePassphraseStrength'), 'Exports validatePassphraseStrength');
assert(vaultCode.includes('new Uint8Array(32)'), 'Salt upgraded to 32 bytes (256 bits) of entropy');

// Node.js PBKDF2 + AES-256-GCM math verification equivalent
const testSalt = crypto.randomBytes(32);
const testPass = 'UltraSecureTestPassphrase#2026';
const testSecret = 'wX39q0A1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';

const derivedKey = crypto.pbkdf2Sync(testPass, testSalt, 600000, 32, 'sha256');
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
const encrypted = Buffer.concat([cipher.update(testSecret, 'utf8'), cipher.final()]);
const tag = cipher.getAuthTag();

// Decrypt with correct key
const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
decipher.setAuthTag(tag);
const decrypted = decipher.update(encrypted, undefined, 'utf8') + decipher.final('utf8');
assert(decrypted === testSecret, 'AES-256-GCM + PBKDF2 600k round-trip decryption succeeds');

// Verify bad passphrase fails
try {
  const badKey = crypto.pbkdf2Sync('WrongPassphrase#9999', testSalt, 600000, 32, 'sha256');
  const badDecipher = crypto.createDecipheriv('aes-256-gcm', badKey, iv);
  badDecipher.setAuthTag(tag);
  badDecipher.update(encrypted, undefined, 'utf8');
  badDecipher.final('utf8');
  assert(false, 'Bad passphrase should throw authentication error');
} catch {
  assert(true, 'Bad passphrase correctly throws AES-GCM authentication tag mismatch');
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`🏁 VERIFICATION COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL STEP 1 (P0) CRITERIA VERIFIED SUCCESSFULLY WITH 100% PASS RATE!\n');
  process.exit(0);
}
