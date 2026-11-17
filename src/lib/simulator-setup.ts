import {
  GRADUATION_CREDITS_3YR,
  GRADUATION_CREDITS_4YR,
  LEVEL_CREDIT_LIMITS,
  STORAGE_KEY_ACC,
  STORAGE_KEY_PROGRAM,
} from '@/lib/simulator';

/** Set once the student has chosen their accreditation and program. */
export const STORAGE_KEY_SETUP = 'enrollment-setup-done';

// Keys that only exist after someone has used the simulator before.
const PREVIOUS_USE_KEYS = [
  STORAGE_KEY_SETUP,
  STORAGE_KEY_ACC,
  STORAGE_KEY_PROGRAM,
  'enrollment-2018',
  'enrollment-2023',
] as const;

/**
 * Whether to ask for the accreditation and program first: only on a first
 * visit, never for a shared link or for someone with saved simulator state.
 *
 * @param context - What the visit brings along
 * @param context.hasShareLink - Whether the URL carries a shared state
 * @param context.read - Reads a stored value, null when missing
 * @returns Whether to show the setup step
 */
export const needsSimulatorSetup = (context: {
  hasShareLink: boolean;
  read: (key: string) => null | string;
}): boolean =>
  !context.hasShareLink &&
  PREVIOUS_USE_KEYS.every((key) => context.read(key) === null);

export type LevelMeter = { credits: number; level: number; limit: number };

export type SimulatorProgress = {
  credits: number;
  levels: LevelMeter[];
  /** Share of the 4-year total, 0 to 100, for one bar with two markers. */
  percent: number;
  /** Where the 3-year total sits on that bar, 0 to 100. */
  threeYearMark: number;
};

const toPercent = (value: number, max: number) =>
  Math.min(100, Math.max(0, (value / max) * 100));

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
  percent: toPercent(credits, GRADUATION_CREDITS_4YR),
  threeYearMark: toPercent(GRADUATION_CREDITS_3YR, GRADUATION_CREDITS_4YR),
});
