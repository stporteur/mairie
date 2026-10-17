import type { ParameterProfile } from '@shared/types/parameters';
import { toLeaveProfiles } from '@/application/toLeaveProfiles';

const atsem: ParameterProfile = {
  id: 1, name: 'ATSEM 37h30', planningTypeId: 2, planningType: 'ATSEM', holidays: 25, rtt: 15,
  atsem: { holidayPeriodOffdays: null, holidayPeriodHours: 35, schoolPeriodOffdays: 'mercredi', schoolPeriodHours: 37 },
  standard: null,
};
const standard: ParameterProfile = {
  id: 3, name: 'MAIRIE 37h30', planningTypeId: 1, planningType: 'STANDARD', holidays: 25, rtt: 15,
  atsem: null, standard: { weekHours: 37.5 },
};

describe('toLeaveProfiles', () => {
  it('maps ATSEM profiles to separate hours and the rest days of each period', () => {
    expect(toLeaveProfiles([atsem])[0]).toEqual({
      key: '1', label: 'ATSEM 37h30', rttDays: '15',
      vacationWeeklyHours: '35', schoolWeeklyHours: '37',
      planning: { type: 'ATSEM', schoolRestDays: [3], vacationRestDays: [] },
    });
  });

  it('reads the vacation rest days too', () => {
    const withVacationRest: ParameterProfile = {
      ...atsem,
      atsem: { ...atsem.atsem!, schoolPeriodOffdays: 'mercredi', holidayPeriodOffdays: 'lundi,vendredi' },
    };
    expect(toLeaveProfiles([withVacationRest])[0].planning).toEqual({
      type: 'ATSEM', schoolRestDays: [3], vacationRestDays: [1, 5],
    });
  });

  it('maps standard profiles to the same hours all year without rest days', () => {
    expect(toLeaveProfiles([standard])[0]).toEqual({
      key: '3', label: 'MAIRIE 37h30', rttDays: '15',
      vacationWeeklyHours: '37.5', schoolWeeklyHours: '37.5',
      planning: { type: 'STANDARD', schoolRestDays: [], vacationRestDays: [] },
    });
  });
});
