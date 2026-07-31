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

export const SaveIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
    <path d="M17 21v-8H7v8M7 3v5h8" />
  </Icon>
);
