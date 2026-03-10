import { describe, it, expect } from 'vitest';
import { generateBlockIcon } from './utils';

describe('generateBlockIcon', () => {
  it('should generate a valid SVG data URI for a normal URL', () => {
    const icon = generateBlockIcon('https://example.com');
    expect(icon).toMatch(/^data:image\/svg\+xml,%3Csvg/);
    expect(icon).toContain('linearGradient'); // Verifies that it has gradient
  });

  it('should trigger the catch block and return default SVG when an error occurs', () => {
    // To trigger the catch block, we pass something that causes new URL() or getHash() to throw.
    // getDomain has its own try/catch and returns the input on failure.
    // If we pass an invalid string, getDomain returns the invalid string.
    // Then getHash will run.
    // However, if we pass null as unknown as string:
    // getDomain(null) -> new URL(null) throws. getDomain returns null.
    // getHash(null) -> null.length throws, triggering generateBlockIcon's catch block!
    const icon = generateBlockIcon(null as unknown as string);

    expect(icon).toMatch(/^data:image\/svg\+xml,%3Csvg/);
    expect(icon).toContain('linearGradient');
    // Default SVG uses these specific colors
    expect(icon).toContain('%3Cstop%20offset%3D%220%25%22%20style%3D%22stop-color%3A%236366f1%22%2F%3E');
    expect(icon).toContain('%3Cstop%20offset%3D%22100%25%22%20style%3D%22stop-color%3A%238b5cf6%22%2F%3E');
    expect(icon).toContain('%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2225%22%20fill%3D%22rgba(255%2C255%2C255%2C0.15)%22%2F%3E');
  });

  it('should return a deterministic icon for the same URL', () => {
    const icon1 = generateBlockIcon('https://example.com');
    const icon2 = generateBlockIcon('https://example.com');
    expect(icon1).toBe(icon2);
  });
});
