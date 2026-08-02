import { STORAGE_PREFIX } from './config';
import { parseTime } from './core/sleep';
import { isValidRecord, type SleepRecord } from './core/records';

const WAKE_KEY = `${STORAGE_PREFIX}wakeTime`;
const RECORDS_KEY = `${STORAGE_PREFIX}records`;

/** 저장된 기상 시각 "HH:MM". 손상/부재 시 null */
export function loadWakeTime(): string | null {
  try {
    const raw = localStorage.getItem(WAKE_KEY);
    if (raw === null) return null;
    const v: unknown = JSON.parse(raw);
    if (typeof v === 'string' && parseTime(v) !== null) return v;
    return null;
  } catch {
    return null;
  }
}

export function saveWakeTime(value: string): void {
  try {
    localStorage.setItem(WAKE_KEY, JSON.stringify(value));
  } catch {
    /* 저장 실패는 치명적이지 않음 */
  }
}

/** 수면 기록. 손상된 항목은 조용히 버린다. */
export function loadRecords(): SleepRecord[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (raw === null) return [];
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter(isValidRecord).sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch {
    return [];
  }
}

export function saveRecords(list: SleepRecord[]): void {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(list));
  } catch {
    /* 저장 실패는 치명적이지 않음 */
  }
}
