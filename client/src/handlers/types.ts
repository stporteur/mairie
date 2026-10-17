/** Minimal shape of a React state setter, so handlers do not depend on React. */
export type StateSetter<T> = (value: T | ((current: T) => T)) => void;
