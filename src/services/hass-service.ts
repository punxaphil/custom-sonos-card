import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, MediaPlayerItem, QueueItem, Section, TemplateResult, TodoResponse } from '../types';
import { ServiceCallRequest } from 'custom-card-helpers/dist/types';
import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED } from '../constants';
import { MediaPlayer } from '../model/media-player';
import { HassEntity } from 'home-assistant-js-websocket';
import { customEvent } from '../utils/utils';
import { indexOfWithoutSpecialChars } from '../utils/media-browser-utils';

export default class HassService {
  private readonly hass: HomeAssistant;
  private readonly currentSection: Section;
  private readonly card: Element;
  private readonly config: CardConfig;

  constructor(hass: HomeAssistant, section: Section, card: Element, config: CardConfig) {
    this.hass = hass;
    this.currentSection = section;
    this.card = card;
    this.config = config;
  }

  async callMediaService(service: string, inOptions: ServiceCallRequest['serviceData']) {
    this.card.dispatchEvent(customEvent(CALL_MEDIA_STARTED, { section: this.currentSection }));
    try {
      await this.hass.callService('media_player', service, inOptions);
    } finally {
      this.card.dispatchEvent(customEvent(CALL_MEDIA_DONE));
    }
  }

  async browseMedia(mediaPlayer: MediaPlayer, media_content_type?: string, media_content_id?: string) {
    const mediaPlayerItem = await this.hass.callWS<MediaPlayerItem>({
      type: 'media_player/browse_media',
      entity_id: mediaPlayer.id,
      media_content_id,
      media_content_type,
    });
    if (this.config.replaceHttpWithHttpsForThumbnails) {
      mediaPlayerItem.children = mediaPlayerItem.children?.map((child) => ({
        ...child,
        thumbnail: child.thumbnail?.replace('http://', 'https://'),
      }));
    }
    return mediaPlayerItem;
  }

  async getRelatedEntities(player: MediaPlayer, ...entityTypes: string[]) {
    return new Promise<HassEntity[]>(async (resolve, reject) => {
      const subscribeMessage = {
        type: 'render_template',
        template: `{{ device_entities(device_id('${player.id}')) }}`,
      };
      try {
        const unsubscribe = await this.hass.connection.subscribeMessage<TemplateResult>((response) => {
          unsubscribe();
          resolve(
            response.result
              .filter((item: string) => entityTypes.some((type) => item.includes(type)))
              .map((item) => this.hass.states[item]),
          );
        }, subscribeMessage);
      } catch (e) {
        reject(e);
      }
    });
  }

  async getQueue(mediaPlayer: MediaPlayer): Promise<MediaPlayerItem[]> {
    const entityId = 'todo.sonos_queues';
    const ret = await this.hass.callWS<TodoResponse>({
      type: 'call_service',
      domain: 'todo',
      service: 'get_items',
      target: {
        entity_id: entityId,
      },
      service_data: {
        status: 'needs_action',
      },
      return_response: true,
    });

    const responseElement = ret.response[entityId];
    const queueJson = responseElement.items.filter((value) => value.summary === mediaPlayer.name)[0]?.description;
    if (queueJson) {
      const queueItems = JSON.parse(queueJson) as QueueItem[];
      return queueItems.map((item) => {
        return {
          title: `${item.artist} - ${item.title}`,
        };
      });
    } else {
      return [];
    }
  }

  async playQueue(mediaPlayer: MediaPlayer, queuePosition: number) {
    this.card.dispatchEvent(customEvent(CALL_MEDIA_STARTED, { section: this.currentSection }));
    try {
      await this.hass.callService('sonos', 'play_queue', {
        entity_id: mediaPlayer.id,
        queue_position: queuePosition,
      });
    } finally {
      this.card.dispatchEvent(customEvent(CALL_MEDIA_DONE));
    }
  }

  async getFavorites(player: MediaPlayer): Promise<MediaPlayerItem[]> {
    if (!player) {
      return [];
    }
    let favorites = await this.getFavoritesForPlayer(player);
    favorites = favorites.flatMap((f) => f);
    favorites = this.removeDuplicates(favorites);
    favorites = favorites.length ? favorites : this.getFavoritesFromStates(player);
    return favorites.filter(
      (item) => indexOfWithoutSpecialChars(this.config.favoritesToIgnore ?? [], item.title) === -1,
    );
  }

  private removeDuplicates(items: MediaPlayerItem[]) {
    return items.filter((item, index, all) => {
      return index === all.findIndex((current) => current.title === item.title);
    });
  }

  private async getFavoritesForPlayer(player: MediaPlayer) {
    try {
      const favoritesRoot = await this.browseMedia(player, 'favorites', '');
      const favoriteTypesPromise = favoritesRoot.children?.map((favoriteItem) =>
        this.browseMedia(player, favoriteItem.media_content_type, favoriteItem.media_content_id),
      );
      const favoriteTypes = favoriteTypesPromise ? await Promise.all(favoriteTypesPromise) : [];
      return favoriteTypes.flatMap((item) => item.children ?? []);
    } catch (e) {
      console.log(`Custom Sonos Card: error getting favorites for player ${player.id}: ${JSON.stringify(e)}`);
      return [];
    }
  }

  private getFavoritesFromStates(mediaPlayer: MediaPlayer) {
    const titles = mediaPlayer.attributes.hasOwnProperty('source_list') ? mediaPlayer.attributes.source_list : [];
    return titles.map((title: string) => ({ title }));
  }
}
