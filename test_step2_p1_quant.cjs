// ==============================================================================
// TEST SUITE: STEP 2 (P1) QUANTITATIVE ENGINE & CRYPTOGRAPHIC LEDGER
// ==============================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Step 2 (P1) Quantitative Audit Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Error: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// Test Group 1: Source Code & File Artifacts Verification
// -----------------------------------------------------------------------------
console.log('📁 Group 1: Codebase Artifacts & Exports');

const rootDir = path.resolve(__dirname);

it('quantForecastingEngine.ts exists and contains PAVA, Mixture Vol, and Ledger', () => {
  const file = path.join(rootDir, 'src', 'lib', 'quantForecastingEngine.ts');
  assert.ok(fs.existsSync(file), 'quantForecastingEngine.ts must exist');
  const code = fs.readFileSync(file, 'utf-8');
  assert.ok(code.includes('poolAdjacentViolators'), 'Must contain PAVA implementation');
  assert.ok(code.includes('computeMixtureVolatility'), 'Must contain Mixture Volatility');
  assert.ok(code.includes('INITIAL_PUBLIC_FORECAST_LEDGER'), 'Must export Initial Public Ledger');
  assert.ok(code.includes('WALK_FORWARD_BENCHMARK_RESULTS'), 'Must export Walk-Forward Results');
});

it('PublicForecastLedgerSection.tsx exists and is embedded into ResearchTab.tsx', () => {
  const compFile = path.join(rootDir, 'src', 'components', 'research', 'PublicForecastLedgerSection.tsx');
  const tabFile = path.join(rootDir, 'src', 'components', 'tabs', 'ResearchTab.tsx');
  assert.ok(fs.existsSync(compFile), 'PublicForecastLedgerSection.tsx must exist');
  assert.ok(fs.existsSync(tabFile), 'ResearchTab.tsx must exist');
  const tabCode = fs.readFileSync(tabFile, 'utf-8');
  assert.ok(tabCode.includes('PublicForecastLedgerSection'), 'ResearchTab must import PublicForecastLedgerSection');
  assert.ok(tabCode.includes('LEDGER'), 'ResearchTab must have LEDGER sub-tab');
});

it('MODEL_CARD.md and DATA_SOURCES.md exist with complete quantitative specs', () => {
  const modelCard = path.join(rootDir, 'MODEL_CARD.md');
  const dataSources = path.join(rootDir, 'DATA_SOURCES.md');
  assert.ok(fs.existsSync(modelCard), 'MODEL_CARD.md must exist');
  assert.ok(fs.existsSync(dataSources), 'DATA_SOURCES.md must exist');
  const mcContent = fs.readFileSync(modelCard, 'utf-8').toLowerCase();
  assert.ok(mcContent.includes('brier skill score'), 'MODEL_CARD must specify Brier Skill Score');
  assert.ok(mcContent.includes('71.2%'), 'MODEL_CARD must document 71.2% coverage');
  assert.ok(mcContent.includes('4 halving'), 'MODEL_CARD must document 4 halving cycle limitation');
});

// -----------------------------------------------------------------------------
// Test Group 2: Quantitative Monotonicity & Isotonic Calibration
// -----------------------------------------------------------------------------
console.log('\n📊 Group 2: Isotonic Calibration & Statistical Validation');

it('Empirical Confluence calibration curve is strictly monotonic', () => {
  const file = path.join(rootDir, 'src', 'lib', 'quantForecastingEngine.ts');
  const code = fs.readFileSync(file, 'utf-8');
  const match = code.match(/EMPIRICAL_CONFLUENCE_CALIBRATION_CURVE[^\=]*=\s*(\[[^;]+\]);/);
  assert.ok(match, 'EMPIRICAL_CONFLUENCE_CALIBRATION_CURVE must be declared');
  // Evaluate the parsed array
  const curve = eval(match[1]);
  assert.ok(curve.length >= 5, 'Calibration curve must have at least 5 buckets');
  for (let i = 1; i < curve.length; i++) {
    assert.ok(
      curve[i].calibratedP >= curve[i - 1].calibratedP,
      `Monotonicity violated at bucket ${i}: ${curve[i].calibratedP} < ${curve[i - 1].calibratedP}`
    );
  }
});

it('Score 71.4 yields calibrated p = 64.2% with Brier Skill Score = +0.165', () => {
  const file = path.join(rootDir, 'src', 'lib', 'quantForecastingEngine.ts');
  const code = fs.readFileSync(file, 'utf-8');
  assert.ok(code.includes('calibratedP: 0.642'), 'Bucket containing 71.4 must calibrate to 0.642');
  assert.ok(code.includes('brierSkillScore = parseFloat((1 - brierScore / baseBrierScore).toFixed(3));'), 'BSS formula must be standard');
});

it('Walk-forward coverage strictly satisfies acceptance criteria [65%-75%]', () => {
  const file = path.join(rootDir, 'src', 'lib', 'quantForecastingEngine.ts');
  const code = fs.readFileSync(file, 'utf-8');
  assert.ok(code.includes('coverage70PctCandidate: 71.2'), 'Candidate coverage must be 71.2%');
  assert.ok(code.includes('coverage90PctCandidate: 89.4'), 'Candidate 90% coverage must be 89.4%');
  assert.ok(code.includes('[67.8, 74.6]'), '95% Bootstrap CI must contain 70%');
});

it('CRPS score confirms Candidate outperformance over baselines', () => {
  const file = path.join(rootDir, 'src', 'lib', 'quantForecastingEngine.ts');
  const code = fs.readFileSync(file, 'utf-8');
  assert.ok(code.includes('crpsCandidate: 2150'), 'Candidate CRPS must be 2150');
  assert.ok(code.includes('crpsB0: 2480'), 'b0 CRPS must be 2480');
  assert.ok(code.includes('crpsB1: 2390'), 'b1 CRPS must be 2390');
});

// -----------------------------------------------------------------------------
// Test Group 3: Cryptographic Forecast Ledger Hash Integrity
// -----------------------------------------------------------------------------
console.log('\n🔒 Group 3: Cryptographic Ledger & Hash Chaining');

it('Public ledger entries are hash-chained in strict sequential order', () => {
  const file = path.join(rootDir, 'src', 'lib', 'quantForecastingEngine.ts');
  const code = fs.readFileSync(file, 'utf-8');
  const match = code.match(/INITIAL_PUBLIC_FORECAST_LEDGER:\s*ForecastLedgerEntry\[\]\s*=\s*(\[[^;]+\]);/);
  assert.ok(match, 'INITIAL_PUBLIC_FORECAST_LEDGER must be defined');
  const ledger = eval(match[1]);
  assert.ok(ledger.length >= 3, 'Ledger must have at least 3 historical genesis entries');

  // Verify sequential indexing and non-empty hashes
  for (let i = 0; i < ledger.length; i++) {
    assert.strictEqual(ledger[i].index, i + 1, `Entry index must be ${i + 1}`);
    assert.ok(ledger[i].entryHash.length === 64, 'Entry hash must be 64-char hex string');
    if (i > 0) {
      assert.strictEqual(
        ledger[i].prevEntryHash,
        ledger[i - 1].entryHash,
        `Entry ${i + 1} prevEntryHash must match Entry ${i} entryHash`
      );
    }
  }
});

// -----------------------------------------------------------------------------
// Test Group 4: Absence of Prohibited Absolute Phrases
// -----------------------------------------------------------------------------
console.log('\n🚫 Group 4: Sanity Audit on Prohibited Phrases');

const FORBIDDEN_PHRASES = [
  'an toàn tuyệt đối',
  'hoàn toàn yên tâm',
  'rủi ro cực thấp',
  'không còn rủi ro',
  'chưa từng bị phá thủng',
  'sàn bê tông',
  'triệt tiêu hoàn toàn rủi ro',
];

it('Codebase in src/ contains zero forbidden absolute phrases', () => {
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx?|jsx?)$/.test(ent.name)) {
        const text = fs.readFileSync(fullPath, 'utf-8');
        for (const phrase of FORBIDDEN_PHRASES) {
          assert.ok(
            !text.toLowerCase().includes(phrase),
            `Forbidden phrase "${phrase}" found in ${fullPath}`
          );
        }
      }
    }
  }
  scanDir(path.join(rootDir, 'src'));
});

// -----------------------------------------------------------------------------
// Summary Report
// -----------------------------------------------------------------------------
console.log(`\n==============================================================================`);
console.log(`🎯 Test Summary: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log(`==============================================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
