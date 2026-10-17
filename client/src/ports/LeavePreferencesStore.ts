/** Persistence of the user's leave choices; implementations must never throw. */
export interface LeavePreferencesStore {
  readSettings(): unknown;
  readProfile(): string | null;
  readAppliedProfile(): string | null;
  writeSettings(settings: Record<string, number>): void;
  writeProfile(profile: string): void;
  writeAppliedProfile(profile: string): void;
}
