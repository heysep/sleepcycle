import { STORAGE_PREFIX } from './config';
import { parseTime } from './core/sleep';

const WAKE_KEY = `${STORAGE_PREFIX}wakeTime`;

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
