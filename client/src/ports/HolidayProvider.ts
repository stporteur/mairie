export interface HolidayProvider {
  getHolidays(year: number): ReadonlySet<string>;
}
