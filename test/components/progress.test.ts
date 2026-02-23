import { describe, expect, it } from 'vitest';
import { convertProgress } from '../../src/sections/player/progress';

describe('convertProgress', () => {
  it('should strip leading zero from minutes (00:13 -> 0:13)', () => {
    expect(convertProgress(13)).toBe('0:13');
  });

  it('should not strip leading digit when minutes >= 10 (11:13 -> 11:13)', () => {
    expect(convertProgress(11 * 60 + 13)).toBe('11:13');
  });

  it('should strip leading zero from single-digit minutes (03:13 -> 3:13)', () => {
    expect(convertProgress(3 * 60 + 13)).toBe('3:13');
  });

  it('should handle zero duration (0:00)', () => {
    expect(convertProgress(0)).toBe('0:00');
  });

  it('should handle exactly one hour', () => {
    expect(convertProgress(3600)).toBe('1:00:00');
  });

  it('should handle durations over one hour with leading zero in minutes', () => {
    // 1:03:13
    expect(convertProgress(3600 + 3 * 60 + 13)).toBe('1:03:13');
  });

  it('should handle durations over one hour with double-digit minutes', () => {
    // 1:11:13
    expect(convertProgress(3600 + 11 * 60 + 13)).toBe('1:11:13');
  });

  it('should strip leading zero from hours (01:03:13 -> 1:03:13)', () => {
    expect(convertProgress(3600 + 3 * 60 + 13)).toBe('1:03:13');
  });

  it('should handle durations over ten hours', () => {
    // 10:05:30
    expect(convertProgress(10 * 3600 + 5 * 60 + 30)).toBe('10:05:30');
  });
});
