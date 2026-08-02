/**
 * 수면 기록 — 순수 함수만. UI/스토리지 의존 없음.
 * 기록 1건은 "하룻밤"이며 date는 일어난 날(아침) 기준 YYYY-MM-DD.
 */

import { minutesBetween, parseTime } from './sleep';

export interface SleepRecord {
  /** 일어난 날 (YYYY-MM-DD) */
  date: string;
  /** 잠자리에 든 시각 "HH:MM" */
  bed: string;
  /** 일어난 시각 "HH:MM" */
  wake: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export function isValidISO(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return (
    d.getUTCFullYear() === Number(m[1]) &&
    d.getUTCMonth() === Number(m[2]) - 1 &&
    d.getUTCDate() === Number(m[3])
  );
}

export function isValidRecord(v: unknown): v is SleepRecord {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.date === 'string' &&
    isValidISO(r.date) &&
    typeof r.bed === 'string' &&
    parseTime(r.bed) !== null &&
    typeof r.wake === 'string' &&
    parseTime(r.wake) !== null
  );
}

/** 오늘(로컬) YYYY-MM-DD */
export function todayISO(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** iso에 n일 더한 날짜. 잘못된 입력이면 그대로 반환. */
export function shiftISO(iso: string, n: number): string {
  if (!isValidISO(iso)) return iso;
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + n * DAY_MS);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(
    t.getUTCDate()
  ).padStart(2, '0')}`;
}

/** 요일 인덱스 (0=일). 잘못된 입력이면 -1 */
export function weekdayOf(iso: string): number {
  if (!isValidISO(iso)) return -1;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** 실제 수면 시간(분). 자정 넘김 처리. */
export function durationOf(r: SleepRecord): number {
  const bed = parseTime(r.bed);
  const wake = parseTime(r.wake);
  if (bed === null || wake === null) return 0;
  return minutesBetween(bed, wake);
}

/** 같은 날짜 기록은 덮어쓰고 날짜 내림차순으로 정렬해 반환 (최대 120건 보관) */
export function upsertRecord(list: SleepRecord[], next: SleepRecord): SleepRecord[] {
  const rest = list.filter((r) => r.date !== next.date);
  return [next, ...rest].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 120);
}

export function removeRecord(list: SleepRecord[], date: string): SleepRecord[] {
  return list.filter((r) => r.date !== date);
}

/**
 * 연속 기록 일수. 오늘 기록이 있으면 오늘부터, 없으면 어제부터 거슬러 올라간다.
 * (자정 직후엔 아직 오늘 기록이 없는 게 정상이므로 어제까지 인정)
 */
export function streakOf(list: SleepRecord[], today: string): number {
  const dates = new Set(list.map((r) => r.date));
  let cursor = dates.has(today) ? today : shiftISO(today, -1);
  if (!dates.has(cursor)) return 0;
  let n = 0;
  while (dates.has(cursor)) {
    n++;
    cursor = shiftISO(cursor, -1);
  }
  return n;
}

/** 최근 days일(오늘 포함) 안의 기록 통계 */
export function recentStats(
  list: SleepRecord[],
  today: string,
  days = 7
): { count: number; avgMinutes: number } {
  const from = shiftISO(today, -(days - 1));
  const inRange = list.filter((r) => r.date >= from && r.date <= today);
  if (inRange.length === 0) return { count: 0, avgMinutes: 0 };
  const sum = inRange.reduce((a, r) => a + durationOf(r), 0);
  return { count: inRange.length, avgMinutes: Math.round(sum / inRange.length) };
}

/** 요일별 평균 수면 시간 (0=일 ~ 6=토) */
export function weekdayAverages(
  list: SleepRecord[]
): { weekday: number; label: string; avgMinutes: number; count: number }[] {
  const acc = WEEKDAY_LABELS.map((label, weekday) => ({
    weekday,
    label,
    total: 0,
    count: 0,
  }));
  for (const r of list) {
    const w = weekdayOf(r.date);
    if (w < 0) continue;
    acc[w].total += durationOf(r);
    acc[w].count++;
  }
  return acc.map((a) => ({
    weekday: a.weekday,
    label: a.label,
    count: a.count,
    avgMinutes: a.count === 0 ? 0 : Math.round(a.total / a.count),
  }));
}

/** 권장 수면(7~9시간) 대비 한 줄 코멘트 */
export function sleepComment(avgMinutes: number): string {
  if (avgMinutes === 0) return '기록을 쌓으면 내 수면 패턴이 보여요.';
  if (avgMinutes < 6 * 60) return '권장 수면(7~9시간)보다 많이 짧아요. 취침 시각을 앞당겨 보세요.';
  if (avgMinutes < 7 * 60) return '권장 수면보다 조금 짧아요. 30분만 일찍 누워도 달라져요.';
  if (avgMinutes <= 9 * 60) return '권장 수면 범위 안이에요. 이 리듬을 유지해 보세요.';
  return '평균보다 긴 편이에요. 기상 시각을 일정하게 맞춰 보세요.';
}
