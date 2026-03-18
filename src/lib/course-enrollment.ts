import {
  ACADEMIC_YEARS,
  type AcademicYear,
  type CourseRaw,
  getEnrollmentForYear,
} from '@/types/course';

export type EnrollmentDirection = 'down' | 'flat' | 'none' | 'up';

export type EnrollmentEntry = {
  barWidth: number;
  delta: null | number;
  deltaPercent: null | number;
  direction: EnrollmentDirection;
  enrollment: number;
  isLowest: boolean;
  isPeak: boolean;
  opacity: number;
  previousEnrollment: null | number;
  year: AcademicYear;
};

export type EnrollmentMetrics = {
  averageEnrollment: null | number;
  entries: EnrollmentEntry[];
  latestEntry: EnrollmentEntry | null;
  lowestEntry: EnrollmentEntry | null;
  peakEntry: EnrollmentEntry | null;
  range: EnrollmentRange;
  sparkline: EnrollmentSparkline | null;
  trend: EnrollmentTrend;
};

export type EnrollmentRange = {
  max: number;
  min: number;
};

export type EnrollmentSparkline = {
  path: string;
  points: EnrollmentSparklinePoint[];
};

export type EnrollmentSparklinePoint = {
  enrollment: number;
  x: number;
  y: number;
  year: AcademicYear;
};

export type EnrollmentTrend = {
  className: string;
  delta: null | number;
  direction: EnrollmentDirection;
  label: string;
  percent: null | number;
  periodLabel: string;
};

type BaseEnrollmentEntry = {
  enrollment: number;
  year: AcademicYear;
};

const getBaseEntries = (course: CourseRaw): BaseEnrollmentEntry[] =>
  ACADEMIC_YEARS.map((year) => ({
    enrollment: getEnrollmentForYear(course, year),
    year,
  })).filter((entry) => entry.enrollment > 0);

const getRange = (entries: BaseEnrollmentEntry[]): EnrollmentRange => {
  if (entries.length === 0) {
    return { max: 0, min: 0 };
  }

  const values = entries.map((entry) => entry.enrollment);
  return {
    max: Math.max(...values),
    min: Math.min(...values),
  };
};

const getScale = (enrollment: number, range: EnrollmentRange) => {
  if (enrollment <= 0) return 0;
  if (range.max === range.min) return 0.6;
  return (enrollment - range.min) / (range.max - range.min);
};

const getOpacity = (enrollment: number, range: EnrollmentRange) => {
  const min = 0.3;
  const max = 1;
  return min + getScale(enrollment, range) * (max - min);
};

const getBarWidth = (enrollment: number, range: EnrollmentRange) => {
  if (enrollment <= 0) return 0;
  return 18 + getScale(enrollment, range) * 82;
};

const getPeakYear = (entries: BaseEnrollmentEntry[]): AcademicYear | null => {
  if (entries.length === 0) return null;

  let peak = entries[0];
  if (!peak) return null;

  for (const entry of entries) {
    if (entry.enrollment > peak.enrollment) {
      peak = entry;
    }
  }

  return peak.year;
};

const getLowestYear = (entries: BaseEnrollmentEntry[]): AcademicYear | null => {
  if (entries.length === 0) return null;

  let lowest = entries[0];
  if (!lowest) return null;

  for (const entry of entries) {
    if (entry.enrollment < lowest.enrollment) {
      lowest = entry;
    }
  }

  return lowest.year;
};

const getDirection = (
  enrollment: number,
  previousEnrollment: null | number,
): EnrollmentDirection => {
  if (previousEnrollment === null) return 'none';
  if (enrollment > previousEnrollment) return 'up';
  if (enrollment < previousEnrollment) return 'down';
  return 'flat';
};

const getTrend = (entries: EnrollmentEntry[]): EnrollmentTrend => {
  const latest = entries[0];
  const previous = entries[1];

  if (!latest || !previous) {
    return {
      className: 'bg-muted text-muted-foreground',
      delta: null,
      direction: 'none',
      label: 'Нема споредба',
      percent: null,
      periodLabel: 'Недоволно податоци',
    };
  }

  const delta = latest.enrollment - previous.enrollment;
  const percent = delta / previous.enrollment;

  if (delta === 0 || Math.abs(percent) < 0.05) {
    return {
      className: 'bg-muted text-muted-foreground',
      delta,
      direction: 'flat',
      label: 'Стабилно',
      percent,
      periodLabel: `${latest.year} vs ${previous.year}`,
    };
  }

  return {
    className:
      delta > 0
        ? 'bg-green-500/10 text-green-700 dark:text-green-400'
        : 'bg-red-500/10 text-red-700 dark:text-red-400',
    delta,
    direction: delta > 0 ? 'up' : 'down',
    label: delta > 0 ? 'Расте' : 'Опаѓа',
    percent,
    periodLabel: `${latest.year} vs ${previous.year}`,
  };
};

const getSparkline = (
  entries: BaseEnrollmentEntry[],
  range: EnrollmentRange,
): EnrollmentSparkline | null => {
  if (entries.length === 0) return null;

  const orderedEntries = entries.toReversed();
  const height = 36;
  const width = 120;
  const padding = 4;
  const points = orderedEntries.map((entry, index) => {
    const x =
      orderedEntries.length === 1
        ? width / 2
        : padding +
          (index / (orderedEntries.length - 1)) * (width - padding * 2);
    const y =
      range.max === range.min
        ? height / 2
        : height -
          padding -
          ((entry.enrollment - range.min) / (range.max - range.min)) *
            (height - padding * 2);

    return { ...entry, x, y };
  });

  return {
    path: points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' '),
    points,
  };
};

export const buildEnrollmentMetrics = (
  course: CourseRaw,
): EnrollmentMetrics => {
  const baseEntries = getBaseEntries(course);
  const range = getRange(baseEntries);
  const peakYear = getPeakYear(baseEntries);
  const lowestYear = getLowestYear(baseEntries);

  const entries = baseEntries.map((entry, index) => {
    const previousEnrollment = baseEntries[index + 1]?.enrollment ?? null;
    const delta =
      previousEnrollment === null
        ? null
        : entry.enrollment - previousEnrollment;
    const deltaPercent =
      previousEnrollment === null || delta === null
        ? null
        : delta / previousEnrollment;

    return {
      barWidth: getBarWidth(entry.enrollment, range),
      delta,
      deltaPercent,
      direction: getDirection(entry.enrollment, previousEnrollment),
      enrollment: entry.enrollment,
      isLowest: entry.year === lowestYear,
      isPeak: entry.year === peakYear,
      opacity: getOpacity(entry.enrollment, range),
      previousEnrollment,
      year: entry.year,
    } satisfies EnrollmentEntry;
  });

  const latestEntry = entries[0] ?? null;
  const peakEntry = entries.find((entry) => entry.isPeak) ?? null;
  const lowestEntry = entries.find((entry) => entry.isLowest) ?? null;
  let totalEnrollment = 0;
  for (const entry of entries) {
    totalEnrollment += entry.enrollment;
  }

  const averageEnrollment =
    entries.length === 0 ? null : Math.round(totalEnrollment / entries.length);

  return {
    averageEnrollment,
    entries,
    latestEntry,
    lowestEntry,
    peakEntry,
    range,
    sparkline: getSparkline(baseEntries, range),
    trend: getTrend(entries),
  };
};

export const getEnrollmentDeltaClass = (delta: null | number) => {
  if (delta === null) return 'bg-muted text-muted-foreground';
  if (delta > 0) return 'bg-green-500/10 text-green-700 dark:text-green-400';
  if (delta < 0) return 'bg-red-500/10 text-red-700 dark:text-red-400';
  return 'bg-muted text-muted-foreground';
};

export const formatEnrollmentDelta = (delta: null | number) => {
  if (delta === null) return '—';
  if (delta === 0) return '0';
  return delta > 0 ? `+${delta}` : String(delta);
};

export const formatEnrollmentDeltaPercent = (percent: null | number) => {
  if (percent === null) return '—';

  const rounded = Math.round(percent * 100);
  if (rounded === 0) return '0%';
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
};

export const formatEnrollmentValue = (value: null | number) =>
  value === null ? '—' : String(value);
