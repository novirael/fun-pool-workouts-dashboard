import { badgeNeed, type Badge } from '@/lib/domain/badges';
import type { Member } from '@/lib/domain/types';
import type { I18n } from '@/lib/i18n/context';

/** "12.5 km in total", "4 weeks in a row"… for a member's personal goals. */
export function badgeDesc(i: I18n, b: Badge, m: Member): string {
  const n = badgeNeed(b, m), d = i.t.badges.desc;
  switch (b.k) {
    case 'dist': return d.dist(i.dist(n));
    case 'best': return d.best(i.dist(n));
    case 'count': return d.count(n);
    case 'streak': return d.streak(n);
    case 'seasons': return d.seasons;
    case 'months': return d.months;
  }
}
