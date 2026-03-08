import { type ProgramStateKind } from '@/lib/simulator';

const REQUIRED_BADGE_CLASS =
  'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25';

export const PROGRAM_STATE_BADGE_CLASSES: Record<ProgramStateKind, string> = {
  elective:
    'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
  'faculty-list':
    'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/25',
  required: REQUIRED_BADGE_CLASS,
  'required-4yr': REQUIRED_BADGE_CLASS,
};

export const getStatusClass = (status: {
  atLimit: boolean;
  listened: boolean;
  overLimit: boolean;
  passed: boolean;
}): string => {
  if (status.overLimit) return 'bg-red-500/10 border-l-red-500';
  if (status.passed) return 'bg-green-500/10 border-l-green-500';
  if (status.listened) return 'bg-blue-500/10 border-l-blue-500';
  if (status.atLimit) return 'bg-orange-500/10 border-l-orange-400';
  return 'border-l-transparent';
};
