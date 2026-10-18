'use client';

import { wheelSegments } from '@/lib/domain/prizes';
import type { Prize } from '@/lib/domain/types';

const COLORS = [
  ['#E39400', '#2B1B00'],
  ['#0E9A63', '#FFFFFF'],
  ['#2C62D4', '#FFFFFF'],
  ['#7B4FD0', '#FFFFFF'],
  ['#D0417A', '#FFFFFF'],
  ['#0B8794', '#FFFFFF'],
];
const R = 96;
const at = (deg: number, r = R) => {
  const a = (deg * Math.PI) / 180;
  return `${(r * Math.sin(a)).toFixed(2)} ${(-r * Math.cos(a)).toFixed(2)}`;
};
const short = (s: string) => (s.length > 16 ? `${s.slice(0, 15)}…` : s);

interface Props {
  prizes: Prize[];
  /** Clockwise rotation in degrees; changing it animates when `durationMs` > 0. */
  rotation: number;
  durationMs: number;
  onStop?: () => void;
}

/** Slices sized by chance, labels along the radius, pointer at the top. */
export default function Wheel({ prizes, rotation, durationMs, onStop }: Props) {
  const segs = wheelSegments(prizes);
  return (
    <div className="wheel">
      <svg viewBox="-110 -110 220 220" role="img" aria-hidden="true">
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformBox: 'view-box',
            transformOrigin: '0px 0px',
            transition: durationMs ? `transform ${durationMs}ms cubic-bezier(0.15, 0.7, 0.1, 1)` : 'none',
          }}
          onTransitionEnd={onStop}
        >
          {segs.map((s, i) => {
            const [fill, ink] = COLORS[i % COLORS.length]!;
            const span = s.end - s.start;
            return (
              <g key={s.prize.id}>
                {segs.length === 1 ? (
                  <circle r={R} fill={fill} />
                ) : (
                  <path d={`M0 0 L${at(s.start)} A${R} ${R} 0 ${span > 180 ? 1 : 0} 1 ${at(s.end)} Z`} fill={fill} stroke="#fff" strokeWidth="1.5" />
                )}
                {span >= 14 && (
                  <g transform={`rotate(${s.mid})`}>
                    {/* Where the wheel comes to rest, labels on the left half read inward so none is upside down. */}
                    <text x="0" y="-56" transform={`rotate(${(((s.mid + rotation) % 360) + 360) % 360 > 180 ? 90 : -90} 0 -56)`} textAnchor="middle" dominantBaseline="central" fontSize="9.5" fontWeight="700" fill={ink}>
                      {short(s.prize.name)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
        <circle r={R + 2} fill="none" stroke="#fff" strokeWidth="4" />
        <circle r="17" fill="#fff" stroke="#CFE1EA" strokeWidth="2" />
        <text textAnchor="middle" dominantBaseline="central" fontSize="16">
          🎁
        </text>
        <path d="M0 -84 L-10 -106 L10 -106 Z" fill="#E5484D" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
