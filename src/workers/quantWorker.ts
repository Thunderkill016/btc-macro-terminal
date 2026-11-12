import {
  CandlestickData,
  DerivativesData,
  MacroData,
  BacktestParams,
} from '../types';
import {
  calculateOnChainMetrics,
  calculateTechnicalMetrics,
  computeConfluenceScore,
  computeProbabilisticForwardCone,
  computeSampleSkewAndKurtosis,
  computeCornishFisherQuantile,
  computeFirstPassageTouchProb7D,
  computeEWMAVolatility,
  computeSignalHistory30D,
} from '../lib/quantEngine';
import { computeCycleSeriesForCandles } from '../lib/cycleModelMath';
import { runBacktest } from '../lib/backtester';

export type QuantWorkerRequest =
  | {
      id: string;
      type: 'COMPUTE_CONFLUENCE_FULL';
      payload: {
        currentPrice: number;
        candles: CandlestickData[];
        derivatives: DerivativesData;
        macro: MacroData;
        realCyclePoints: any[];
        dcaBudget: number;
      };
    }
  | {
      id: string;
      type: 'COMPUTE_CORNISH_FISHER_CONES';
      payload: {
        currentPrice: number;
        powerLawFairValue: number;
        sigmaGKDaily: number;
        dvolIndex: number;
        floor200w: number;
        candles: CandlestickData[];
      };
    }
  | {
      id: string;
      type: 'COMPUTE_CYCLE_SERIES';
      payload: {
        candles: CandlestickData[];
      };
    }
  | {
      id: string;
      type: 'RUN_BACKTEST';
      payload: {
        params: BacktestParams;
      };
    };

export type QuantWorkerResponse = {
  id: string;
  type: QuantWorkerRequest['type'];
  success: boolean;
  result?: any;
  error?: string;
};

/**
 * Synchronous execution handler shared by both Web Worker thread and Node/Test fallback
 */
export function executeQuantWorkerTaskSync(req: QuantWorkerRequest): any {
  switch (req.type) {
    case 'COMPUTE_CONFLUENCE_FULL': {
      const { currentPrice, candles, derivatives, macro, realCyclePoints, dcaBudget } = req.payload;
      const onChain = calculateOnChainMetrics(currentPrice);
      const technical = calculateTechnicalMetrics(candles, currentPrice);
      const weeklyBaseUsd = (dcaBudget * 0.70) / 4.33;
      const confluence = computeConfluenceScore(
        onChain,
        macro,
        technical,
        derivatives,
        [],
        0,
        0,
        candles,
        realCyclePoints,
        weeklyBaseUsd
      );
      return { onChain, technical, confluence };
    }
    case 'COMPUTE_CORNISH_FISHER_CONES': {
      const { currentPrice, powerLawFairValue, sigmaGKDaily, dvolIndex, floor200w, candles } =
        req.payload;
      const moments = computeSampleSkewAndKurtosis(candles, 365);
      const ewmaVol = computeEWMAVolatility(candles, 0.94);
      const sigmaEffectiveDaily = Number((0.60 * ewmaVol.dailyVol + 0.40 * sigmaGKDaily).toFixed(4));
      const zCF15 = computeCornishFisherQuantile(-1.0364, moments.skewnessClamped, moments.excessKurtosisClamped);
      const zCF50 = computeCornishFisherQuantile(0, moments.skewnessClamped, moments.excessKurtosisClamped);
      const zCF85 = computeCornishFisherQuantile(1.0364, moments.skewnessClamped, moments.excessKurtosisClamped);
      const cone = computeProbabilisticForwardCone(
        currentPrice,
        powerLawFairValue,
        sigmaGKDaily,
        dvolIndex,
        floor200w,
        candles
      );
      const touch1 = computeFirstPassageTouchProb7D(
        currentPrice,
        Math.round(currentPrice * 0.976),
        sigmaEffectiveDaily,
        0.0,
        0.0
      );
      const signalHistory = computeSignalHistory30D(candles, 71.4, 1.38, currentPrice);
      return {
        cone,
        moments,
        ewmaVol,
        sigmaEffectiveDaily,
        zCF15,
        zCF50,
        zCF85,
        touch1,
        signalHistory,
      };
    }
    case 'COMPUTE_CYCLE_SERIES': {
      return computeCycleSeriesForCandles(req.payload.candles);
    }
    case 'RUN_BACKTEST': {
      return runBacktest(req.payload.params);
    }
    default:
      throw new Error('Unknown QuantWorkerRequest type');
  }
}

// Register Web Worker message listener when running inside a Worker context
if (typeof self !== 'undefined' && typeof (self as any).postMessage === 'function' && typeof window === 'undefined') {
  self.onmessage = (event: MessageEvent<QuantWorkerRequest>) => {
    const req = event.data;
    if (!req || !req.id || !req.type) return;
    try {
      const result = executeQuantWorkerTaskSync(req);
      const response: QuantWorkerResponse = {
        id: req.id,
        type: req.type,
        success: true,
        result,
      };
      (self as any).postMessage(response);
    } catch (err: any) {
      const response: QuantWorkerResponse = {
        id: req.id,
        type: req.type,
        success: false,
        error: err?.message || 'Worker calculation failed',
      };
      (self as any).postMessage(response);
    }
  };
}
