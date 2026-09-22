import { describe, expect, it } from 'vitest';
import type { MediaPlayerItem } from '../../../src/types';
import { queueItemsEqual } from '../../../src/sections/queue/queue-section-utils';

describe('queueItemsEqual', () => {
  it('detects the same title with a different queue item ID', () => {
    const current: MediaPlayerItem[] = [{ title: 'Song', queueItemId: '1', media_content_id: 'track:1' }];
    const next: MediaPlayerItem[] = [{ title: 'Song', queueItemId: '2', media_content_id: 'track:1' }];

    expect(queueItemsEqual(current, next)).toBe(false);
  });

  it('detects duplicate-title items reordered by identity', () => {
    const current: MediaPlayerItem[] = [
      { title: 'Song A', queueItemId: '1', media_content_id: 'track:1' },
      { title: 'Song A', queueItemId: '2', media_content_id: 'track:2' },
    ];
    const next: MediaPlayerItem[] = [
      { title: 'Song A', queueItemId: '2', media_content_id: 'track:2' },
      { title: 'Song A', queueItemId: '1', media_content_id: 'track:1' },
    ];

    expect(queueItemsEqual(current, next)).toBe(false);
  });

  it('detects a changed media content ID when the title is unchanged', () => {
    const current: MediaPlayerItem[] = [{ title: 'Song', media_content_id: 'track:1' }];
    const next: MediaPlayerItem[] = [{ title: 'Song', media_content_id: 'track:2' }];

    expect(queueItemsEqual(current, next)).toBe(false);
  });

  it('detects additions and removals', () => {
    const oneItem: MediaPlayerItem[] = [{ title: 'Song', queueItemId: '1' }];
    const twoItems: MediaPlayerItem[] = [...oneItem, { title: 'Another Song', queueItemId: '2' }];

    expect(queueItemsEqual(oneItem, twoItems)).toBe(false);
    expect(queueItemsEqual(twoItems, oneItem)).toBe(false);
  });

  it('treats equivalent queue data as unchanged', () => {
    const current: MediaPlayerItem[] = [{ title: 'Song', queueItemId: '1', media_content_id: 'track:1', media_content_type: 'track', thumbnail: 'image.jpg' }];
    const next = current.map((item) => ({ ...item }));

    expect(queueItemsEqual(current, next)).toBe(true);
  });
});
