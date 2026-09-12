import { describe, it, expect } from 'bun:test';
import {
  formatTimeAgo,
  formatClockTime,
  formatTokens,
  formatBytes,
  formatDurationSeconds,
} from '../src/utils/formatters';

describe('Formatter Utilities Tests', () => {
  describe('formatTimeAgo', () => {
    it('returns empty string if timestamp is undefined or 0', () => {
      expect(formatTimeAgo(undefined)).toBe('');
      expect(formatTimeAgo(0)).toBe('');
    });

    it('returns "Just now" for times under 60 seconds', () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 10000)).toBe('Just now');
      expect(formatTimeAgo(now - 55000)).toBe('Just now');
    });

    it('formats minutes ago correctly', () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 2 * 60 * 1000)).toBe('2m ago');
      expect(formatTimeAgo(now - 45 * 60 * 1000)).toBe('45m ago');
    });

    it('formats hours ago correctly', () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 2 * 3600 * 1000)).toBe('2h ago');
      expect(formatTimeAgo(now - 23 * 3600 * 1000)).toBe('23h ago');
    });

    it('formats days ago correctly', () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 48 * 3600 * 1000)).toBe('2d ago');
      expect(formatTimeAgo(now - 100 * 3600 * 1000)).toBe('4d ago');
    });
  });

  describe('formatClockTime', () => {
    it('returns empty string if invalid or missing', () => {
      expect(formatClockTime(undefined)).toBe('');
      expect(formatClockTime(0)).toBe('');
      expect(formatClockTime('invalid-date')).toBe('');
    });

    it('formats valid timestamp into clock time string', () => {
      const d = new Date(2026, 8, 12, 14, 30, 0); // 2:30 PM
      const formatted = formatClockTime(d.getTime());
      expect(formatted).toBeTruthy();
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  describe('formatTokens', () => {
    it('formats under 1000 without k suffix', () => {
      expect(formatTokens(0)).toBe('0');
      expect(formatTokens(500)).toBe('500');
      expect(formatTokens(999)).toBe('999');
    });

    it('formats 1000 and above with k suffix', () => {
      expect(formatTokens(1000)).toBe('1.0k');
      expect(formatTokens(4096)).toBe('4.1k');
      expect(formatTokens(131072)).toBe('131.1k');
    });

    it('handles undefined or null or NaN', () => {
      expect(formatTokens(undefined)).toBe('0');
      expect(formatTokens(NaN)).toBe('0');
    });
  });

  describe('formatBytes', () => {
    it('handles 0 or undefined gracefully', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(undefined)).toBe('0 B');
    });

    it('formats bytes, kilobytes, megabytes, and gigabytes', () => {
      expect(formatBytes(500)).toBe('500.0 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
      expect(formatBytes(1024 * 1024 * 1024 * 4.5)).toBe('4.5 GB');
    });
  });

  describe('formatDurationSeconds', () => {
    it('formats milliseconds to seconds with default 2 decimals', () => {
      expect(formatDurationSeconds(1250)).toBe('1.25s');
      expect(formatDurationSeconds(350)).toBe('0.35s');
      expect(formatDurationSeconds(0)).toBe('0.00s');
    });

    it('handles custom decimal count', () => {
      expect(formatDurationSeconds(1250, 1)).toBe('1.3s');
      expect(formatDurationSeconds(1250, 3)).toBe('1.250s');
    });

    it('handles undefined or NaN', () => {
      expect(formatDurationSeconds(undefined)).toBe('0.00s');
      expect(formatDurationSeconds(NaN)).toBe('0.00s');
    });
  });
});
