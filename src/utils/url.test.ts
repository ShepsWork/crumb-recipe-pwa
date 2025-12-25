import { describe, expect, it } from 'vitest';
import { cleanUrlInput, normalizeRecipeUrl } from './url';

describe('cleanUrlInput', () => {
  it('trims and collapses whitespace', () => {
    expect(cleanUrlInput('  https://example.com/a\n\n b  ')).toBe('https://example.com/a b');
  });

  it('removes zero-width characters', () => {
    expect(cleanUrlInput('https://exa\u200Bmple.com')).toBe('https://example.com');
  });
});

describe('normalizeRecipeUrl', () => {
  it('adds https:// when scheme is missing', () => {
    expect(normalizeRecipeUrl('example.com/recipe')).toBe('https://example.com/recipe');
  });

  it('converts protocol-relative urls', () => {
    expect(normalizeRecipeUrl('//example.com/recipe')).toBe('https://example.com/recipe');
  });

  it('keeps http/https urls', () => {
    expect(normalizeRecipeUrl('http://example.com/x')).toBe('http://example.com/x');
    expect(normalizeRecipeUrl('https://example.com/x')).toBe('https://example.com/x');
  });

  it('encodes spaces', () => {
    expect(normalizeRecipeUrl('https://example.com/a b')).toBe('https://example.com/a%20b');
  });

  it('rejects non-http(s) protocols', () => {
    expect(() => normalizeRecipeUrl('file:///etc/passwd')).toThrow(/http:\/\//i);
  });
});
