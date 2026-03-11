import { describe, it, expect } from 'vitest';
import { generateSessionToken } from './auth';

describe('generateSessionToken', () => {
  it('should generate a string of length 64', () => {
    const token = generateSessionToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBe(64);
  });

  it('should only contain valid hexadecimal characters', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should generate random, unique tokens', () => {
    const token1 = generateSessionToken();
    const token2 = generateSessionToken();
    const token3 = generateSessionToken();

    expect(token1).not.toBe(token2);
    expect(token1).not.toBe(token3);
    expect(token2).not.toBe(token3);
  });
});
