import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { BannerAd } from './ads/BannerAd';
import { AD_GROUP_ID } from './ads/config';
import { bumpInterstitial } from './ads/interstitial';
import {
  bedtimesForWake,
  formatDuration,
  formatTime,
  napEnd,
  parseTime,
  wakeTimesFromNow,
  type CycleOption,
} from './core/sleep';
import {
  durationOf,
  recentStats,
  removeRecord,
  sleepComment,
  streakOf,
  todayISO,
  upsertRecord,
  weekdayAverages,
  weekdayOf,
  WEEKDAY_LABELS,
  type SleepRecord,
} from './core/records';
import { loadRecords, loadWakeTime, saveRecords, saveWakeTime } from './storage';
import {
  AlarmIcon,
  BedIcon,
  BulbIcon,
  FlameIcon,
  NapIcon,
  NoteIcon,
  SaveIcon,
  TrashIcon,
} from './components/icons';

const TABS = ['어젯밤 기록', '기상 목표', '낮잠', '수면 상식'] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, ReactElement> = {
  '어젯밤 기록': <NoteIcon size={18} />,
  '기상 목표': <AlarmIcon size={18} />,
  낮잠: <NapIcon size={18} />,
  '수면 상식': <BulbIcon size={18} />,
};

const TIPS: { title: string; body: string }[] = [
  {
    title: '수면은 약 90분 사이클로 반복돼요',
    body: '얕은 잠, 깊은 잠, 렘수면이 한 사이클을 이루며 하룻밤에 4~6번 반복돼요. 사이클이 끝나는 시점에 일어나면 상대적으로 개운하게 느끼기 쉬워요.',
  },
  {
    title: '잠드는 데는 평균 10~20분이 걸려요',
    body: '눕자마자 잠들지 않아요. 이 앱은 평균값인 14분을 더해 계산해요. 5분 안에 잠드는 날이 많다면 오히려 수면 부족 신호일 수 있어요.',
  },
  {
    title: '낮잠은 20분 이내가 좋아요',
    body: '20분을 넘겨 깊은 잠에 들어가면 깨어난 뒤 멍한 수면 관성이 생기기 쉬워요. 길게 자야 한다면 한 사이클(90분)을 채우는 편이 나아요.',
  },
  {
    title: '기상 시각을 일정하게 유지하는 게 핵심이에요',
    body: '주말에 몰아 자는 것보다 매일 같은 시각에 일어나는 것이 생체리듬 유지에 효과적이라고 알려져 있어요. 취침 시각보다 기상 시각을 먼저 고정해 보세요.',
  },
  {
    title: '잠들기 전 밝은 화면은 멀리해요',
    body: '밝은 빛은 수면을 유도하는 멜라토닌 분비를 늦출 수 있어요. 취침 1시간 전부터는 조명을 낮추고 화면 사용을 줄이는 것이 도움이 돼요.',
  },
];

function nowMinute(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function nowString(): string {
  return formatTime(nowMinute());
}

/** 하루 중 낮잠을 권할 만한 시간대인지 (11~17시) */
function isNapWindow(min: number): boolean {
  return min >= 11 * 60 && min <= 17 * 60;
}

export function App() {
  const [tab, setTab] = useState<Tab>('어젯밤 기록');
  const [wake, setWake] = useState(() => loadWakeTime() ?? '07:00');
  const [savedWake, setSavedWake] = useState(false);
  const [clock, setClock] = useState(nowString);
  const [records, setRecords] = useState<SleepRecord[]>(loadRecords);

  // 현재 시각 기준 결과가 계속 맞도록 30초마다 갱신
  useEffect(() => {
    const id = setInterval(() => setClock(nowString()), 30_000);
    return () => clearInterval(id);
  }, []);

  const wakeMin = parseTime(wake);
  const nowMin = parseTime(clock) ?? 0;
  const options = useMemo(() => wakeTimesFromNow(nowMin), [nowMin]);
  // 기본 선택은 권장 수면(7시간 30분)에 해당하는 5사이클
  const [cycles, setCycles] = useState(5);
  const selected = options.find((o) => o.cycles === cycles) ?? options[options.length - 1];

  const today = todayISO();
  const streak = streakOf(records, today);
  const week = recentStats(records, today, 7);

  const commit = (next: SleepRecord[]) => {
    setRecords(next);
    saveRecords(next);
  };

  return (
    <div className="app">
      <header className="hdr">
        <span className="hdr-icon">
          <BedIcon />
        </span>
        <div>
          <h1 className="hdr-title">꿀잠 사이클</h1>
          <p className="hdr-sub">90분 수면 사이클로 개운한 기상 시각 찾기</p>
        </div>
      </header>

      {/* 열자마자 보이는 결과 — 지금 자면 몇 시에 일어나면 되는지 */}
      <section className="hero">
        <span className="hero-k">지금 {clock}에 누우면</span>
        <span className="hero-v">{formatTime(selected.time)}</span>
        <span className="hero-sub">
          {selected.cycles}사이클 · {formatDuration(selected.sleepMinutes)} 수면 · 이 시각에 알람을
          맞춰 보세요
        </span>
        <div className="opt-row">
          {options.map((o) => (
            <button
              key={o.cycles}
              className={`opt${o.cycles === selected.cycles ? ' on' : ''}`}
              onClick={() => setCycles(o.cycles)}
              aria-pressed={o.cycles === selected.cycles}
            >
              <span className="opt-t">{formatTime(o.time)}</span>
              <span className="opt-s">{o.cycles}사이클</span>
            </button>
          ))}
        </div>
        <p className="hero-note">잠드는 데 걸리는 평균 14분을 더해 계산했어요.</p>
      </section>

      {streak > 0 && (
        <div className="streak">
          <FlameIcon size={20} />
          <span className="streak-t">
            <strong>{streak}일</strong> 연속 기록 중이에요
          </span>
          {week.count > 0 && (
            <span className="streak-s">최근 7일 평균 {formatDuration(week.avgMinutes)}</span>
          )}
        </div>
      )}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tab${tab === t ? ' on' : ''}`}
            onClick={() => setTab(t)}
          >
            {TAB_ICONS[t]}
            <span>{t}</span>
          </button>
        ))}
      </div>

      {tab === '어젯밤 기록' && (
        <RecordPanel
          records={records}
          today={today}
          defaultWake={wake}
          onCommit={commit}
          weekAvg={week.avgMinutes}
          weekCount={week.count}
        />
      )}

      {tab === '기상 목표' && (
        <section className="panel">
          <label className="field">
            <span className="field-label">몇 시에 일어나야 하나요?</span>
            <div className="time-row">
              <input
                className="field-input time-input"
                type="time"
                value={wake}
                onChange={(e) => {
                  setWake(e.target.value);
                  setSavedWake(false);
                }}
              />
              <button
                className="save-btn"
                onClick={() => {
                  if (parseTime(wake) !== null) {
                    saveWakeTime(wake);
                    setSavedWake(true);
                  }
                }}
              >
                <SaveIcon size={18} />
                <span>{savedWake ? '저장됨' : '내 기상 시각으로 저장'}</span>
              </button>
            </div>
          </label>
          {wakeMin !== null ? (
            <>
              <p className="panel-desc">
                이 시각 중 하나에 잠자리에 들면 사이클이 끝날 때 일어나요. 잠드는 데 걸리는 평균
                14분을 더했어요.
              </p>
              <CycleList options={bedtimesForWake(wakeMin)} highlightCycles={5} nowMinute={nowMin} />
            </>
          ) : (
            <p className="panel-desc">기상 시각을 선택해 주세요.</p>
          )}
        </section>
      )}

      {tab === '낮잠' && (
        <section className="panel">
          <p className="panel-desc">
            지금 <strong>{clock}</strong> 기준, 잠들기 평균 14분을 더한 낮잠 알람 시각이에요.
          </p>
          <ul className="cycle-list">
            {(['power', 'full'] as const).map((kind) => {
              const r = napEnd(nowMin, kind);
              return (
                <li key={kind} className="cycle-item">
                  <span className="cycle-time">{formatTime(r.time)}</span>
                  <span className="cycle-meta">
                    {kind === 'power' ? '파워냅' : '풀사이클'} · {formatDuration(r.napMinutes)} 낮잠
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="panel-desc">
            파워냅(20분)은 개운함, 풀사이클(90분)은 깊은 회복에 좋아요.
            {isNapWindow(nowMin)
              ? ' 지금은 낮잠에 적당한 시간대예요.'
              : ' 지금은 낮잠보다 밤잠을 챙기는 편이 나아요. 오후 늦은 낮잠은 밤잠을 방해할 수 있어요.'}
          </p>
        </section>
      )}

      {tab === '수면 상식' && (
        <section className="tips">
          {TIPS.map((t) => (
            <article key={t.title} className="tip-card">
              <h2 className="tip-title">{t.title}</h2>
              <p className="tip-body">{t.body}</p>
            </article>
          ))}
        </section>
      )}

      <BannerAd adGroupId={AD_GROUP_ID} />

      <p className="disclaimer">
        일반적인 수면 상식과 평균값에 기반한 참고용 정보이며 의학적 조언이 아니에요. 수면 문제가
        지속되면 전문의와 상담하세요. 모든 데이터는 기기 안에만 저장돼요.
      </p>
    </div>
  );
}

/* ---------- 취침 시각 목록 ---------- */

function CycleList({
  options,
  highlightCycles,
  nowMinute: now,
}: {
  options: CycleOption[];
  highlightCycles: number;
  nowMinute: number;
}) {
  return (
    <ul className="cycle-list">
      {options.map((o) => {
        const passed = o.time < now && now - o.time < 6 * 60;
        return (
          <li key={o.cycles} className={`cycle-item${o.cycles === highlightCycles ? ' best' : ''}`}>
            <span className="cycle-time">{formatTime(o.time)}</span>
            <span className="cycle-meta">
              {o.cycles}사이클 · {formatDuration(o.sleepMinutes)} 수면
            </span>
            {o.cycles === highlightCycles && <span className="badge">추천</span>}
            {o.cycles !== highlightCycles && passed && <span className="badge grey">지난 시각</span>}
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- 어젯밤 기록 ---------- */

function RecordPanel({
  records,
  today,
  defaultWake,
  onCommit,
  weekAvg,
  weekCount,
}: {
  records: SleepRecord[];
  today: string;
  defaultWake: string;
  onCommit: (next: SleepRecord[]) => void;
  weekAvg: number;
  weekCount: number;
}) {
  const last = records[0];
  const todayRecord = records.find((r) => r.date === today) ?? null;
  const [bed, setBed] = useState(todayRecord?.bed ?? last?.bed ?? '23:30');
  const [wake, setWake] = useState(todayRecord?.wake ?? defaultWake);

  const bedMin = parseTime(bed);
  const wakeMin = parseTime(wake);
  const preview =
    bedMin !== null && wakeMin !== null ? durationOf({ date: today, bed, wake }) : 0;

  const save = () => {
    if (bedMin === null || wakeMin === null) return;
    onCommit(upsertRecord(records, { date: today, bed, wake }));
    // 기록 저장은 사용자가 한 흐름을 끝낸 시점 — 여기서만 전면광고를 시도한다
    bumpInterstitial(2);
  };

  const pattern = weekdayAverages(records);
  const maxAvg = Math.max(1, ...pattern.map((p) => p.avgMinutes));
  const recent = records.slice(0, 7);

  return (
    <section className="panel">
      <span className="field-label">어젯밤은 어떻게 주무셨나요?</span>
      <div className="rec-row">
        <label className="rec-field">
          <span className="rec-k">잠든 시각</span>
          <input
            className="field-input"
            type="time"
            value={bed}
            onChange={(e) => setBed(e.target.value)}
          />
        </label>
        <label className="rec-field">
          <span className="rec-k">일어난 시각</span>
          <input
            className="field-input"
            type="time"
            value={wake}
            onChange={(e) => setWake(e.target.value)}
          />
        </label>
      </div>
      <div className="rec-save">
        <span className="rec-preview">
          {preview > 0 ? `${formatDuration(preview)} 수면` : '시각을 확인해 주세요'}
        </span>
        <button className="save-btn" onClick={save} disabled={preview <= 0}>
          <SaveIcon size={18} />
          <span>{todayRecord ? '오늘 기록 수정' : '오늘 기록 저장'}</span>
        </button>
      </div>

      {records.length === 0 ? (
        <p className="panel-desc">
          하루만 기록해도 평균이 잡히고, 일주일이 쌓이면 요일별 수면 패턴을 볼 수 있어요.
        </p>
      ) : (
        <>
          <div className="stat-row">
            <div className="stat">
              <span className="stat-k">최근 7일 평균</span>
              <span className="stat-v">{weekCount > 0 ? formatDuration(weekAvg) : '-'}</span>
            </div>
            <div className="stat">
              <span className="stat-k">기록한 밤</span>
              <span className="stat-v">{records.length}일</span>
            </div>
          </div>
          <p className="panel-desc">{sleepComment(weekAvg)}</p>

          <div className="pattern">
            <span className="field-label">요일별 평균 수면</span>
            {pattern.map((p) => (
              <div key={p.weekday} className="bar-row">
                <span className="bar-k">{p.label}</span>
                <span className="bar-track">
                  <span
                    className="bar-fill"
                    style={{ width: `${Math.round((p.avgMinutes / maxAvg) * 100)}%` }}
                  />
                </span>
                <span className="bar-v">
                  {p.count === 0 ? '기록 없음' : formatDuration(p.avgMinutes)}
                </span>
              </div>
            ))}
          </div>

          <div className="pattern">
            <span className="field-label">최근 기록</span>
            <ul className="rec-list">
              {recent.map((r) => {
                const w = weekdayOf(r.date);
                return (
                  <li key={r.date} className="rec-item">
                    <span className="rec-date">
                      {r.date.slice(5).replace('-', '.')}
                      {w >= 0 ? ` (${WEEKDAY_LABELS[w]})` : ''}
                    </span>
                    <span className="rec-time">
                      {r.bed} → {r.wake}
                    </span>
                    <span className="rec-dur">{formatDuration(durationOf(r))}</span>
                    <button
                      className="rec-del"
                      aria-label={`${r.date} 기록 삭제`}
                      onClick={() => onCommit(removeRecord(records, r.date))}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
