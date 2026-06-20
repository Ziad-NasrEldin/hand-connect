import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assertFirebaseDataSourceReady,
  getDataSource,
  isDataSource,
} from './data-source';

describe('data-source config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts explicit demo and firebase data sources', () => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'demo');
    expect(getDataSource()).toBe('demo');

    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'firebase');
    expect(getDataSource()).toBe('firebase');
  });

  it('normalizes data source values', () => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', ' Firebase ');
    expect(getDataSource()).toBe('firebase');
  });

  it('rejects invalid data source values', () => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'localStorage');
    expect(() => getDataSource()).toThrow(
      'VITE_HAND_CONNECT_DATA_SOURCE must be one of: demo, firebase.',
    );
  });

  it('defaults to demo outside production only', () => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', '');
    vi.stubEnv('PROD', false);
    expect(getDataSource()).toBe('demo');
  });

  it('requires explicit data source in production', () => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', '');
    vi.stubEnv('PROD', true);
    expect(() => getDataSource()).toThrow(
      'VITE_HAND_CONNECT_DATA_SOURCE must be set to "demo" or "firebase" for production builds.',
    );
  });

  it('requires Firebase config when Firebase data source is selected', () => {
    vi.stubEnv('VITE_HAND_CONNECT_DATA_SOURCE', 'firebase');
    expect(() => assertFirebaseDataSourceReady(false)).toThrow(
      'Firebase data source selected, but required Firebase environment configuration is missing.',
    );
    expect(() => assertFirebaseDataSourceReady(true)).not.toThrow();
  });

  it('exposes a type guard', () => {
    expect(isDataSource('demo')).toBe(true);
    expect(isDataSource('firebase')).toBe(true);
    expect(isDataSource('localStorage')).toBe(false);
  });
});
