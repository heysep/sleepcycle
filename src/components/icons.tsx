/** SVG 라인 아이콘 24px, stroke 1.8 — 이모지 금지 규칙 준수 */
import type { ReactNode } from 'react';

function Icon({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const MoonIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </Icon>
);

export const AlarmIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <circle cx="12" cy="13" r="7" />
    <path d="M12 10v3.2l2.2 1.6" />
    <path d="M4.5 5 7 3M19.5 5 17 3" />
  </Icon>
);

export const NapIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M3 18h18M5 18v-4h14v4M5 14v-3a2 2 0 0 1 2-2h4v5" />
    <path d="M15 4h4l-4 4h4" />
  </Icon>
);

export const BulbIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.6 1.5 2.6h4c0-1 .7-2 1.5-2.6A6 6 0 0 0 12 3Z" />
  </Icon>
);

export const BedIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M4 19v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8" />
    <path d="M4 15h16M8 9V7h8v2" />
  </Icon>
);

export const NoteIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v4h4" />
    <path d="M9.5 12h5m-5 4h5" />
  </Icon>
);

export const FlameIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M12 3s1 2.5-.5 5C10 10.5 8 11 8 14a4 4 0 0 0 8 0c0-1.4-.6-2.4-1.2-3.3-.4.8-.9 1.3-1.6 1.6.6-2.6-.2-6.5-1.2-9.3Z" />
  </Icon>
);

export const TrashIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M4 7h16M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </Icon>
);

export const SaveIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </Icon>
);
