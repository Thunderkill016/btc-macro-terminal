import { describe, it, expect, beforeEach } from 'vitest';
import { AlertEngine, MarketStateSnapshot } from '../infrastructure/alertEngine';

describe('3.1 Institutional Alert Engine & Deduplication Test Suite', () => {
  let engine: AlertEngine;

  const mockBaseState: MarketStateSnapshot = {
    timestampMs: 1794454800000,
    currentPrice: 74140,
    confluenceScore: 71,
    activePhase: 2,
    regime: 'ACCUMULATION_REGIME',
    mvrv: 1.37,
    mayerMultiple: 1.01,
    tier1Price: 71800,
    tier2Price: 70150,
    tier3Price: 68033,
    tier4Price: 53950,
    scoreDelta7D: 2.3,
  };

  beforeEach(() => {
    engine = new AlertEngine(24); // 24 hour cooldown
  });

  it('triggers alert on regime change between consecutive states', () => {
    const prevState: MarketStateSnapshot = {
      ...mockBaseState,
      regime: 'DEEP_VALUE',
    };

    const alerts = engine.evaluateState(mockBaseState, prevState);
    const regimeAlert = alerts.find((a) => a.type === 'REGIME_CHANGE');

    expect(regimeAlert).toBeDefined();
    expect(regimeAlert?.urgency).toBe('HIGH');
    expect(regimeAlert?.bodyVi).toContain('ACCUMULATION_REGIME');
  });

  it('triggers tier touch alert when price approaches within 0.75% of limit barrier', () => {
    const touchState: MarketStateSnapshot = {
      ...mockBaseState,
      currentPrice: 71850, // 0.07% away from Tier 1 ($71,800)
    };

    const alerts = engine.evaluateState(touchState, mockBaseState);
    const tierAlert = alerts.find((a) => a.type === 'TIER_TOUCH');

    expect(tierAlert).toBeDefined();
    expect(tierAlert?.titleVi).toContain('TẦNG 1');
  });

  it('triggers rapid confluence shift alert when score delta >= 5 points in 7D', () => {
    const rapidState: MarketStateSnapshot = {
      ...mockBaseState,
      scoreDelta7D: 6.5,
    };

    const alerts = engine.evaluateState(rapidState, mockBaseState);
    const deltaAlert = alerts.find((a) => a.type === 'RAPID_CONFLUENCE_DELTA');

    expect(deltaAlert).toBeDefined();
    expect(deltaAlert?.titleVi).toContain('+6.5 ĐIỂM');
  });

  it('strictly deduplicates repeated triggers within 24-hour cooldown window', () => {
    const touchState: MarketStateSnapshot = {
      ...mockBaseState,
      currentPrice: 71850,
    };

    // First trigger fires
    const firstAlerts = engine.evaluateState(touchState, mockBaseState);
    expect(firstAlerts.some((a) => a.type === 'TIER_TOUCH')).toBe(true);

    // Immediate second trigger 10 minutes later is suppressed by deduplication
    const tenMinsLater: MarketStateSnapshot = {
      ...touchState,
      timestampMs: touchState.timestampMs + 600000,
    };
    const secondAlerts = engine.evaluateState(tenMinsLater, touchState);
    expect(secondAlerts.some((a) => a.type === 'TIER_TOUCH')).toBe(false);

    // After 25 hours, the trigger can fire again
    const twentyFiveHoursLater: MarketStateSnapshot = {
      ...touchState,
      timestampMs: touchState.timestampMs + 25 * 3600 * 1000,
    };
    const thirdAlerts = engine.evaluateState(twentyFiveHoursLater, touchState);
    expect(thirdAlerts.some((a) => a.type === 'TIER_TOUCH')).toBe(true);
  });
});
