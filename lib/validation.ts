import { z } from 'zod';
import { AVATARS } from './domain/avatars';
import { addDays, isIsoDate, todayIn } from './domain/dates';
import { LIMITS } from './domain/members';
import { COLORS } from './domain/palette';

// Shared by the API (authoritative) and the forms (early feedback).

export const FAMILY_TZ = 'Europe/Warsaw';
export const MIN_DATE = '2020-01-01';

const isoDate = z.string().refine(isIsoDate, { message: 'invalid_date' });

/** A training day: not before MIN_DATE and not in the future (one day of slack for time zones). */
export const swimDate = isoDate.refine((d) => d >= MIN_DATE && d <= addDays(todayIn(FAMILY_TZ), 1), { message: 'date_out_of_range' });

const ascending = (xs: number[]) => xs.every((x, i) => i === 0 || x > xs[i - 1]!);

export const memberFields = z.object({
  name: z.string().trim().min(1, 'name_required').max(LIMITS.name),
  subtitle: z.string().trim().max(LIMITS.subtitle),
  role: z.enum(['parent', 'child']),
  swims: z.boolean(),
  color: z.enum(COLORS),
  avatar: z.enum(AVATARS),
  defaultLengths: z.int().min(1).max(LIMITS.lengths),
  monthlyPaceM: z.int().min(LIMITS.pace[0]).max(LIMITS.pace[1]),
  recordGoalsM: z
    .array(z.int().min(LIMITS.record[0]).max(LIMITS.record[1]))
    .length(4)
    .refine(ascending, { message: 'records_not_ascending' }),
});
export type MemberInput = z.infer<typeof memberFields>;

export const memberPatch = memberFields
  .partial()
  .extend({ archived: z.boolean().optional() })
  .refine((p) => Object.keys(p).length > 0, { message: 'empty_patch' });
export type MemberPatch = z.infer<typeof memberPatch>;

export const sessionInput = z.object({
  id: z.uuid(),
  swimmerId: z.uuid(),
  date: swimDate,
  lengths: z.int().min(1).max(LIMITS.lengths),
  pool: z.union([z.literal(15), z.literal(25)]),
});
export type SessionInput = z.infer<typeof sessionInput>;

export const sessionsCreate = z.object({
  sessions: z
    .array(sessionInput)
    .min(1)
    .max(LIMITS.activeSwimmers)
    .refine((xs) => new Set(xs.map((x) => x.swimmerId)).size === xs.length, { message: 'duplicate_swimmer' })
    .refine((xs) => new Set(xs.map((x) => x.id)).size === xs.length, { message: 'duplicate_id' }),
});

export const awardPut = z.object({ givenOn: isoDate });

export const passwordInput = z.object({ password: z.string().min(1).max(200) });
