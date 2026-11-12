/**
 * ==============================================================================
 * INSTITUTIONAL ALERT ENGINE WITH DEDUPLICATION & COOLDOWN
 * Evaluates market regime transitions, tier touches, and confluence deltas.
 * ==============================================================================
 */

export interface MarketStateSnapshot {
  timestampMs: number;
  currentPrice: number;
  confluenceScore: number;
  activePhase: number;
  regime: string;
  mvrv: number;
  mayerMultiple: number;
  tier1Price: number;
  tier2Price: number;
  tier3Price: number;
  tier4Price: number;
  scoreDelta7D: number;
}

export type AlertType =
  | 'REGIME_CHANGE'
  | 'RADAR_BOUNDARY_CROSS'
  | 'TIER_TOUCH'
  | 'RAPID_CONFLUENCE_DELTA';

export interface GeneratedAlert {
  alertId: string;
  type: AlertType;
  titleVi: string;
  titleEn: string;
  bodyVi: string;
  bodyEn: string;
  urgency: 'INFO' | 'MEDIUM' | 'HIGH';
  timestampMs: number;
  dedupKey: string;
}

export class AlertEngine {
  private sentAlertTimestamps: Map<string, number> = new Map();
  private cooldownMs: number;

  constructor(cooldownHours: number = 24) {
    this.cooldownMs = cooldownHours * 3600 * 1000;
  }

  /**
   * Evaluates current market state snapshot against trigger rules
   */
  public evaluateState(
    current: MarketStateSnapshot,
    previous?: MarketStateSnapshot
  ): GeneratedAlert[] {
    const alerts: GeneratedAlert[] = [];

    // Rule 1: Regime Transition
    if (previous && previous.regime !== current.regime) {
      const dedupKey = `regime_change_${previous.regime}_to_${current.regime}`;
      if (this.shouldDispatch(dedupKey, current.timestampMs)) {
        alerts.push({
          alertId: `alert_${current.timestampMs}_regime`,
          type: 'REGIME_CHANGE',
          titleVi: '🚨 THAY ĐỔI CHẾ ĐỘ THỊ TRƯỜNG',
          titleEn: '🚨 MARKET REGIME CHANGE',
          bodyVi: `Hệ thống vừa chuyển từ chế độ ${previous.regime} sang ${current.regime} (Điểm hội tụ: ${current.confluenceScore}/100, Giá: $${current.currentPrice.toLocaleString()}).`,
          bodyEn: `Market regime transitioned from ${previous.regime} to ${current.regime} (Confluence: ${current.confluenceScore}/100, Price: $${current.currentPrice.toLocaleString()}).`,
          urgency: 'HIGH',
          timestampMs: current.timestampMs,
          dedupKey,
        });
      }
    }

    // Rule 2: Radar Boundary Crossing (MVRV 1.0 or 2.4, Mayer 1.38 or 2.4)
    if (current.mvrv <= 1.0) {
      const dedupKey = 'radar_mvrv_undervalued_floor';
      if (this.shouldDispatch(dedupKey, current.timestampMs)) {
        alerts.push({
          alertId: `alert_${current.timestampMs}_mvrv_floor`,
          type: 'RADAR_BOUNDARY_CROSS',
          titleVi: '💎 MVRV DƯỚI 1.0: VÙNG GIÁ VỐN ON-CHAIN',
          titleEn: '💎 MVRV BELOW 1.0: UNDERVALUED BASELINE',
          bodyVi: `Chỉ số MVRV hiện ở mức ${current.mvrv.toFixed(2)}x, giá Bitcoin nằm sâu dưới giá vốn toàn mạng lưới ($${current.tier4Price.toLocaleString()}). Tỷ lệ Risk/Reward lịch sử đạt mức cao nhất chu kỳ.`,
          bodyEn: `MVRV ratio dropped to ${current.mvrv.toFixed(2)}x below aggregate network cost basis. Historical risk/reward is at maximum asymmetric favorability.`,
          urgency: 'HIGH',
          timestampMs: current.timestampMs,
          dedupKey,
        });
      }
    } else if (current.mvrv >= 2.4) {
      const dedupKey = 'radar_mvrv_overheated_ceiling';
      if (this.shouldDispatch(dedupKey, current.timestampMs)) {
        alerts.push({
          alertId: `alert_${current.timestampMs}_mvrv_top`,
          type: 'RADAR_BOUNDARY_CROSS',
          titleVi: '⚠️ MVRV VƯỢT 2.4: ĐỊNH GIÁ NÓNG CHU KỲ',
          titleEn: '⚠️ MVRV EXCEEDS 2.4: HEATED EXPANSION',
          bodyVi: `MVRV đạt ${current.mvrv.toFixed(2)}x, thị trường bước vào pha phân phối hưng phấn. Kích hoạt kế hoạch chốt lời từng phần (De-risking).`,
          bodyEn: `MVRV reached ${current.mvrv.toFixed(2)}x entering distribution zone. De-risking ladder recommended.`,
          urgency: 'HIGH',
          timestampMs: current.timestampMs,
          dedupKey,
        });
      }
    }

    // Rule 3: Tier Touches (Price within 0.75% of limit barriers)
    const checkTierTouch = (tierName: string, tierPrice: number, tierIndex: number) => {
      const deltaPct = Math.abs((current.currentPrice - tierPrice) / tierPrice) * 100;
      if (deltaPct <= 0.75) {
        const dedupKey = `tier_touch_${tierIndex}_${Math.round(tierPrice)}`;
        if (this.shouldDispatch(dedupKey, current.timestampMs)) {
          alerts.push({
            alertId: `alert_${current.timestampMs}_tier_${tierIndex}`,
            type: 'TIER_TOUCH',
            titleVi: `🎯 GIÁ CHẠM TẦNG ${tierIndex}: ${tierName}`,
            titleEn: `🎯 TIER ${tierIndex} REACHED: ${tierName}`,
            bodyVi: `Giá Bitcoin ($${current.currentPrice.toLocaleString()}) đã chạm mốc Tầng ${tierIndex} ($${tierPrice.toLocaleString()}, lệch ${deltaPct.toFixed(2)}%). Xem xét kích hoạt lệnh phân bổ đã lập trình.`,
            bodyEn: `Bitcoin ($${current.currentPrice.toLocaleString()}) reached Tier ${tierIndex} barrier ($${tierPrice.toLocaleString()}). Execution order ready.`,
            urgency: tierIndex >= 3 ? 'HIGH' : 'MEDIUM',
            timestampMs: current.timestampMs,
            dedupKey,
          });
        }
      }
    };

    checkTierTouch('Nhịp Chỉnh 7D', current.tier1Price, 1);
    checkTierTouch('Quét Râu 7D', current.tier2Price, 2);
    checkTierTouch('Sàn Chu Kỳ 200W', current.tier3Price, 3);
    checkTierTouch('Giá Vốn Realized', current.tier4Price, 4);

    // Rule 4: Confluence Score Rapid Delta (>= 5 points in 7D)
    if (Math.abs(current.scoreDelta7D) >= 5.0) {
      const dedupKey = `confluence_delta_7d_${current.scoreDelta7D >= 0 ? 'pos' : 'neg'}`;
      if (this.shouldDispatch(dedupKey, current.timestampMs)) {
        alerts.push({
          alertId: `alert_${current.timestampMs}_delta7d`,
          type: 'RAPID_CONFLUENCE_DELTA',
          titleVi: `📊 ĐIỂM HỘI TỤ BIẾN ĐỘNG MẠNH (${current.scoreDelta7D >= 0 ? '+' : ''}${current.scoreDelta7D.toFixed(1)} ĐIỂM / 7D)`,
          titleEn: `📊 RAPID CONFLUENCE SHIFT (${current.scoreDelta7D >= 0 ? '+' : ''}${current.scoreDelta7D.toFixed(1)} PTS / 7D)`,
          bodyVi: `Động cơ 4 trụ cột ghi nhận dòng tiền và cấu trúc phái sinh thay đổi nhanh: Điểm hiện tại đạt ${current.confluenceScore}/100.`,
          bodyEn: `4-pillar engine detected significant structure shift: Current score is ${current.confluenceScore}/100.`,
          urgency: 'MEDIUM',
          timestampMs: current.timestampMs,
          dedupKey,
        });
      }
    }

    return alerts;
  }

  /**
   * Anti-spam / Cooldown deduplication filter
   */
  private shouldDispatch(dedupKey: string, nowMs: number): boolean {
    const lastSent = this.sentAlertTimestamps.get(dedupKey);
    if (!lastSent || nowMs - lastSent >= this.cooldownMs) {
      this.sentAlertTimestamps.set(dedupKey, nowMs);
      return true;
    }
    return false;
  }

  /**
   * Resets cooldown cache (useful for testing)
   */
  public resetCooldowns(): void {
    this.sentAlertTimestamps.clear();
  }
}
