import { Timestamp } from 'firebase/firestore';

export type TimestampLike = Timestamp | Date | string | number | null | undefined;

export function toFirestoreTimestamp(value: TimestampLike) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (typeof value === 'number') return Timestamp.fromMillis(value);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp value: ${value}`);
  }
  return Timestamp.fromDate(date);
}

export function toIsoString(value: TimestampLike) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp value: ${value}`);
  }
  return date.toISOString();
}

export function isoOrNull(value: TimestampLike) {
  return toIsoString(value);
}

export function isoOrThrow(value: TimestampLike, fieldName: string) {
  const iso = toIsoString(value);
  if (!iso) throw new Error(`Missing required timestamp field: ${fieldName}`);
  return iso;
}

export function convertIsoFieldsToTimestamps<T extends Record<string, unknown>>(
  data: T,
  fields: readonly (keyof T)[],
) {
  const output: Record<string, unknown> = { ...data };
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
    const value = data[field];
    output[String(field)] = toFirestoreTimestamp(value as TimestampLike);
  }
  return output;
}

export function convertTimestampFieldsToIso<T extends Record<string, unknown>>(
  data: T,
  fields: readonly (keyof T)[],
) {
  const output: Record<string, unknown> = { ...data };
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
    const value = data[field];
    output[String(field)] = toIsoString(value as TimestampLike);
  }
  return output;
}
