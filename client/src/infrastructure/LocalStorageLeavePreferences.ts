import type { LeavePreferencesStore } from '@/ports/LeavePreferencesStore';

const SETTINGS_KEY = 'planning-atsem-leave-settings';
const PROFILE_KEY = 'planning-atsem-leave-profile';
const APPLIED_PROFILE_KEY = 'planning-atsem-applied-leave-profile';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStorage(): StorageLike | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export class LocalStorageLeavePreferences implements LeavePreferencesStore {
  constructor(private readonly getStorage: () => StorageLike | null = defaultStorage) {}

  readSettings(): unknown {
    try {
      return JSON.parse(this.getStorage()?.getItem(SETTINGS_KEY) || 'null');
    } catch {
      return null;
    }
  }

  readProfile(): string | null {
    return this.read(PROFILE_KEY);
  }

  readAppliedProfile(): string | null {
    return this.read(APPLIED_PROFILE_KEY);
  }

  writeSettings(settings: Record<string, number>): void {
    this.write(SETTINGS_KEY, JSON.stringify(settings));
  }

  writeProfile(profile: string): void {
    this.write(PROFILE_KEY, profile);
  }

  writeAppliedProfile(profile: string): void {
    this.write(APPLIED_PROFILE_KEY, profile);
  }

  private read(key: string): string | null {
    try {
      return this.getStorage()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      this.getStorage()?.setItem(key, value);
    } catch {
      // Keep the app usable if browser storage is unavailable.
    }
  }
}
