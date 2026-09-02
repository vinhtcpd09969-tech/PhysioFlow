import { describe, it, expect } from 'vitest';
import { censorText, containsProfanity } from './profanity';

describe('Vietnamese Profanity Engine', () => {
  it('censors direct vulgar phrases correctly', () => {
    expect(censorText('đù mẹ')).toBe('***');
    expect(censorText('du me')).toBe('***');
    expect(censorText('đù má')).toBe('***');
    expect(censorText('đậu má')).toBe('***');
    expect(censorText('khốn nạn')).toBe('***');
    expect(censorText('mẹ kiếp')).toBe('***');
    expect(censorText('óc chó')).toBe('***');
    expect(censorText('súc vật')).toBe('***');
    expect(censorText('thằng chó')).toBe('***');
  });

  it('censors common acronyms and slang', () => {
    expect(censorText('dcm')).toBe('***');
    expect(censorText('đm')).toBe('***');
    expect(censorText('dm')).toBe('***');
    expect(censorText('vcl')).toBe('***');
    expect(censorText('vkl')).toBe('***');
    expect(censorText('vcc')).toBe('***');
    expect(censorText('vl')).toBe('***');
    expect(censorText('clgt')).toBe('***');
  });

  it('censors repeated letters and spaced bypasses', () => {
    expect(censorText('đùùù mẹẹẹ')).toBe('***');
    expect(censorText('đ.ù m.ẹ')).toBe('***');
    expect(censorText('d.m')).toBe('***');
    expect(censorText('vllll')).toBe('***');
    expect(censorText('lồnnnn')).toBe('***');
  });

  it('censors inside sentences', () => {
    expect(censorText('Dịch vụ như đù mẹ vậy')).toBe('Dịch vụ như *** vậy');
    expect(censorText('Nhân viên mất dạy và óc chó')).toBe('Nhân viên *** và ***');
  });

  it('preserves medical and everyday normal Vietnamese words without false positives', () => {
    expect(censorText('Tôi bị đau lưng và đau cổ vai gáy')).toBe('Tôi bị đau lưng và đau cổ vai gáy');
    expect(censorText('Bác sĩ điều trị phục hồi chức năng rất tốt')).toBe('Bác sĩ điều trị phục hồi chức năng rất tốt');
    expect(censorText('Chăm sóc khách hàng chu đáo và đúng hẹn')).toBe('Chăm sóc khách hàng chu đáo và đúng hẹn');
    expect(censorText('Cảm ơn phòng khám rất nhiều')).toBe('Cảm ơn phòng khám rất nhiều');
  });

  it('correctly detects profanity boolean', () => {
    expect(containsProfanity('đù mẹ')).toBe(true);
    expect(containsProfanity('Dịch vụ rất tốt')).toBe(false);
  });
});
