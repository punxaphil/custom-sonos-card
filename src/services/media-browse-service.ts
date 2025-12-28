import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, MediaPlayerItem } from '../types';
import { MediaPlayer } from '../model/media-player';
import { stringContainsAnyItemInArray } from '../utils/media-browse-utils';
import { customEvent } from '../utils/utils';
import { HASS_MORE_INFO } from '../constants';
import { browseMediaPlayer } from '../upstream/data/media-player';

export default class MediaBrowseService {
  private hass: HomeAssistant;
  private config: CardConfig;

  constructor(hass: HomeAssistant, config: CardConfig) {
    this.hass = hass;
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
    const exclude = this.config.mediaBrowser?.favorites?.exclude ?? [];
    return favorites.filter((item) => {
      const titleNotIgnored = !stringContainsAnyItemInArray(exclude, item.title);
      const contentIdNotIgnored = !stringContainsAnyItemInArray(exclude, item.media_content_id ?? '');
      return titleNotIgnored && contentIdNotIgnored;
    });
  }

  private removeDuplicates(items: MediaPlayerItem[]) {
    return items.filter((item, index, all) => {
      return index === all.findIndex((current) => current.title === item.title);
    });
  }

  private async getFavoritesForPlayer(player: MediaPlayer) {
    const mediaRoot = await browseMediaPlayer(this.hass, player.id);
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
    const dir = await browseMediaPlayer(
      this.hass,
      player.id,
      favoritesDir.media_content_id,
      favoritesDir.media_content_type,
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
