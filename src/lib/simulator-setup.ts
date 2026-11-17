import {
  GRADUATION_CREDITS_3YR,
  GRADUATION_CREDITS_4YR,
  LEVEL_CREDIT_LIMITS,
} from '@/lib/simulator';

/** Set once the student has chosen their accreditation and program. */
export const STORAGE_KEY_SETUP = 'enrollment-setup-done';

// Saved statuses per accreditation; an empty object means nothing was marked.
const STATUS_KEYS = ['enrollment-2018', 'enrollment-2023'] as const;

/**
 * Whether to ask for the accreditation and program first: only on a first
 * visit. Not for a shared link, not once setup was completed, not for someone
 * with saved statuses from before setup existed, and not when nothing can be
 * stored (the setup would otherwise return on every visit).
 *
 * @param context - What the visit brings along
 * @param context.hasShareLink - Whether the URL carries a shared state
 * @param context.read - Reads a stored value, null when missing
 * @param context.storageAvailable - Whether values can be stored at all
 * @returns Whether to show the setup step
 */
export const needsSimulatorSetup = (context: {
  hasShareLink: boolean;
  read: (key: string) => null | string;
  storageAvailable: boolean;
}): boolean => {
  if (
    !context.storageAvailable ||
    context.hasShareLink ||
    context.read(STORAGE_KEY_SETUP) !== null
  )
    return false;
  return STATUS_KEYS.every((key) => {
    const stored = context.read(key);
    return stored === null || stored === '{}';
  });
};

export type LevelMeter = { credits: number; level: number; limit: number };

export type SimulatorProgress = {
  credits: number;
  levels: LevelMeter[];
  /** Where the 3-year total sits on the bar toward the 4-year total, 0 to 100. */
  threeYearMark: number;
};

/**
 * A value as a share of a maximum, clamped to 0 to 100.
 *
 * @param value - The amount to express, such as earned credits
 * @param max - The maximum; zero or less gives 0
 * @returns The percentage
 */
export const toPercent = (value: number, max: number): number =>
  max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));

/**
 * The numbers behind the progress header: credits on a bar toward the 4-year
 * total with the 3-year total marked, and the elective level meters.
 *
 * @param credits - Counted credits
 * @param creditsPerLevel - Passed elective credits per level
 * @returns The progress summary
 */
export const getSimulatorProgress = (
  credits: number,
  creditsPerLevel: Record<number, number>,
): SimulatorProgress => ({
  credits,
  levels: Object.entries(LEVEL_CREDIT_LIMITS).map(([level, limit]) => ({
    credits: creditsPerLevel[Number(level)] ?? 0,
    level: Number(level),
    limit,
  })),
  threeYearMark: toPercent(GRADUATION_CREDITS_3YR, GRADUATION_CREDITS_4YR),
});
