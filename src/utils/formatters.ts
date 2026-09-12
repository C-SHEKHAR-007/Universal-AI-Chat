/**
 * Reusable formatting utilities for dates, times, tokens, byte sizes, and durations.
 */

/**
 * Formats a timestamp into a human-readable relative time string.
 * e.g. "Just now", "5m ago", "2h ago", "3d ago"
 */
export const formatTimeAgo = (timestamp?: number): string => {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/**
 * Formats a timestamp, date, or ISO string into a localized clock time string (e.g. "02:30 PM" or "14:30").
 */
export const formatClockTime = (timestamp?: number | string | Date): string => {
  if (!timestamp) return '';
  try {
    const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

/**
 * Formats a token count into a readable string with 'k' suffix for thousands (e.g. 4096 -> "4.1k", 500 -> "500").
 */
export const formatTokens = (tokens?: number): string => {
  if (tokens === undefined || tokens === null || isNaN(tokens)) return '0';
  if (tokens >= 1000) {
    return (tokens / 1000).toFixed(1) + 'k';
  }
  return tokens.toString();
};

/**
 * Formats byte size into human-readable units (B, KB, MB, GB, TB).
 * Useful for AI model file sizes and network transfers.
 */
export const formatBytes = (bytes?: number, decimals: number = 1): string => {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, sizes.length - 1);
  return `${(bytes / Math.pow(k, safeIndex)).toFixed(decimals)} ${sizes[safeIndex]}`;
};

/**
 * Formats duration in milliseconds into seconds with 's' suffix (e.g. 1250ms -> "1.25s").
 */
export const formatDurationSeconds = (ms?: number, decimals: number = 2): string => {
  if (ms === undefined || ms === null || isNaN(ms)) return `0.${'0'.repeat(decimals)}s`;
  return `${(ms / 1000).toFixed(decimals)}s`;
};
