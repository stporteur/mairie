import type { ForecastSummaryRow } from '@shared/types/forecast';
import type { LeaveProfile } from '@/domain/settings/types';
import { describeProfileLeave } from '@/presentation/profileDescription';

interface ForecastComparisonTableProps {
  startYear: number;
  yearCount: number;
  cpDays: string;
  profiles: readonly LeaveProfile[];
  results: Record<string, ForecastSummaryRow[]>;
}

function ForecastComparisonTable({ startYear, yearCount, cpDays, profiles, results }: ForecastComparisonTableProps) {
  const years = Array.from({ length: yearCount }, (_, offset) => startYear + offset);

  return (
    <section className="planning-table forecast-table-section comparison-table">
      <h2>Comparatif {startYear}–{startYear + yearCount - 1}</h2>
      <table>
        <thead>
          <tr>
            <th rowSpan={2}>Année</th>
            {profiles.map((profile) => (
              <th key={profile.key} colSpan={2} className="profile-group-start">
                <strong>{profile.label}</strong>
                <br />
                <small>{describeProfileLeave(profile, cpDays)}</small>
              </th>
            ))}
          </tr>
          <tr>
            {profiles.map((profile) => (
              <ComparisonSubHeaders key={profile.key} />
            ))}
          </tr>
        </thead>
        <tbody>
          {years.map((year) => (
            <tr key={year}>
              <td>{year}</td>
              {profiles.map((profile) => {
                const row = results[profile.key]?.find((item) => item.year === year);
                return (
                  <ComparisonCells key={profile.key} row={row} />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ComparisonSubHeaders() {
  return (
    <>
      <th className="profile-group-start">Total Heures</th>
      <th>Heures Dues</th>
    </>
  );
}

function ComparisonCells({ row }: { row: ForecastSummaryRow | undefined }) {
  return (
    <>
      <td className="profile-group-start">{row ? row.workHours.toFixed(2) : ''}</td>
      <td>{row ? row.hoursDue.toFixed(2) : ''}</td>
    </>
  );
}

export default ForecastComparisonTable;
