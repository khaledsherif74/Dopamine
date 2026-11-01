import { describe, it, expect } from 'vitest';
import { mergeMessages, markMineRead, unreadFromOthers, lastSeenIndex, newestCreatedAt } from '../src/chat/messages.js';

const mine = m => m.senderId === 'me';
const m = (id, senderId, at, extra = {}) => ({ id, senderId, createdAt: `2026-10-22T10:00:0${at}.000Z`, body: id, ...extra });

describe('mergeMessages', () => {
  it('sorts oldest-first and de-duplicates by id (REST page + socket echo)', () => {
    const merged = mergeMessages([m('b', 'x', 2), m('a', 'x', 1)], [m('b', 'x', 2), m('c', 'y', 3)]);
    expect(merged.map(x => x.id)).toEqual(['a', 'b', 'c']);
  });
  it('a newer copy updates the old one (read receipts)', () => {
    const merged = mergeMessages([m('a', 'me', 1)], [m('a', 'me', 1, { readAt: '2026-10-22T10:05:00.000Z' })]);
    expect(merged).toHaveLength(1);
    expect(merged[0].readAt).toBeTruthy();
  });
  it('same timestamp -> stable id order; bad dates do not crash', () => {
    expect(mergeMessages([], [m('b', 'x', 1), m('a', 'x', 1)]).map(x => x.id)).toEqual(['a', 'b']);
    expect(() => mergeMessages([], [{ id: 'z', createdAt: 'nope' }])).not.toThrow();
  });
  it('does not mutate its inputs', () => {
    const a = [m('a', 'x', 1)];
    mergeMessages(a, [m('b', 'x', 2)]);
    expect(a).toHaveLength(1);
  });
});

describe('read tracking', () => {
  const list = [m('1', 'me', 1, { readAt: 'r' }), m('2', 'them', 2), m('3', 'me', 3), m('4', 'them', 4, { readAt: 'r' })];
  it('unreadFromOthers counts only unread messages from the other side', () => {
    expect(unreadFromOthers(list, mine)).toBe(1);
  });
  it('markMineRead marks only my unread messages', () => {
    const out = markMineRead(list, mine, 'NOW');
    expect(out[2].readAt).toBe('NOW');
    expect(out[1].readAt).toBeUndefined();
    expect(out[0].readAt).toBe('r');
  });
  it('lastSeenIndex finds the last of my messages that was read', () => {
    expect(lastSeenIndex(list, mine)).toBe(0);
    expect(lastSeenIndex(markMineRead(list, mine, 'NOW'), mine)).toBe(2);
    expect(lastSeenIndex([], mine)).toBe(-1);
  });
});

describe('newestCreatedAt (catch-up cursor)', () => {
  it('returns the newest message time, or null for an empty thread', () => {
    expect(newestCreatedAt([m('a', 'x', 1), m('c', 'x', 3), m('b', 'x', 2)])).toBe('2026-10-22T10:00:03.000Z');
    expect(newestCreatedAt([])).toBe(null);
  });
  it('works with the other message shape (authorId) because isMine is a function', () => {
    const isMine = x => x.authorId === 'u1';
    const list = [{ id: '1', authorId: 'u1', createdAt: '2026-10-22T10:00:01.000Z', readAt: 'r' }, { id: '2', authorId: 'agent', createdAt: '2026-10-22T10:00:02.000Z' }];
    expect(unreadFromOthers(list, isMine)).toBe(1);
    expect(lastSeenIndex(list, isMine)).toBe(0);
  });
});
