import { describe, expect, it } from 'vitest';
import { generateOpenApiDocument } from './openapi.ts';
import {
  CreateItemInput,
  CreateScheduleEntryInput,
  DateOnly,
  TagList,
  isValidTag,
  natureOf,
  normalizeTag,
} from './index.ts';

describe('natureOf', () => {
  it('derives nature from type', () => {
    expect(natureOf('project')).toBe('actionable');
    expect(natureOf('task')).toBe('actionable');
    expect(natureOf('note')).toBe('knowledge');
    expect(natureOf('idea')).toBe('knowledge');
  });
});

describe('tags', () => {
  it('normalizes whitespace and case', () => {
    expect(normalizeTag('  Network  Security ')).toBe('network-security');
  });
  it('accepts unicode and hierarchy, rejects junk', () => {
    expect(isValidTag('庭')).toBe(true);
    expect(isValidTag('college/cs301')).toBe(true);
    expect(isValidTag('bad!tag')).toBe(false);
    expect(isValidTag('x'.repeat(41))).toBe(false);
  });
  it('dedupes after normalization', () => {
    expect(TagList.parse(['BGP', 'bgp ', 'tcp'])).toEqual(['bgp', 'tcp']);
  });
});

describe('DateOnly', () => {
  it('accepts real days only', () => {
    expect(DateOnly.safeParse('2026-02-28').success).toBe(true);
    expect(DateOnly.safeParse('2026-02-30').success).toBe(false);
    expect(DateOnly.safeParse('2026-2-1').success).toBe(false);
  });
});

describe('inputs', () => {
  it('CreateItemInput defaults type to note', () => {
    expect(CreateItemInput.parse({ parentId: null, title: 'Hello' }).type).toBe('note');
  });
  it('schedule block requires itemId; event forbids it', () => {
    const base = { startAt: '2026-11-03T09:00:00Z', endAt: '2026-11-03T10:00:00Z' };
    expect(CreateScheduleEntryInput.safeParse({ ...base, kind: 'block' }).success).toBe(false);
    expect(CreateScheduleEntryInput.safeParse({ ...base, kind: 'event', title: 'Dentist' }).success).toBe(
      true,
    );
  });
});

describe('openapi', () => {
  it('generates a 3.1 document with the core paths', () => {
    const doc = generateOpenApiDocument();
    expect(doc.openapi).toBe('3.1.0');
    expect(Object.keys(doc.paths ?? {})).toEqual(
      expect.arrayContaining(['/health', '/auth/login', '/items', '/items/{id}', '/schedule', '/search']),
    );
  });
});
