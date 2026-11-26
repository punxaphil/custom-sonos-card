import { HomeAssistant } from 'custom-card-helpers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MusicAssistantService } from '../../src/services/music-assistant-service';
import { MediaPlayer } from '../../src/model/media-player';
import { performMassSearch, toMediaPlayerItem } from '../../src/sections/search/search-utils';

const PODCAST_URI = 'library://podcast/12';
const EPISODE_URI = 'podcast-provider://podcast_episode/34';
const PODCAST = { name: 'Example podcast', uri: PODCAST_URI, item_id: '12', provider: 'library', favorite: true, image: { path: '/podcast.jpg' } };

describe('Music Assistant podcasts', () => {
  const callWS = vi.fn();
  const callService = vi.fn();
  const hass: HomeAssistant = Object.create(null);
  hass.callWS = callWS;
  hass.callService = callService;
  const service = new MusicAssistantService(hass);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes podcast shows in default favorites with their type, image, and playable URI', async () => {
    callWS.mockImplementation(async (request) => ({
      response: { items: request.service_data.media_type === 'podcast' ? [PODCAST] : [] },
    }));

    expect(await service.getFavorites('mass-entry')).toEqual([
      {
        title: PODCAST.name,
        media_content_id: PODCAST_URI,
        media_content_type: 'podcast',
        thumbnail: '/podcast.jpg',
        can_play: true,
        favoriteType: 'Podcasts',
      },
    ]);
    expect(callWS).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'get_library', service_data: { config_entry_id: 'mass-entry', favorite: true, media_type: 'podcast', limit: 0 } }),
    );
  });

  it('searches podcasts and transforms the podcasts response', async () => {
    callWS.mockResolvedValue({ response: { podcasts: [PODCAST] } });

    expect(await service.search('mass-entry', 'Example', 'podcast')).toEqual([
      {
        title: PODCAST.name,
        subtitle: undefined,
        uri: PODCAST_URI,
        mediaType: 'podcast',
        imageUrl: '/podcast.jpg',
        favorite: true,
        inLibrary: true,
        itemId: '12',
        provider: 'library',
      },
    ]);
    expect(callWS).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'search', service_data: { config_entry_id: 'mass-entry', name: 'Example', media_type: ['podcast'], limit: 50 } }),
    );
  });

  it('includes podcasts when searching all types', async () => {
    callWS.mockResolvedValue({ response: {} });
    await performMassSearch(service, 'mass-entry', 'Example', new Set(), 'all', 25);
    expect(callWS.mock.calls.map(([request]) => request.service_data.media_type)).toEqual([
      ['track'],
      ['artist'],
      ['album'],
      ['playlist'],
      ['radio'],
      ['podcast'],
    ]);
  });

  it('loads episodes using the mass_queue episode response and preserves episode metadata', async () => {
    callWS.mockResolvedValue({
      response: {
        episodes: [{ media_title: 'Episode 34', media_content_id: EPISODE_URI, media_image: '/episode.jpg', release_date: '2026-11-26', favorite: false }],
      },
    });

    const episodes = await service.getCollectionItems(PODCAST_URI, 'podcast', 'queue-entry');
    expect(episodes).toEqual([
      { title: 'Episode 34', subtitle: '2026-11-26', uri: EPISODE_URI, mediaType: 'podcast_episode', imageUrl: '/episode.jpg', favorite: false },
    ]);
    expect(toMediaPlayerItem(episodes[0])).toEqual({
      title: 'Episode 34 2026-11-26',
      media_content_id: EPISODE_URI,
      media_content_type: 'podcast_episode',
      thumbnail: '/episode.jpg',
    });
    expect(callWS).toHaveBeenCalledWith({
      type: 'call_service',
      domain: 'mass_queue',
      service: 'get_podcast_episodes',
      service_data: { uri: PODCAST_URI, config_entry_id: 'queue-entry' },
      return_response: true,
    });
  });

  it('reports invalid episode responses rather than silently returning no episodes', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    callWS.mockResolvedValue({ response: { tracks: [] } });
    await expect(service.getCollectionItems(PODCAST_URI, 'podcast', 'queue-entry')).rejects.toThrow('Invalid podcast collection response');
    expect(console.error).toHaveBeenCalled();
  });

  it('keeps existing album collection requests and track formatting unchanged', async () => {
    callWS.mockResolvedValue({
      response: { tracks: [{ media_title: 'Song', media_artist: 'Artist', media_album_name: 'Album', media_content_id: 'library://track/1' }] },
    });
    expect(await service.getCollectionItems('library://album/1', 'album', 'queue-entry')).toEqual([
      { title: 'Artist - Song', subtitle: 'Album', uri: 'library://track/1', mediaType: 'track', imageUrl: undefined, favorite: undefined },
    ]);
    expect(callWS).toHaveBeenCalledWith(expect.objectContaining({ service: 'get_album_tracks' }));
  });

  it.each([PODCAST_URI, EPISODE_URI])('plays %s through the existing Music Assistant playback action', async (uri) => {
    const player = new MediaPlayer(
      {
        entity_id: 'media_player.test',
        state: 'idle',
        attributes: {},
        last_changed: '',
        last_updated: '',
        context: { id: '', parent_id: null, user_id: null },
      },
      { type: 'custom:maxi-media-player' },
    );
    await service.playMedia(player, uri, 'next');
    expect(callService).toHaveBeenCalledWith('music_assistant', 'play_media', { entity_id: player.id, media_id: [uri], enqueue: 'next' });
  });
});
