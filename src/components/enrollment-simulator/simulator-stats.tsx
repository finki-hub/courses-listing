import { useLanguage } from '@/lib/LanguageProvider';

type SimulatorStatsProps = {
  totalCourses: { enrolled: number; passed: number };
  totalCredits: number;
};

export const SimulatorStats = (props: SimulatorStatsProps) => {
  const { t } = useLanguage();
  return (
    <div class="grid grid-cols-3 gap-2 text-sm sm:flex sm:flex-wrap sm:items-center">
      <div class="bg-muted inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-center">
        <span class="text-muted-foreground">{t().simulator.credits}</span>
        <span class="font-bold">{props.totalCredits}</span>
      </div>
      <div class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-enrolled-soft px-2.5 py-1 text-center text-enrolled">
        <span>{t().simulator.attendedPlural}</span>
        <span class="font-bold">{props.totalCourses.enrolled}</span>
      </div>
      <div class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-passed-soft px-2.5 py-1 text-center text-passed">
        <span>{t().simulator.passedPlural}</span>
        <span class="font-bold">{props.totalCourses.passed}</span>
      </div>
    </div>
  );
};
