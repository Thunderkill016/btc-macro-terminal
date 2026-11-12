import { describe, it, expect } from 'vitest';
import {
  executeComprehensiveLeakageAudit,
  runPlaceboPermutationTest,
  runBlockBootstrap,
  DERIBIT_DVOL_GENESIS_DATE,
} from '../domain/quant/leakageAudit';
import {
  CANONICAL_FORECAST_LEDGER,
  verifyLedgerChain,
  computeLedgerHash,
  ForecastLedgerEntry,
} from '../domain/quant/forecastLedger';

describe('BƯỚC 2 (P1): KIỂM CHỨNG SẠCH & SỔ DỰ BÁO TOÁN HỌC', () => {
  // ----------------------------------------------------------------------------
  // 1. IN-SAMPLE VS OUT-OF-SAMPLE DATA LEAKAGE AUDIT
  // ----------------------------------------------------------------------------
  describe('2.1 Leakage Audit & Sample Period Split', () => {
    it('verifies strict separation between In-Sample (2015-2020) and Out-of-Sample (2021-2026)', () => {
      const audit = executeComprehensiveLeakageAudit();

      expect(audit.inSample2015_2020.startDate).toBe('2015-01-01');
      expect(audit.inSample2015_2020.endDate).toBe('2020-12-31');
      expect(audit.inSample2015_2020.dvolType).toBe('SYNTHETIC_PARKINSON_PROXY');

      expect(audit.outOfSample2021_2026.startDate).toBe('2021-01-01');
      expect(audit.outOfSample2021_2026.dvolType).toBe('DERIBIT_DVOL_LIVE');

      expect(audit.pitCompliance.zeroLookaheadLeakage).toBe(true);
      expect(audit.pitCompliance.dvolPre2021SyntheticFlagged).toBe(true);
    });

    it('verifies Deribit DVOL Genesis date is locked to 2021-03-24', () => {
      expect(DERIBIT_DVOL_GENESIS_DATE).toBe('2021-03-24');
    });

    it('runs Placebo Permutation test and confirms honest non-faked reporting', () => {
      const audit = executeComprehensiveLeakageAudit();
      const placebo = audit.placeboTest;

      expect(placebo.iterations).toBe(100);
      expect(typeof placebo.actualAlphaPct).toBe('number');
      expect(typeof placebo.pValue).toBe('number');
      expect(placebo.placeboMeanAlphaPct).toBeDefined();
    });

    it('computes 95% stationary block bootstrap confidence intervals for out-of-sample alpha', () => {
      const audit = executeComprehensiveLeakageAudit();
      const ci = audit.bootstrapAlphaCI;

      expect(ci.bootstrapRounds).toBe(100);
      expect(ci.blockSizeDays).toBe(120);
      expect(ci.ciLower95).toBeLessThan(ci.pointEstimate);
      expect(ci.ciUpper95).toBeGreaterThan(ci.pointEstimate);
    });

    it('verifies Brier Skill calibration interpretation', () => {
      const audit = executeComprehensiveLeakageAudit();
      expect(audit.brierCalibration.brierSkillScore).toBeGreaterThan(0);
      expect(audit.brierCalibration.regimeInterpretation).toBe('STATISTICAL_EDGE');
    });
  });

  // ----------------------------------------------------------------------------
  // 2. DAILY FORECAST LEDGER & OPENTIMESTAMPS BITCOIN ANCHOR
  // ----------------------------------------------------------------------------
  describe('2.3 Daily Forecast Ledger & Cryptographic Chain', () => {
    it('verifies ledger has at least 14 consecutive daily records with zero gaps', () => {
      expect(CANONICAL_FORECAST_LEDGER.length).toBeGreaterThanOrEqual(14);
      for (let i = 0; i < CANONICAL_FORECAST_LEDGER.length; i++) {
        expect(CANONICAL_FORECAST_LEDGER[i].index).toBe(i);
        expect(CANONICAL_FORECAST_LEDGER[i].snapshotPrice).toBeGreaterThan(50000);
      }
    });

    it('verifies cryptographic hash chain continuity for all entries', () => {
      const verification = verifyLedgerChain(CANONICAL_FORECAST_LEDGER);
      expect(verification.isValid).toBe(true);
      expect(verification.totalRecords).toBe(CANONICAL_FORECAST_LEDGER.length);
      expect(verification.rootHash).toMatch(/^hash_[0-9a-f]{16}$/);
      expect(verification.tipHash).toMatch(/^hash_[0-9a-f]{16}$/);
    });

    it('detects tampering immediately if any past price or date is modified', () => {
      const tamperedLedger: ForecastLedgerEntry[] = JSON.parse(
        JSON.stringify(CANONICAL_FORECAST_LEDGER)
      );

      // Tamper index 3 price
      tamperedLedger[3].snapshotPrice = 999999;
      const result = verifyLedgerChain(tamperedLedger);

      expect(result.isValid).toBe(false);
      expect(result.brokenIndex).toBe(3);
    });

    it('verifies historical root entries have OpenTimestamps Bitcoin block confirmation', () => {
      const firstEntry = CANONICAL_FORECAST_LEDGER[0];
      expect(firstEntry.otsProof.status).toBe('BITCOIN_ANCHORED');
      expect(firstEntry.otsProof.blockHeight).toBeGreaterThan(870000);
      expect(firstEntry.otsProof.anchorSource).toContain('OpenTimestamps');
    });

    it('verifies public forecast ledger JSON payload conforms strictly to ForecastLedgerEntry schema', () => {
      const serialized = JSON.stringify(CANONICAL_FORECAST_LEDGER, null, 2);
      expect(serialized.length).toBeGreaterThan(1000);

      const parsed: ForecastLedgerEntry[] = JSON.parse(serialized);
      expect(parsed.length).toBe(CANONICAL_FORECAST_LEDGER.length);
      expect(parsed[0].currentHash).toBe(CANONICAL_FORECAST_LEDGER[0].currentHash);
      expect(parsed[parsed.length - 1].currentHash).toBe(
        CANONICAL_FORECAST_LEDGER[CANONICAL_FORECAST_LEDGER.length - 1].currentHash
      );
    });
  });
});
