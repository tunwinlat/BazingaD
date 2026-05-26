import { describe, it, expect } from 'vitest';
import { passwordSchema } from './validation';

describe('passwordSchema', () => {
  it('should accept a valid password', () => {
    const validPasswords = [
      'StrongPass1!',
      'aB3!defghi',
      '12345678aA@',
      'LongPasswordWithSpecialChar!@#1',
    ];

    validPasswords.forEach((password) => {
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(true);
    });
  });

  it('should reject passwords shorter than 8 characters', () => {
    const result = passwordSchema.safeParse('Sh0rt!');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must be at least 8 characters');
    }
  });

  it('should reject passwords longer than 128 characters', () => {
    const longPassword = 'A1!'.repeat(50); // 150 characters
    const result = passwordSchema.safeParse(longPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must not exceed 128 characters');
    }
  });

  it('should reject passwords missing an uppercase letter', () => {
    const result = passwordSchema.safeParse('nouppercase1!');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must contain at least one uppercase letter');
    }
  });

  it('should reject passwords missing a lowercase letter', () => {
    const result = passwordSchema.safeParse('NOLOWERCASE1!');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must contain at least one lowercase letter');
    }
  });

  it('should reject passwords missing a number', () => {
    const result = passwordSchema.safeParse('NoNumberHere!');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must contain at least one number');
    }
  });

  it('should reject passwords missing a special character', () => {
    const result = passwordSchema.safeParse('NoSpecialChar1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password must contain at least one special character');
    }
  });
});
