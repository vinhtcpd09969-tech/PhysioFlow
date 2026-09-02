import { describe, it, expect } from 'vitest';
import { validateEmail } from './validators';

describe('validateEmail', () => {
  it('should reject empty or null email', () => {
    expect(validateEmail(null).isValid).toBe(false);
    expect(validateEmail('').isValid).toBe(false);
    expect(validateEmail('   ').isValid).toBe(false);
  });

  it('should accept valid standard emails', () => {
    expect(validateEmail('user@gmail.com').isValid).toBe(true);
    expect(validateEmail('user.name+tag@yahoo.com').isValid).toBe(true);
    expect(validateEmail('admin@fpt.edu.vn').isValid).toBe(true);
    expect(validateEmail('contact@officecare.vn').isValid).toBe(true);
  });

  it('should reject email with typo domain gmaill.com (user case kindc0506@gmaill.com)', () => {
    const res = validateEmail('kindc0506@gmaill.com');
    expect(res.isValid).toBe(false);
    expect(res.message).toContain('gmaill.com');
    expect(res.message).toContain('gmail.com');
    expect(res.suggestion).toBe('kindc0506@gmail.com');
  });

  it('should reject other common domain typos', () => {
    expect(validateEmail('test@gamil.com').isValid).toBe(false);
    expect(validateEmail('test@gmial.com').isValid).toBe(false);
    expect(validateEmail('test@gmail.con').isValid).toBe(false);
    expect(validateEmail('test@yaho.com').isValid).toBe(false);
    expect(validateEmail('test@hotmial.com').isValid).toBe(false);
    expect(validateEmail('test@outlok.com').isValid).toBe(false);
  });

  it('should reject invalid syntax (double dots, missing @, invalid tld)', () => {
    expect(validateEmail('user..name@gmail.com').isValid).toBe(false);
    expect(validateEmail('user@gmail..com').isValid).toBe(false);
    expect(validateEmail('.user@gmail.com').isValid).toBe(false);
    expect(validateEmail('user@com').isValid).toBe(false);
    expect(validateEmail('user@.com').isValid).toBe(false);
  });
});
