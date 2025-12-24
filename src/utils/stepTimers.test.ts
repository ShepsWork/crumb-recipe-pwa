import { describe, expect, it } from 'vitest';
import { extractDurationsFromInstruction, parseEditableDurationToSeconds } from './stepTimers';

describe('extractDurationsFromInstruction', () => {
  it('extracts minutes from common phrasing', () => {
    const step = 'Cover and let rest for 30 minutes.';
    const res = extractDurationsFromInstruction(step);
    expect(res).toHaveLength(1);
    expect(res[0].seconds).toBe(30 * 60);
  });

  it('combines hours + minutes into one duration', () => {
    const step = 'Bake for 1 hour and 15 minutes, then cool.';
    const res = extractDurationsFromInstruction(step);
    expect(res).toHaveLength(1);
    expect(res[0].seconds).toBe(1 * 3600 + 15 * 60);
  });

  it('does not match bare numbers (step numbers)', () => {
    const step = '5';
    const res = extractDurationsFromInstruction(step);
    expect(res).toHaveLength(0);
  });

  it('extracts multiple durations when separated', () => {
    const step = 'Rest 10 minutes. Then bake 20 minutes.';
    const res = extractDurationsFromInstruction(step);
    expect(res).toHaveLength(2);
    expect(res[0].seconds).toBe(10 * 60);
    expect(res[1].seconds).toBe(20 * 60);
  });
});

describe('parseEditableDurationToSeconds', () => {
  it('parses minutes-only values', () => {
    const r = parseEditableDurationToSeconds('200');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.seconds).toBe(200 * 60);
  });

  it('parses H:MM values', () => {
    const r = parseEditableDurationToSeconds('2:30');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.seconds).toBe((2 * 60 + 30) * 60);
  });

  it('rejects empty/zero', () => {
    expect(parseEditableDurationToSeconds('')).toEqual({ ok: false, reason: 'empty' });
    expect(parseEditableDurationToSeconds('0').ok).toBe(false);
    expect(parseEditableDurationToSeconds('0:00').ok).toBe(false);
  });
});
