import { CardConfig, MediaPlayerItem } from '../types';
import HassService from './hass-service';
import { MediaPlayer } from '../model/media-player';
import { stringContainsAnyItemInArray } from '../utils/favorites-utils';
import { customEvent } from '../utils/utils';
import { HASS_MORE_INFO } from '../constants';

export default class MediaBrowseService {
  private hassService: HassService;
  private config: CardConfig;

  constructor(hassService: HassService, config: CardConfig) {
    this.hassService = hassService;
    this.config = config;
  }

  async getFavorites(player: MediaPlayer): Promise<MediaPlayerItem[]> {
    if (!player) {
      return [];
    }
    let favorites = await this.getFavoritesForPlayer(player);
    favorites = favorites.flatMap((f) => f);
    favorites = this.removeDuplicates(favorites);
    favorites = favorites.length ? favorites : this.getFavoritesFromStates(player);
    const favoritesToIgnore = this.config.favoritesToIgnore ?? [];
    return favorites.filter((item) => {
      const titleNotIgnored = !stringContainsAnyItemInArray(favoritesToIgnore, item.title);
      const contentIdNotIgnored = !stringContainsAnyItemInArray(favoritesToIgnore, item.media_content_id ?? '');
      return titleNotIgnored && contentIdNotIgnored;
    });
  }

  private removeDuplicates(items: MediaPlayerItem[]) {
    return items.filter((item, index, all) => {
      return index === all.findIndex((current) => current.title === item.title);
    });
  }

  private async getFavoritesForPlayer(player: MediaPlayer) {
    const mediaRoot = await this.hassService.browseMedia(player);
    const favoritesStr = 'favorites';
    const favoritesDir = mediaRoot.children?.find(
      (child) =>
        child.media_content_type?.toLowerCase() === favoritesStr ||
        child.media_content_id?.toLowerCase() === favoritesStr ||
        child.title.toLowerCase() === favoritesStr,
    );
    if (!favoritesDir) {
      return [];
    }
    const favorites: MediaPlayerItem[] = [];
    await this.browseDir(player, favoritesDir, favorites);
    return favorites;
  }

  private async browseDir(player: MediaPlayer, favoritesDir: MediaPlayerItem, favorites: MediaPlayerItem[]) {
    const dir = await this.hassService.browseMedia(
      player,
      favoritesDir.media_content_type,
      favoritesDir.media_content_id,
    );
    for (const child of dir.children ?? []) {
      if (child.can_play) {
        favorites.push({ ...child, favoriteType: dir.title });
      } else if (child.can_expand) {
        await this.browseDir(player, child, favorites);
      }
    }
  }

  private getFavoritesFromStates(mediaPlayer: MediaPlayer) {
    const titles = mediaPlayer.attributes.source_list ?? [];
    return titles.map((title: string) => ({ title }));
  }

  public showBrowseMedia(activePlayer: MediaPlayer, element: HTMLElement) {
    const detail = {
      entityId: activePlayer.id,
      view: 'info',
    };
    element.dispatchEvent(customEvent(HASS_MORE_INFO, detail));
  }
}
