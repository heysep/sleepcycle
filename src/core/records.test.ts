import { describe, expect, it } from 'vitest';
import {
  durationOf,
  recentStats,
  shiftISO,
  streakOf,
  upsertRecord,
  weekdayAverages,
  weekdayOf,
  type SleepRecord,
} from './records';

const rec = (date: string, bed: string, wake: string): SleepRecord => ({ date, bed, wake });

describe('shiftISO', () => {
  it('월 경계를 넘긴다', () => {
    expect(shiftISO('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftISO('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('잘못된 값은 그대로', () => {
    expect(shiftISO('bad', 1)).toBe('bad');
  });
});

describe('durationOf', () => {
  it('자정을 넘긴 수면을 계산한다', () => {
    expect(durationOf(rec('2026-08-02', '23:30', '07:00'))).toBe(450);
  });
  it('같은 날 낮 수면도 계산한다', () => {
    expect(durationOf(rec('2026-08-02', '01:00', '08:30'))).toBe(450);
  });
  it('형식이 깨지면 0', () => {
    expect(durationOf(rec('2026-08-02', 'x', '07:00'))).toBe(0);
  });
});

describe('upsertRecord', () => {
  it('같은 날짜는 덮어쓰고 최신순으로 정렬한다', () => {
    const list = [rec('2026-08-01', '23:00', '07:00')];
    const next = upsertRecord(list, rec('2026-08-01', '00:00', '06:00'));
    expect(next).toHaveLength(1);
    expect(next[0].bed).toBe('00:00');

    const two = upsertRecord(next, rec('2026-08-02', '23:00', '07:00'));
    expect(two.map((r) => r.date)).toEqual(['2026-08-02', '2026-08-01']);
  });
});

describe('streakOf', () => {
  it('오늘 기록이 있으면 오늘부터 센다', () => {
    const list = [
      rec('2026-08-02', '23:00', '07:00'),
      rec('2026-08-01', '23:00', '07:00'),
      rec('2026-07-31', '23:00', '07:00'),
    ];
    expect(streakOf(list, '2026-08-02')).toBe(3);
  });
  it('오늘 기록이 없으면 어제부터 센다', () => {
    const list = [rec('2026-08-01', '23:00', '07:00')];
    expect(streakOf(list, '2026-08-02')).toBe(1);
  });
  it('이틀 이상 비면 0', () => {
    const list = [rec('2026-07-30', '23:00', '07:00')];
    expect(streakOf(list, '2026-08-02')).toBe(0);
  });
  it('기록이 없으면 0', () => {
    expect(streakOf([], '2026-08-02')).toBe(0);
  });
});

describe('recentStats', () => {
  it('최근 7일 안의 기록만 평균낸다', () => {
    const list = [
      rec('2026-08-02', '23:00', '07:00'), // 480
      rec('2026-08-01', '23:00', '05:00'), // 360
      rec('2026-07-20', '23:00', '11:00'), // 범위 밖
    ];
    const s = recentStats(list, '2026-08-02', 7);
    expect(s.count).toBe(2);
    expect(s.avgMinutes).toBe(420);
  });
  it('기록이 없으면 0', () => {
    expect(recentStats([], '2026-08-02')).toEqual({ count: 0, avgMinutes: 0 });
  });
});

describe('weekdayAverages', () => {
  it('요일 7칸을 항상 채운다', () => {
    const out = weekdayAverages([rec('2026-08-02', '23:00', '07:00')]);
    expect(out).toHaveLength(7);
    // 2026-08-02는 일요일
    expect(weekdayOf('2026-08-02')).toBe(0);
    expect(out[0].count).toBe(1);
    expect(out[0].avgMinutes).toBe(480);
    expect(out[1].count).toBe(0);
    expect(out[1].avgMinutes).toBe(0);
  });
});
