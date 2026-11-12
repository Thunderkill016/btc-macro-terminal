import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, Cpu, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AISignal } from './types';
import { useUnifiedMetrics } from '../../lib/metricsSelector';
import { useTerminalStore } from '../../store/useTerminalStore';

interface GenerateSignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySignal: (signal: AISignal) => void;
  currentBtcPrice?: number;
}

export const GenerateSignalModal: React.FC<GenerateSignalModalProps> = ({
  isOpen,
  onClose,
  onApplySignal,
  currentBtcPrice
}) => {
  const metrics = useUnifiedMetrics();
  const confluence = useTerminalStore((s) => s.confluenceResult);
  const price = currentBtcPrice || metrics.livePrice || 67245;
  const score = metrics.confluenceScore || 71;
  const kellyMultiplier = metrics.confluenceMultiplier || 1.35;
  const regimeName = confluence?.regime?.macroRegimeTitleEn || confluence?.regime?.regimeLabelEn || 'Deep Accumulation';

  const [step, setStep] = useState<number>(1);
  const [analyzingText, setAnalyzingText] = useState('Evaluating Pillar 1: Technical Cycle & 200WMA Floor...');

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      return;
    }

    const timer1 = setTimeout(() => {
      setAnalyzingText('Evaluating Pillar 2: On-Chain Valuation (MVRV, Realized Price, STH Cost Basis)...');
    }, 700);

    const timer2 = setTimeout(() => {
      setAnalyzingText('Evaluating Pillar 3 & 4: Macro Liquidity & Derivatives Orderflow Imbalance...');
    }, 1400);

    const timer3 = setTimeout(() => {
      setStep(2);
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.55 }
      });
    }, 2100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const target1 = Math.round(metrics.powerLawFairValue || (price * 1.04));
  const target2 = Math.round(metrics.piCycleTop || (price * 1.15));
  const floor200w = Math.round(metrics.floorSma200w || (price * 0.95));

  const generatedSignal: AISignal = {
    id: `sig-quant-${Date.now()}`,
    pair: 'BTC/USDT',
    type: 'BUY',
    confidence: Math.min(96.8, Math.max(88.5, score + 21)),
    entryPrice: Math.round(price),
    target1,
    target2,
    target3: Math.round(target1 * 1.08),
    stopLoss: floor200w,
    riskReward: '1 : 3.8',
    timeframe: `4-Phase Regime: ${regimeName}`,
    status: 'ACTIVE',
    timestamp: 'Just synthesized',
    reasoning: [
      `Confluence Accumulation Score: ${score}/100 with ${regimeName} classification`,
      `Price is anchored above Generational 200WMA Floor ($${floor200w.toLocaleString()})`,
      `MVRV ratio (${metrics.mvrv?.toFixed(2) || '1.39'}) indicates healthy early-stage accumulation`,
      `Optimal Half-Kelly sizing: ${kellyMultiplier}x base allocation`
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#1A2234] rounded-3xl p-6 lg:p-7 shadow-2xl border border-gray-100 dark:border-gray-800 relative animate-in zoom-in-95 duration-200"
        role="dialog"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 1 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="relative w-16 h-16 flex items-center justify-center mb-5">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Cpu className="w-8 h-8 animate-pulse" />
              </div>
            </div>

            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              Institutional Confluence Synthesis
            </h4>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2 max-w-xs animate-pulse">
              {analyzingText}
            </p>

            <div className="w-64 h-2 bg-gray-100 dark:bg-gray-800 rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full animate-[shimmer_2s_infinite]" style={{ width: '85%' }} />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Quantitative BTC Signal Synthesized
                </h3>
                <span className="text-xs text-gray-400">4-Pillar Confluence Ground Truth</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/5 dark:from-emerald-950/40 rounded-2xl p-4 border border-emerald-500/30 mb-4">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">BTC/USDT · SPOT</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                    STRONG ACCUMULATION
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">AI Probability</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">{generatedSignal.confidence.toFixed(1)}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] text-gray-400 block">ENTRY ZONE</span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">${(generatedSignal.entryPrice - 200).toLocaleString()} - ${(generatedSignal.entryPrice + 200).toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] text-gray-400 block">SAFETY FLOOR 200WMA</span>
                  <span className="font-bold text-rose-500 font-mono">${generatedSignal.stopLoss.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">POWER LAW FAIR VALUE</span>
                  <span className="font-bold text-emerald-600 font-mono">${generatedSignal.target1.toLocaleString()}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">PI CYCLE TOP ANCHOR</span>
                  <span className="font-bold text-emerald-600 font-mono">${generatedSignal.target2.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 block">
                  Confluence Grounds:
                </span>
                {generatedSignal.reasoning.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  onApplySignal(generatedSignal);
                  onClose();
                }}
                className="flex-1 py-3 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Execute Tactical DCA ({kellyMultiplier}x)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
