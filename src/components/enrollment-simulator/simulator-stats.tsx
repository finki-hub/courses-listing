type SimulatorStatsProps = {
  totalCourses: { enrolled: number; passed: number };
  totalCredits: number;
};

export const SimulatorStats = (props: SimulatorStatsProps) => (
  <div class="grid grid-cols-3 gap-2 text-sm sm:flex sm:flex-wrap sm:items-center">
    <div class="bg-muted inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-center">
      <span class="text-muted-foreground">Кредити</span>
      <span class="font-bold">{props.totalCredits}</span>
    </div>
    <div class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-blue-500/10 px-2.5 py-1 text-center text-blue-700 dark:text-blue-400">
      <span class="opacity-80">Слушани</span>
      <span class="font-bold">{props.totalCourses.enrolled}</span>
    </div>
    <div class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-green-500/10 px-2.5 py-1 text-center text-green-700 dark:text-green-400">
      <span class="opacity-80">Положени</span>
      <span class="font-bold">{props.totalCourses.passed}</span>
    </div>
  </div>
);
