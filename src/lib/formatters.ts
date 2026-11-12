/**
 * Utility functions for institutional terminal formatting
 */

export function formatUSD(value: number, decimals?: number): string {
  if (isNaN(value)) return '$0.00';
  const resolvedDecimals =
    decimals !== undefined
      ? decimals
      : Math.abs(value) > 0 && Math.abs(value) < 1000
      ? 2
      : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: resolvedDecimals,
    maximumFractionDigits: resolvedDecimals,
  }).format(value);
}

export function formatVND(value: number): string {
  if (isNaN(value)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, withSign: boolean = true): string {
  if (isNaN(value)) return '0.00%';
  const prefix = withSign && value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatSats(btcAmount: number): string {
  const sats = Math.round(btcAmount * 100000000);
  return new Intl.NumberFormat('en-US').format(sats) + ' sats';
}

export function formatBtc(amount: number, decimals: number = 8): string {
  if (isNaN(amount)) return '0.00000000';
  return amount.toFixed(decimals);
}

/**
 * Mempool Fee formatting: strictly enforced to at most 1 decimal place
 * (e.g., 2.8 sat/vB, 3.5 sat/vB, 0.5 sat/vB, never 2.761 sat/vB)
 */
export function formatFee(fee: number): string {
  if (isNaN(fee)) return '0 sat/vB';
  const rounded = Math.round(fee * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} sat/vB`;
}

export function formatCompactUSD(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}k`;
  }
  return formatUSD(value, 2);
}

export function timeAgo(timestampMs: number, locale: 'vi' | 'en' = 'vi'): string {
  const seconds = Math.floor((Date.now() - timestampMs) / 1000);
  if (locale === 'vi') {
    if (seconds < 60) return `${seconds}s trước`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}p trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}g trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  } else {
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}

export function formatCountdown(targetEpochMs: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const diff = Math.max(0, targetEpochMs - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    formatted: `${days}d ${hours.toString().padStart(2, '0')}h ${minutes
      .toString()
      .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`,
  };
}
