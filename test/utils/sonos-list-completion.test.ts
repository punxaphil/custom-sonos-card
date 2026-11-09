import { describe, expect, it, vi } from 'vitest';
import { completeSonosList, isTruncatedSonosList, SONOS_MAX_ITEMS } from '../../src/utils/sonos-list-completion';

const artist = (title: string) =>
  ({
    title,
    media_content_id: `A:ALBUMARTIST/${encodeURIComponent(title)}`,
    media_content_type: 'artist',
    media_class: 'artist',
    can_play: true,
    can_expand: true,
  }) as never;

describe('Sonos 1000-item completion', () => {
  const first1000 = [
    ...Array.from({ length: 995 }, (_, i) => artist(`A${String(i).padStart(4, '0')}`)),
    artist('Pavement'),
    artist('Pearl Jam'),
    artist('Pet Shop Boys'),
    artist('Peter Gabriel'),
    artist('Peter Tosh'),
  ];
  const item = { title: 'Artists', media_content_id: 'A:ALBUMARTIST', media_content_type: 'artist', children: first1000 } as never;

  it('detects truncated library categories only', () => {
    expect(first1000.length).toBe(SONOS_MAX_ITEMS);
    expect(isTruncatedSonosList(item)).toBe(true);
    expect(isTruncatedSonosList({ ...(item as object), media_content_id: 'S://192.168.0.10/music' } as never)).toBe(false);
    expect(isTruncatedSonosList({ ...(item as object), children: first1000.slice(0, 10) } as never)).toBe(false);
  });

  it('fetches the missing letters and keeps the list in order', async () => {
    const search: Record<string, string[]> = {
      P: ['Pink Floyd', 'Peter Tosh', 'Pearl Jam', 'Portishead', 'Depeche Mode'],
      Q: ['Queen', 'QOTSA', 'A Tribe Called Quest'],
      T: ['The Cure', 'Tom Waits'],
      Z: ['Zaz'],
    };
    const browse = vi.fn(async (id: string) => ({ children: (search[id.split(':').pop()!] ?? []).map(artist) }) as never);
    const progress = vi.fn();
    const merged = await completeSonosList(item, browse, progress);
    const titles = (merged.children ?? []).map((c) => c.title);
    expect(browse).toHaveBeenCalledWith('A:ALBUMARTIST:P');
    expect(browse).toHaveBeenCalledWith('A:ALBUMARTIST:Z');
    expect(browse).toHaveBeenCalledWith('A:ALBUMARTIST:Ü');
    expect(titles.slice(995)).toEqual([
      'Pavement',
      'Pearl Jam',
      'Pet Shop Boys',
      'Peter Gabriel',
      'Peter Tosh',
      'Pink Floyd',
      'Portishead',
      'QOTSA',
      'Queen',
      'The Cure',
      'Tom Waits',
      'Zaz',
    ]);
    expect(titles).not.toContain('Depeche Mode');
    expect(progress).toHaveBeenCalledTimes(11);
  });
});
