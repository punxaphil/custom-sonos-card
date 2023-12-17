import { MediaPlayerItem } from '../types';
import HassService from './hass-service';
import { MediaPlayer } from '../model/media-player';
import { indexOfWithoutSpecialChars } from '../utils/media-browser-utils';

export default class MediaBrowseService {
  private hassService: HassService;

  constructor(hassService: HassService) {
    this.hassService = hassService;
  }

  async getAllFavorites(mediaPlayers: MediaPlayer[], ignoredTitles?: string[]): Promise<MediaPlayerItem[]> {
    console.log('Custom Sonos Card: getting all favorites', mediaPlayers, ignoredTitles);
    if (!mediaPlayers.length) {
      return [];
    }
    console.log('Custom Sonos Card: getting favorites for all players');
    const favoritesForAllPlayers = await Promise.all(mediaPlayers.map((player) => this.getFavoritesForPlayer(player)));
    console.log('Custom Sonos Card: favoritesForAllPlayers', favoritesForAllPlayers);
    let favorites = favoritesForAllPlayers.flatMap((f) => f);
    console.log('Custom Sonos Card: favorites', favorites);
    favorites = this.removeDuplicates(favorites);
    console.log('Custom Sonos Card: favorites after removing duplicates', favorites);
    favorites = favorites.length ? favorites : this.getFavoritesFromStates(mediaPlayers);
    console.log('Custom Sonos Card: favorites after getting from states', favorites);
    const filtered = favorites.filter((item) => indexOfWithoutSpecialChars(ignoredTitles ?? [], item.title) === -1);
    console.log('Custom Sonos Card: favorites after filtering', filtered);
    return filtered;
  }

  private removeDuplicates(items: MediaPlayerItem[]) {
    return items.filter((item, index, all) => {
      return index === all.findIndex((current) => current.title === item.title);
    });
  }

  private async getFavoritesForPlayer(player: MediaPlayer) {
    console.log('Custom Sonos Card: getting favorites for player', player.id);
    const favoritesRoot = await this.hassService.browseMedia(player, 'favorites', '');
    console.log('Custom Sonos Card: favoritesRoot', favoritesRoot.media_content_id);
    const favoriteTypesPromise = favoritesRoot.children?.map((favoriteItem) =>
      this.hassService.browseMedia(player, favoriteItem.media_content_type, favoriteItem.media_content_id),
    );
    const favoriteTypes = favoriteTypesPromise ? await Promise.all(favoriteTypesPromise) : [];
    console.log('Custom Sonos Card: favoriteTypes', favoriteTypes.length);
    const mediaPlayerItems = favoriteTypes.flatMap((item) => item.children ?? []);
    console.log('Custom Sonos Card: mediaPlayerItems', mediaPlayerItems.length);
    return mediaPlayerItems;
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
