import { HomeAssistant } from 'custom-card-helpers';
import { MediaPlayerItem } from '../types';
import HassService from './hass-service';

export default class MediaBrowseService {
  private hass: HomeAssistant;
  private hassService: HassService;

  constructor(hass: HomeAssistant, hassService: HassService) {
    this.hass = hass;
    this.hassService = hassService;
  }

  async getFavorites(mediaPlayers: string[]): Promise<MediaPlayerItem[]> {
    if (!mediaPlayers.length) {
      return [];
    }
    const favoritesForAllPlayers = await Promise.all(mediaPlayers.map((player) => this.getFavoritesForPlayer(player)));
    let favorites = favoritesForAllPlayers.flatMap((f) => f);
    favorites = this.removeDuplicateFavorites(favorites);
    return favorites.length ? favorites : this.getFavoritesFromStates(mediaPlayers);
  }

  private removeDuplicateFavorites(favorites: MediaPlayerItem[]) {
    return favorites.filter((value, index, self) => {
      return index === self.findIndex((t) => t.title === value.title);
    });
  }

  private async getFavoritesForPlayer(player: string) {
    const favoritesRoot = await this.hassService.browseMedia(player, 'favorites');
    const favoriteTypesPromise = favoritesRoot.children?.map((favoriteItem) =>
      this.hassService.browseMedia(player, favoriteItem.media_content_type, favoriteItem.media_content_id),
    );
    const favoriteTypes = favoriteTypesPromise ? await Promise.all(favoriteTypesPromise) : [];
    return favoriteTypes.flatMap((item) => item.children || []);
  }

  private getFavoritesFromStates(mediaPlayers: string[]) {
    console.log('Custom Sonos Card: found no favorites with thumbnails, trying with titles only');
    let titles = mediaPlayers
      .map((entity) => this.hass.states[entity])
      .flatMap((state) => state.attributes.source_list);
    titles = [...new Set(titles)];
    if (!titles.length) console.log('Custom Sonos Card: No favorites found');
    return titles.map((title) => ({ title }));
  }
}
