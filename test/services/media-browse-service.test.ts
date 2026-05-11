import { describe, expect, it, vi } from 'vitest';
import { CardConfig } from '../../src/types';
import MediaBrowseService from '../../src/services/media-browse-service';
import { browseMediaPlayer } from '../../src/upstream/data/media-player';

vi.mock('../../src/upstream/data/media-player', () => ({
  browseMediaPlayer: vi.fn(),
}));

function getService() {
  const config = { type: 'custom:sonos-card', sections: [] } as CardConfig;
  return new MediaBrowseService({} as never, config);
}

function getPlayer() {
  return {
    id: 'media_player.office',
    attributes: {},
  } as never;
}

describe('MediaBrowseService', () => {
  it('includes podcast favorites even when can_play is false', async () => {
    vi.mocked(browseMediaPlayer)
      .mockResolvedValueOnce({
        children: [{ title: 'Favorites', media_content_type: 'favorites', media_content_id: 'favorites' }],
      } as never)
      .mockResolvedValueOnce({
        title: 'Favorites',
        children: [{ title: 'My Podcast', media_content_type: 'podcast', media_content_id: 'podcast:1', can_expand: true, can_play: false }],
      } as never);

    const favorites = await getService().getFavorites(getPlayer());

    expect(favorites).toEqual([
      {
        title: 'My Podcast',
        media_content_type: 'podcast',
        media_content_id: 'podcast:1',
        can_expand: true,
        can_play: false,
        favoriteType: 'Favorites',
      },
    ]);
  });
});
