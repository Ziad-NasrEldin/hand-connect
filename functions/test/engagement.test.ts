import { describe, expect, it } from 'vitest';
import { isMessageRateLimited } from '../src/engagement.js';

describe('message callable rate limits', () => {
  it('blocks the send that crosses the existing spam threshold', () => {
    expect(isMessageRateLimited(39)).toBe(false);
    expect(isMessageRateLimited(40)).toBe(true);
  });
});
