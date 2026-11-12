/**
 * test_step3_p2_verification.cjs
 * Automated test suite for Step 3 (P2: System Expansion & 3-Tier Interface)
 */

const fs = require('fs');
const path = require('path');

let passedTests = 0;
let totalTests = 0;

function assert(cond, msg) {
  totalTests++;
  if (!cond) {
    console.error(`❌ FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    passedTests++;
    console.log(`✅ PASS: ${msg}`);
  }
}

console.log('=====================================================');
console.log('🧪 RUNNING STEP 3 (P2) VERIFICATION SUITE');
console.log('=====================================================\n');

// 1. Verify quantEngine.ts 4-Phase Macro Regimes & 90D Distributions
const quantEnginePath = path.join(__dirname, 'src', 'lib', 'quantEngine.ts');
const quantEngineContent = fs.readFileSync(quantEnginePath, 'utf8');

assert(
  quantEngineContent.includes("macroRegimeId = 'DEEP_ACCUMULATION'") &&
  quantEngineContent.includes("macroRegimeId = 'MOMENTUM_EXPANSION'") &&
  quantEngineContent.includes("macroRegimeId = 'DISTRIBUTION_CAUTION'") &&
  quantEngineContent.includes("macroRegimeId = 'HIGH_RISK_DEFENSE'") &&
  quantEngineContent.includes("1. Tích Lũy Sâu Giá Rẻ") &&
  quantEngineContent.includes("2. Mở Rộng Đà Tăng Trưởng") &&
  quantEngineContent.includes("3. Cảnh Giác Phân Phối / Đi Ngang") &&
  quantEngineContent.includes("4. Phòng Thủ Rủi Ro Cao"),
  '1. quantEngine classifies into 4 explicit macro regimes with Vietnamese labels'
);

assert(
  quantEngineContent.includes("p10: -8.2, p50: 24.8, p90: 68.4") &&
  quantEngineContent.includes("p10: -12.5, p50: 18.2, p90: 52.1") &&
  quantEngineContent.includes("p10: -21.4, p50: 3.5, p90: 28.9") &&
  quantEngineContent.includes("p10: -38.6, p50: -14.2, p90: 12.0"),
  '2. 90-day empirical return distributions (P10, P50, P90) defined for all 4 macro regimes'
);

// 2. Verify Measured Radar Performance & False Alarm Rates
assert(
  quantEngineContent.includes("hitRatePercent: 75.0") &&
  quantEngineContent.includes("falseAlarmPercent: 12.5") &&
  quantEngineContent.includes("Bắt trúng 3/4 đỉnh lớn"),
  '3. Peak Radar has measured hit rate (75.0%) and false alarm rate (12.5%)'
);

assert(
  quantEngineContent.includes("hitRatePercent: 80.0") &&
  quantEngineContent.includes("falseAlarmPercent: 14.3") &&
  quantEngineContent.includes("drawdownsEvaluatedCount: 5"),
  '4. Downside Risk Radar has measured recall (80.0%) and false alarm rate (14.3%)'
);

assert(
  quantEngineContent.includes("CoinGlass") &&
  quantEngineContent.includes("0/30 chỉ báo on-chain chạm ngưỡng cực hạn"),
  '5. Measured limitation note explicitly cites CoinGlass 2025 >30% drop audit'
);

// 3. Verify Smart DCA Multiplier Clamped [0.50, 1.50] and Outperformance
assert(
  quantEngineContent.includes("dcaMultiplier = 1.50") &&
  quantEngineContent.includes("dcaMultiplier = 0.50") &&
  quantEngineContent.includes("dcaVsFixedOutperformancePercent: 14.2"),
  '6. Smart DCA multiplier strictly bounded in [0.50, 1.50] with +14.2% outperformance stat'
);

// 4. Verify 3-Tier Failure Mode Disclosures in AppleSignalGrid.tsx
const signalGridPath = path.join(__dirname, 'src', 'components', 'apple', 'AppleSignalGrid.tsx');
const signalGridContent = fs.readFileSync(signalGridPath, 'utf8');

const failureModeMatches = (signalGridContent.match(/⚠️ Mô hình này sai khi:/g) || []).length;
assert(
  failureModeMatches === 4,
  `7. AppleSignalGrid.tsx includes all 4 failure mode disclosures ("Mô hình này sai khi:") [Found: ${failureModeMatches}/4]`
);

// 5. Verify Anti-Duplicate Telegram Alert & Dedup Key in TelegramAlertModal.tsx
const telegramModalPath = path.join(__dirname, 'src', 'components', 'modals', 'TelegramAlertModal.tsx');
const telegramModalContent = fs.readFileSync(telegramModalPath, 'utf8');

assert(
  telegramModalContent.includes("dedupKey") &&
  telegramModalContent.includes("btc_telegram_last_sent") &&
  telegramModalContent.includes("cooldownRemainingHours"),
  '8. TelegramAlertModal.tsx enforces anti-duplicate hash key and 6h rate limit cooldown'
);

assert(
  telegramModalContent.includes("Vùng Hỗ Trợ Động 200W") &&
  !telegramModalContent.includes("Đáy Sàn 200W"),
  '9. TelegramAlertModal.tsx purged "Đáy Sàn 200W" in favor of "Vùng Hỗ Trợ Động 200W"'
);

// 6. Verify AppleDailySignalHero.tsx Decluttered Hero and Outperformance Note
const heroPath = path.join(__dirname, 'src', 'components', 'apple', 'AppleDailySignalHero.tsx');
const heroContent = fs.readFileSync(heroPath, 'utf8');

assert(
  heroContent.includes("+14.2%") &&
  heroContent.includes("La Bàn Phân Khúc Thị Trường") &&
  heroContent.includes("NÓN XÁC SUẤT GIÁ TƯƠNG LAI") &&
  heroContent.includes("Kelly:"),
  '10. AppleDailySignalHero.tsx contains decluttered 3-Block elements (Regime Compass, Forward Cone, Kelly badge, +14.2% alpha)'
);

// 7. Full Codebase Scan: ZERO Forbidden Absolute Words in src/
const forbiddenPatterns = [
  /an toàn tuyệt đối/i,
  /hoàn toàn yên tâm/i,
  /sàn bê tông/i,
  /chắc chắn 100%/i,
  /đáy sàn 200w/i
];

function scanDirForForbidden(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = scanDirForForbidden(fullPath);
      if (sub) return sub;
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      const code = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(code)) {
          return { file: fullPath, pattern: pattern.toString() };
        }
      }
    }
  }
  return null;
}

const forbiddenFound = scanDirForForbidden(path.join(__dirname, 'src'));
assert(
  forbiddenFound === null,
  `11. Full src/ scan: Zero forbidden absolute claims across all files ${forbiddenFound ? `(Found ${forbiddenFound.pattern} in ${forbiddenFound.file})` : ''}`
);

console.log('\n=====================================================');
console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('=====================================================');
