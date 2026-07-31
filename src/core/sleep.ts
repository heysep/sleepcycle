/**
 * 수면 사이클 계산 — 순수 함수만. UI/스토리지 의존 없음.
 * 모든 시각은 "자정 기준 분(minute-of-day, 0~1439)"으로 다룬다.
 */

/** 수면 사이클 1회 길이(분) — REM 포함 평균 90분 */
export const CYCLE_MIN = 90;
/** 잠들기까지 걸리는 평균 시간(분) */
export const FALL_ASLEEP_MIN = 14;
/** 파워냅 길이(분) */
export const POWER_NAP_MIN = 20;
/** 하루(분) */
export const DAY_MIN = 24 * 60;
/** 취침 권장으로 보여줄 사이클 수 (많이 잘수록 위) */
export const BEDTIME_CYCLES = [6, 5, 4, 3] as const;
/** 지금 자면 일어날 시각으로 보여줄 사이클 수 */
export const WAKE_CYCLES = [3, 4, 5, 6] as const;

/** "HH:MM" → minute-of-day. 형식이 잘못되면 null */
export function parseTime(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** minute-of-day → "HH:MM" (자정 넘김 정규화 포함) */
export function formatTime(minuteOfDay: number): string {
  const m = ((minuteOfDay % DAY_MIN) + DAY_MIN) % DAY_MIN;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** 두 시각 사이 경과 분 (from → to, 자정 넘김 허용) */
export function minutesBetween(from: number, to: number): number {
  return (((to - from) % DAY_MIN) + DAY_MIN) % DAY_MIN;
}

export interface CycleOption {
  /** 수면 사이클 수 */
  cycles: number;
  /** 시각 (minute-of-day) */
  time: number;
  /** 실제 수면 시간(분) — 잠드는 시간 제외 */
  sleepMinutes: number;
}

/**
 * ① 기상 시각에서 역산한 취침 권장 시각들.
 * 취침 시각 = 기상 − (사이클×90) − 잠들기 14분. 자정 넘김 자동 처리.
 */
export function bedtimesForWake(wakeMinute: number): CycleOption[] {
  return BEDTIME_CYCLES.map((cycles) => {
    const sleepMinutes = cycles * CYCLE_MIN;
    return {
      cycles,
      time: ((wakeMinute - sleepMinutes - FALL_ASLEEP_MIN) % DAY_MIN + DAY_MIN) % DAY_MIN,
      sleepMinutes,
    };
  });
}

/**
 * ② 지금 자면 언제 일어나야 하는지.
 * 기상 시각 = 지금 + 잠들기 14분 + (사이클×90).
 */
export function wakeTimesFromNow(nowMinute: number): CycleOption[] {
  return WAKE_CYCLES.map((cycles) => {
    const sleepMinutes = cycles * CYCLE_MIN;
    return {
      cycles,
      time: (nowMinute + FALL_ASLEEP_MIN + sleepMinutes) % DAY_MIN,
      sleepMinutes,
    };
  });
}

/**
 * ③ 낮잠 종료 시각. 잠들기 14분 + 낮잠 길이.
 * kind: 'power'=20분 파워냅, 'full'=90분 풀사이클
 */
export function napEnd(nowMinute: number, kind: 'power' | 'full'): { time: number; napMinutes: number } {
  const napMinutes = kind === 'power' ? POWER_NAP_MIN : CYCLE_MIN;
  return { time: (nowMinute + FALL_ASLEEP_MIN + napMinutes) % DAY_MIN, napMinutes };
}

/** 분 → "N시간 M분" (0시간/0분은 생략) */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}
