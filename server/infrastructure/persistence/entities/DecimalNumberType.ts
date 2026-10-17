import { Type } from '@mikro-orm/core';

/** PostgreSQL returns `numeric` as a string; this maps it to a JS number (and back). */
export class DecimalNumberType extends Type<number | null, string | number | null> {
  constructor(private readonly precision = 8, private readonly scale = 2) {
    super();
  }

  convertToJSValue(value: string | number | null): number | null {
    return value === null || value === undefined ? null : Number(value);
  }

  convertToDatabaseValue(value: number | null): string | number | null {
    return value ?? null;
  }

  getColumnType(): string {
    return `numeric(${this.precision},${this.scale})`;
  }
}
