import { generateSessionToken } from './auth';

// Mock crypto.getRandomValues for Node environment if it doesn't exist natively
// Node 19+ has global crypto, but just in case for Jest
if (typeof crypto === 'undefined') {
  const crypto = require('crypto');
  global.crypto = {
    getRandomValues: (arr: Uint8Array) => {
      const randomBytes = crypto.randomBytes(arr.length);
      for (let i = 0; i < arr.length; i++) {
        arr[i] = randomBytes[i];
      }
      return arr;
    }
  } as any;
}

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
