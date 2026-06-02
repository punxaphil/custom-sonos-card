import { describe, expect, it } from 'vitest';
import { filterOutIgnoredMediaSources, MediaBrowserFilter } from '../../src/utils/media-browse-utils';

interface TestItem {
  media_content_id?: string;
  title?: string;
}

describe('filterOutIgnoredMediaSources', () => {
  const baseItems: TestItem[] = [
    { media_content_id: 'media-source://spotify/playlists', title: 'Playlists' },
    { media_content_id: 'media-source://radio/stations', title: 'Radio stations' },
    { media_content_id: 'media-source://podcasts', title: 'Podcasts' },
    { media_content_id: 'media-source://albums', title: 'Albums' },
    { media_content_id: 'media-source://audiobooks', title: 'Audiobooks' },
    { media_content_id: 'media-source://radio-browser', title: 'Radio Browser' },
  ];

  it('should filter out ignored media sources by default', () => {
    const items: TestItem[] = [
      ...baseItems,
      { media_content_id: 'media-source://tts', title: 'TTS' },
      { media_content_id: 'media-source://camera', title: 'Camera' },
      { media_content_id: 'media-source://image', title: 'Image' },
      { media_content_id: 'media-source://image_upload', title: 'Image Upload' },
    ];

    const result = filterOutIgnoredMediaSources(items);

    expect(result).toHaveLength(6);
    expect(result.map((i) => i.title)).toEqual(['Playlists', 'Radio stations', 'Podcasts', 'Albums', 'Audiobooks', 'Radio Browser']);
  });

  describe('showOnlyItems filter (whitelist)', () => {
    it('should show only specified items', () => {
      const filter: MediaBrowserFilter = {
        showOnlyItems: ['Playlists', 'Radio stations', 'Podcasts'],
      };

      const result = filterOutIgnoredMediaSources(baseItems, filter);

      expect(result).toHaveLength(3);
      expect(result.map((i) => i.title)).toEqual(['Playlists', 'Radio stations', 'Podcasts']);
    });

    it('should be case-insensitive', () => {
      const filter: MediaBrowserFilter = {
        showOnlyItems: ['PLAYLISTS', 'radio STATIONS'],
      };

      const result = filterOutIgnoredMediaSources(baseItems, filter);

      expect(result).toHaveLength(2);
      expect(result.map((i) => i.title)).toEqual(['Playlists', 'Radio stations']);
    });

    it('should return empty array when no items match', () => {
      const filter: MediaBrowserFilter = {
        showOnlyItems: ['Non-existent'],
      };

      const result = filterOutIgnoredMediaSources(baseItems, filter);

      expect(result).toHaveLength(0);
    });
  });

  describe('hideItems filter (blacklist)', () => {
    it('should hide specified items', () => {
      const filter: MediaBrowserFilter = {
        hideItems: ['Radio Browser', 'Audiobooks'],
      };

      const result = filterOutIgnoredMediaSources(baseItems, filter);

      expect(result).toHaveLength(4);
      expect(result.map((i) => i.title)).toEqual(['Playlists', 'Radio stations', 'Podcasts', 'Albums']);
    });

    it('should be case-insensitive', () => {
      const filter: MediaBrowserFilter = {
        hideItems: ['RADIO BROWSER', 'audiobooks'],
      };

      const result = filterOutIgnoredMediaSources(baseItems, filter);

      expect(result).toHaveLength(4);
      expect(result.map((i) => i.title)).toEqual(['Playlists', 'Radio stations', 'Podcasts', 'Albums']);
    });

    it('should return all items when none match', () => {
      const filter: MediaBrowserFilter = {
        hideItems: ['Non-existent'],
      };

      const result = filterOutIgnoredMediaSources(baseItems, filter);

      expect(result).toHaveLength(6);
    });
  });

  describe('combined filters', () => {
    it('showOnlyItems takes precedence over hideItems', () => {
      const filter: MediaBrowserFilter = {
        showOnlyItems: ['Playlists', 'Radio stations', 'Podcasts'],
        hideItems: ['Playlists'], // hideItems is ignored when showOnlyItems is set
      };

      const result = filterOutIgnoredMediaSources(baseItems, filter);

      // showOnlyItems takes full precedence, hideItems is ignored
      expect(result).toHaveLength(3);
      expect(result.map((i) => i.title)).toEqual(['Playlists', 'Radio stations', 'Podcasts']);
    });

    it('should handle empty showOnlyItems and apply hideItems only', () => {
      const filter: MediaBrowserFilter = {
        showOnlyItems: [],
        hideItems: ['Radio Browser', 'Audiobooks'],
      };

      const result = filterOutIgnoredMediaSources(baseItems, filter);

      expect(result).toHaveLength(4);
      expect(result.map((i) => i.title)).toEqual(['Playlists', 'Radio stations', 'Podcasts', 'Albums']);
    });
  });

  it('should handle items without title', () => {
    const items: TestItem[] = [
      { media_content_id: 'media-source://spotify/playlists', title: 'Playlists' },
      { media_content_id: 'media-source://unknown' }, // No title
    ];

    const filter: MediaBrowserFilter = {
      showOnlyItems: ['Playlists'],
    };

    const result = filterOutIgnoredMediaSources(items, filter);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Playlists');
  });

  it('should not filter when no filter is provided', () => {
    const result = filterOutIgnoredMediaSources(baseItems);

    expect(result).toHaveLength(6);
  });

  it('should not filter when filter has undefined values', () => {
    const filter: MediaBrowserFilter = {
      showOnlyItems: undefined,
      hideItems: undefined,
    };

    const result = filterOutIgnoredMediaSources(baseItems, filter);

    expect(result).toHaveLength(6);
  });
});
