import { describe, expect, it } from 'vitest';
import { requestWithoutQuery } from '../src/lib/logger.ts';

describe('request log serializer', () => {
  it('keeps the path but drops the query string (search terms are user content)', () => {
    const logged = requestWithoutQuery({
      id: 'r1',
      method: 'GET',
      url: '/api/v1/search?q=my%20secret%20plans&nature=knowledge',
      query: { q: 'my secret plans', nature: 'knowledge' },
      headers: { 'user-agent': 'test', referer: 'https://niwa.test/search?q=my%20secret%20plans' },
      remoteAddress: '203.0.113.5',
    });
    expect(logged).toEqual({
      id: 'r1',
      method: 'GET',
      url: '/api/v1/search',
      headers: { 'user-agent': 'test', referer: 'https://niwa.test/search' },
      remoteAddress: '203.0.113.5',
    });
    expect(JSON.stringify(logged)).not.toContain('secret');
  });
});
