import { describe, expect, it } from 'vitest';
import {
  bedtimesForWake,
  formatDuration,
  formatTime,
  minutesBetween,
  napEnd,
  parseTime,
  wakeTimesFromNow,
} from './sleep';

const t = (s: string) => {
  const v = parseTime(s);
  if (v === null) throw new Error('bad time ' + s);
  return v;
};

describe('parseTime / formatTime', () => {
  it('정상 파싱', () => {
    expect(parseTime('07:00')).toBe(420);
    expect(parseTime('00:00')).toBe(0);
    expect(parseTime('23:59')).toBe(1439);
  });
  it('잘못된 입력은 null', () => {
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('12:60')).toBeNull();
    expect(parseTime('')).toBeNull();
    expect(parseTime('abc')).toBeNull();
  });
  it('formatTime 자정 넘김 정규화', () => {
    expect(formatTime(1440)).toBe('00:00');
    expect(formatTime(-14)).toBe('23:46');
    expect(formatTime(420)).toBe('07:00');
  });
});

describe('minutesBetween — 자정 넘김', () => {
  it('23:30 취침 → 07:00 기상 = 450분(7.5시간)', () => {
    expect(minutesBetween(t('23:30'), t('07:00'))).toBe(450);
  });
  it('같은 날 구간', () => {
    expect(minutesBetween(t('13:00'), t('13:20'))).toBe(20);
  });
});

describe('bedtimesForWake — 기상 시각 역산', () => {
  it('07:00 기상 → 6사이클 취침 21:46 (9시간 수면 + 14분)', () => {
    const opts = bedtimesForWake(t('07:00'));
    expect(opts[0].cycles).toBe(6);
    expect(formatTime(opts[0].time)).toBe('21:46');
    expect(opts[0].sleepMinutes).toBe(540);
  });
  it('07:00 기상 → 5사이클 23:16, 4사이클 00:46(자정 넘김), 3사이클 02:16', () => {
    const [, c5, c4, c3] = bedtimesForWake(t('07:00'));
    expect(formatTime(c5.time)).toBe('23:16');
    expect(formatTime(c4.time)).toBe('00:46');
    expect(formatTime(c3.time)).toBe('02:16');
  });
  it('자정 직후 기상(00:30)도 음수 없이 계산', () => {
    const opts = bedtimesForWake(t('00:30'));
    expect(formatTime(opts[0].time)).toBe('15:16');
    for (const o of opts) expect(o.time).toBeGreaterThanOrEqual(0);
  });
  it('취침→기상 실제 간격 = 수면시간 + 14분 (23:30/07:00 케이스 역검증)', () => {
    for (const o of bedtimesForWake(t('07:00'))) {
      expect(minutesBetween(o.time, t('07:00'))).toBe(o.sleepMinutes + 14);
    }
  });
});

describe('wakeTimesFromNow — 지금 자면', () => {
  it('23:00에 자면 3사이클 기상 03:44', () => {
    const opts = wakeTimesFromNow(t('23:00'));
    expect(opts[0].cycles).toBe(3);
    expect(formatTime(opts[0].time)).toBe('03:44');
  });
  it('23:00 → 6사이클 08:14 (자정 넘김)', () => {
    const opts = wakeTimesFromNow(t('23:00'));
    expect(formatTime(opts[3].time)).toBe('08:14');
    expect(opts[3].sleepMinutes).toBe(540);
  });
  it('23:59 경계에서도 정규화', () => {
    for (const o of wakeTimesFromNow(t('23:59'))) {
      expect(o.time).toBeGreaterThanOrEqual(0);
      expect(o.time).toBeLessThan(1440);
    }
  });
});

describe('napEnd — 낮잠', () => {
  it('13:00 파워냅 → 13:34 (14+20분)', () => {
    const r = napEnd(t('13:00'), 'power');
    expect(formatTime(r.time)).toBe('13:34');
    expect(r.napMinutes).toBe(20);
  });
  it('13:00 풀사이클 → 14:44 (14+90분)', () => {
    expect(formatTime(napEnd(t('13:00'), 'full').time)).toBe('14:44');
  });
  it('23:50 파워냅 자정 넘김 → 00:24', () => {
    expect(formatTime(napEnd(t('23:50'), 'power').time)).toBe('00:24');
  });
});

describe('formatDuration', () => {
  it('경계값', () => {
    expect(formatDuration(20)).toBe('20분');
    expect(formatDuration(90)).toBe('1시간 30분');
    expect(formatDuration(540)).toBe('9시간');
  });
});
