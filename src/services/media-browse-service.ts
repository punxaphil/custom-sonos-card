import { CardConfig, MediaPlayerItem } from '../types';
import HassService from './hass-service';
import { MediaPlayer } from '../model/media-player';
import { indexOfWithoutSpecialChars } from '../utils/media-browser-utils';

export default class MediaBrowseService {
  private hassService: HassService;

  constructor(hassService: HassService) {
    this.hassService = hassService;
  }

  async getFavorites(player: MediaPlayer, config: CardConfig): Promise<MediaPlayerItem[]> {
    if (!player) {
      return [];
    }
    let favorites = await this.getFavoritesForPlayer(player, config);
    favorites = favorites.flatMap((f) => f);
    favorites = this.removeDuplicates(favorites);
    favorites = favorites.length ? favorites : this.getFavoritesFromStates(player);
    return favorites.filter(
      (item) => indexOfWithoutSpecialChars(config.mediaBrowserTitlesToIgnore ?? [], item.title) === -1,
    );
  }

  private removeDuplicates(items: MediaPlayerItem[]) {
    return items.filter((item, index, all) => {
      return index === all.findIndex((current) => current.title === item.title);
    });
  }

  private async getFavoritesForPlayer(player: MediaPlayer, config: CardConfig) {
    try {
      const favoritesRoot = await this.hassService.browseMedia(player, config, 'favorites', '');
      const favoriteTypesPromise = favoritesRoot.children?.map((favoriteItem) =>
        this.hassService.browseMedia(player, config, favoriteItem.media_content_type, favoriteItem.media_content_id),
      );
      const favoriteTypes = favoriteTypesPromise ? await Promise.all(favoriteTypesPromise) : [];
      return favoriteTypes.flatMap((item) => item.children ?? []);
    } catch (e) {
      console.log('Custom Sonos Card: error getting favorites for player ' + player.id + ': ' + JSON.stringify(e));
      return [];
    }
  }

  private getFavoritesFromStates(mediaPlayer: MediaPlayer) {
    const titles = mediaPlayer.attributes.hasOwnProperty('source_list') ? mediaPlayer.attributes.source_list : [];
    return titles.map((title: string) => ({ title }));
  }
}
