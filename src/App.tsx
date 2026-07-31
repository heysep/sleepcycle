import { useEffect, useState, type ReactElement } from 'react';
import { BannerAd } from './ads/BannerAd';
import { AD_GROUP_ID } from './ads/config';
import {
  bedtimesForWake,
  formatDuration,
  formatTime,
  napEnd,
  parseTime,
  wakeTimesFromNow,
  type CycleOption,
} from './core/sleep';
import { loadWakeTime, saveWakeTime } from './storage';
import { AlarmIcon, BedIcon, BulbIcon, MoonIcon, NapIcon, SaveIcon } from './components/icons';

const TABS = ['일어날 시각', '지금 잘래', '낮잠', '수면 상식'] as const;
type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, ReactElement> = {
  '일어날 시각': <AlarmIcon size={18} />,
  '지금 잘래': <MoonIcon size={18} />,
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

function CycleList({ options, mode }: { options: CycleOption[]; mode: 'bed' | 'wake' }) {
  const best = mode === 'bed' ? options[0] : options[options.length - 1];
  return (
    <ul className="cycle-list">
      {options.map((o) => (
        <li key={o.cycles} className={`cycle-item${o === best ? ' best' : ''}`}>
          <span className="cycle-time">{formatTime(o.time)}</span>
          <span className="cycle-meta">
            {o.cycles}사이클 · {formatDuration(o.sleepMinutes)} 수면
          </span>
          {o === best && <span className="badge">추천</span>}
        </li>
      ))}
    </ul>
  );
}

export function App() {
  const [tab, setTab] = useState<Tab>('일어날 시각');
  const [wake, setWake] = useState(() => loadWakeTime() ?? '07:00');
  const [saved, setSaved] = useState(false);
  const [clock, setClock] = useState(nowString);

  // '지금 잘래'/'낮잠' 탭의 현재 시각을 1분마다 갱신
  useEffect(() => {
    const id = setInterval(() => setClock(nowString()), 30_000);
    return () => clearInterval(id);
  }, []);

  const wakeMin = parseTime(wake);
  const nowMin = parseTime(clock) ?? 0;

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

      {tab === '일어날 시각' && (
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
                  setSaved(false);
                }}
              />
              <button
                className="save-btn"
                onClick={() => {
                  if (parseTime(wake) !== null) {
                    saveWakeTime(wake);
                    setSaved(true);
                  }
                }}
              >
                <SaveIcon size={18} />
                <span>{saved ? '저장됨' : '내 기상 시각으로 저장'}</span>
              </button>
            </div>
          </label>
          {wakeMin !== null ? (
            <>
              <p className="panel-desc">이 시각 중 하나에 잠자리에 들면 사이클이 끝날 때 일어나요. 잠드는 데 걸리는 평균 14분을 더했어요.</p>
              <CycleList options={bedtimesForWake(wakeMin)} mode="bed" />
            </>
          ) : (
            <p className="panel-desc">기상 시각을 선택해 주세요.</p>
          )}
        </section>
      )}

      {tab === '지금 잘래' && (
        <section className="panel">
          <p className="panel-desc">
            지금 <strong>{clock}</strong>에 잠자리에 들면(잠들기 평균 14분 포함) 이 시각에 알람을 맞추는 게 좋아요.
          </p>
          <CycleList options={wakeTimesFromNow(nowMin)} mode="wake" />
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
          <p className="panel-desc">파워냅(20분)은 개운함, 풀사이클(90분)은 깊은 회복에 좋아요. 오후 늦은 낮잠은 밤잠을 방해할 수 있어요.</p>
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
        일반적인 수면 상식과 평균값에 기반한 참고용 정보이며 의학적 조언이 아니에요. 수면 문제가 지속되면 전문의와 상담하세요. 모든 데이터는 기기 안에만 저장돼요.
      </p>
    </div>
  );
}
