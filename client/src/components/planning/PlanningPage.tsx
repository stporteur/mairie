import type { PlanningPageModel } from '@/hooks/usePlanningPage';
import ExportBar from '../common/ExportBar';
import LeaveSettingsCard from './LeaveSettingsCard';
import MonthCard from './MonthCard';
import MonthlySummaryTable from './MonthlySummaryTable';
import SummaryCard from './SummaryCard';
import VacationCard from './VacationCard';
import WarningsSection from './WarningsSection';

function PlanningPage({ model }: { model: PlanningPageModel }) {
  return (
    <>
      <section className="config-panel">
        <LeaveSettingsCard
          settings={model.settings}
          profile={model.profile}
          error={model.calculationError}
          onProfileChange={model.onProfileChange}
          onSettingChange={model.onSettingChange}
          onSettingBlur={model.onSettingBlur}
          onCalculate={model.onCalculate}
        />
        <VacationCard
          year={model.year}
          vacations={model.vacations}
          source={model.vacationSource}
          onYearChange={model.onYearChange}
          onVacationChange={model.onVacationChange}
        />
      </section>

      <section className="stats-grid">
        <SummaryCard summary={model.summary} />
      </section>

      <WarningsSection summary={model.summary} warnings={model.warnings} expectedLeave={model.expectedLeave} />

      <section className="month-cards">
        {model.monthlyCalendars.map((days, monthIndex) => (
          <MonthCard key={monthIndex} monthIndex={monthIndex} days={days} />
        ))}
      </section>

      <MonthlySummaryTable summaries={model.monthlySummaries} />

      <ExportBar error={model.exportError} exporting={model.exporting} disabled={!model.canExport} onExport={model.onExport} />
    </>
  );
}

export default PlanningPage;
