import { MediaPlayerItem } from '../types';
import HassService from './hass-service';
import { MediaPlayer } from '../model/media-player';
import { indexOfWithoutSpecialChars } from '../utils/media-browser-utils';

function mediaBrowserFilter(ignoredTitles: string[] = [], items?: MediaPlayerItem[]) {
  return items?.filter(
    (item) =>
      !['media-source://tts', 'media-source://camera'].includes(item.media_content_id || '') &&
      indexOfWithoutSpecialChars(ignoredTitles, item.title) === -1,
  );
}

export default class MediaBrowseService {
  private hassService: HassService;

  constructor(hassService: HassService) {
    this.hassService = hassService;
  }

  async getRoot(mediaPlayer: MediaPlayer, ignoredTitles?: string[]): Promise<MediaPlayerItem[]> {
    const root = await this.hassService.browseMedia(mediaPlayer);
    return mediaBrowserFilter(ignoredTitles, root.children) || [];
  }

  async getDir(mediaPlayer: MediaPlayer, dir: MediaPlayerItem, ignoredTitles?: string[]): Promise<MediaPlayerItem[]> {
    try {
      const dirItem = await this.hassService.browseMedia(mediaPlayer, dir.media_content_type, dir.media_content_id);
      return mediaBrowserFilter(ignoredTitles, dirItem.children) || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getAllFavorites(mediaPlayers: MediaPlayer[], ignoredTitles?: string[]): Promise<MediaPlayerItem[]> {
    if (!mediaPlayers.length) {
      return [];
    }
    const favoritesForAllPlayers = await Promise.all(
      mediaPlayers.map((player) => this.getFavoritesForPlayer(player, ignoredTitles)),
    );
    let favorites = favoritesForAllPlayers.flatMap((f) => f);
    favorites = this.removeDuplicates(favorites);
    return favorites.length ? favorites : this.getFavoritesFromStates(mediaPlayers);
  }

  private removeDuplicates(items: MediaPlayerItem[]) {
    return items.filter((item, index, all) => {
      return index === all.findIndex((current) => current.title === item.title);
    });
  }

  private async getFavoritesForPlayer(player: MediaPlayer, ignoredTitles?: string[]) {
    const favoritesRoot = await this.hassService.browseMedia(player, 'favorites', '');
    const favoriteTypesPromise = favoritesRoot.children?.map((favoriteItem) =>
      this.hassService.browseMedia(player, favoriteItem.media_content_type, favoriteItem.media_content_id),
    );
    const favoriteTypes = favoriteTypesPromise ? await Promise.all(favoriteTypesPromise) : [];
    return favoriteTypes.flatMap((item) => mediaBrowserFilter(ignoredTitles, item.children) || []);
  }

  private getFavoritesFromStates(mediaPlayers: MediaPlayer[]) {
    console.log('Custom Sonos Card: found no favorites with thumbnails, trying with titles only');
    let titles = mediaPlayers
      .map((player) => player.attributes)
      .flatMap((attributes) => (attributes.hasOwnProperty('source_list') ? attributes.source_list : []));
    titles = [...new Set(titles)];
    if (!titles.length) {
      console.log('Custom Sonos Card: No favorites found');
    }
    return titles.map((title) => ({ title }));
  }
}
