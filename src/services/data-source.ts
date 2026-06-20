export const DATA_SOURCE_VALUES = ['demo', 'firebase'] as const;

export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

const DATA_SOURCE_ENV_KEY = 'VITE_HAND_CONNECT_DATA_SOURCE';

function normalizeDataSource(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isDataSource(value: string): value is DataSource {
  return DATA_SOURCE_VALUES.includes(value as DataSource);
}

export function getDataSource(): DataSource {
  const rawValue = normalizeDataSource(
    import.meta.env.VITE_HAND_CONNECT_DATA_SOURCE,
  );

  if (!rawValue) {
    if (import.meta.env.PROD) {
      throw new Error(
        `${DATA_SOURCE_ENV_KEY} must be set to "demo" or "firebase" for production builds.`,
      );
    }

    return 'demo';
  }

  if (!isDataSource(rawValue)) {
    throw new Error(
      `${DATA_SOURCE_ENV_KEY} must be one of: ${DATA_SOURCE_VALUES.join(', ')}.`,
    );
  }

  return rawValue;
}

export function isDemoDataSource() {
  return getDataSource() === 'demo';
}

export function isFirebaseDataSource() {
  return getDataSource() === 'firebase';
}

export function assertFirebaseDataSourceReady(hasFirebaseConfig: boolean) {
  if (isFirebaseDataSource() && !hasFirebaseConfig) {
    throw new Error(
      'Firebase data source selected, but required Firebase environment configuration is missing.',
    );
  }
}
