import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import {
  convertIsoFieldsToTimestamps,
  convertTimestampFieldsToIso,
  isoOrThrow,
  toFirestoreTimestamp,
  toIsoString,
} from './timestamps';

describe('Firestore timestamp helpers', () => {
  it('converts ISO strings, dates, numbers, and Firestore timestamps to ISO strings', () => {
    const iso = '2026-06-19T00:00:00.000Z';
    const date = new Date(iso);
    const timestamp = Timestamp.fromDate(date);

    expect(toIsoString(iso)).toBe(iso);
    expect(toIsoString(date)).toBe(iso);
    expect(toIsoString(date.getTime())).toBe(iso);
    expect(toIsoString(timestamp)).toBe(iso);
  });

  it('converts ISO strings to Firestore timestamps', () => {
    const timestamp = toFirestoreTimestamp('2026-06-19T00:00:00.000Z');

    expect(timestamp).toBeInstanceOf(Timestamp);
    expect(timestamp?.toDate().toISOString()).toBe('2026-06-19T00:00:00.000Z');
  });

  it('converts named fields both ways', () => {
    const source = {
      id: 'provider-1',
      createdAt: '2026-06-19T00:00:00.000Z',
      approvedAt: null,
    };

    const firestoreData = convertIsoFieldsToTimestamps(source, ['createdAt', 'approvedAt']);
    expect(firestoreData.createdAt).toBeInstanceOf(Timestamp);
    expect(firestoreData.approvedAt).toBeNull();

    const appData = convertTimestampFieldsToIso(firestoreData, ['createdAt', 'approvedAt']);
    expect(appData.createdAt).toBe(source.createdAt);
    expect(appData.approvedAt).toBeNull();
  });

  it('throws for missing required timestamp fields', () => {
    expect(() => isoOrThrow(null, 'createdAt')).toThrow('Missing required timestamp field: createdAt');
  });
});
