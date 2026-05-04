import { describe, expect, it } from 'vitest';
import ar from './locales/ar.json';
import en from './locales/en.json';

describe('i18n locale files', () => {
  it('keeps Arabic and English translation keys in sync', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ar).sort());
  });
});
