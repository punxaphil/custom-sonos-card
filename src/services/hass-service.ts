import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, GetQueueResponse, MediaPlayerItem, Section, TemplateResult } from '../types';
import { ServiceCallRequest } from 'custom-card-helpers/dist/types';
import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED } from '../constants';
import { MediaPlayer } from '../model/media-player';
import { customEvent } from '../utils/utils';

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
    if (this.config.favorites?.replaceHttpWithHttpsForThumbnails) {
      mediaPlayerItem.children = mediaPlayerItem.children?.map((child) => ({
        ...child,
        thumbnail: child.thumbnail?.replace('http://', 'https://'),
      }));
    }
    return mediaPlayerItem;
  }

  async renderTemplate<T>(template: string, defaultValue: T): Promise<T> {
    return new Promise<T>((resolve) => {
      const subscribeMessage = {
        type: 'render_template',
        template,
      };
      try {
        this.hass.connection
          .subscribeMessage<TemplateResult<T>>((response) => {
            try {
              resolve(response.result);
            } catch {
              resolve(defaultValue);
            }
          }, subscribeMessage)
          .then((unsub) => unsub());
      } catch {
        resolve(defaultValue);
      }
    });
  }

  async getRelatedEntities(player: MediaPlayer, ...entityTypes: string[]) {
    const template = `{{ device_entities(device_id('${player.id}')) }}`;
    const result = await this.renderTemplate<string[]>(template, []);
    return result
      .filter((item: string) => entityTypes.some((type) => item.includes(type)))
      .map((item) => this.hass.states[item]);
  }

  async getQueue(mediaPlayer: MediaPlayer): Promise<MediaPlayerItem[]> {
    try {
      const ret = await this.hass.callWS<GetQueueResponse>({
        type: 'call_service',
        domain: 'sonos',
        service: 'get_queue',
        target: {
          entity_id: mediaPlayer.id,
        },
        return_response: true,
      });
      const queueItems = ret.response[mediaPlayer.id];
      return queueItems.map((item) => {
        return {
          title: `${item.media_artist} - ${item.media_title}`,
        };
      });
    } catch (e) {
      console.error('Error getting queue', e);
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

  async removeFromQueue(mediaPlayer: MediaPlayer, queuePosition: number) {
    await this.hass.callService('sonos', 'remove_from_queue', {
      entity_id: mediaPlayer.id,
      queue_position: queuePosition,
    });
  }

  async clearQueue(mediaPlayer: MediaPlayer) {
    await this.hass.callService('media_player', 'clear_playlist', { entity_id: mediaPlayer.id });
  }

  async setSleepTimer(mediaPlayer: MediaPlayer, sleepTimer: number) {
    await this.hass.callService('sonos', 'set_sleep_timer', {
      entity_id: mediaPlayer.id,
      sleep_time: sleepTimer,
    });
  }

  async cancelSleepTimer(player: MediaPlayer) {
    await this.hass.callService('sonos', 'clear_sleep_timer', {
      entity_id: player.id,
    });
  }

  async setSwitch(entityId: string, state: boolean) {
    await this.hass.callService('switch', state ? 'turn_on' : 'turn_off', {
      entity_id: entityId,
    });
  }

  async setNumber(entityId: string, value: number) {
    await this.hass.callService('number', 'set_value', {
      entity_id: entityId,
      value,
    });
  }

  async setRelatedEntityValue(player: MediaPlayer, name: string, value: number | boolean | undefined) {
    if (value === undefined) {
      return;
    }
    const type = typeof value === 'number' ? 'number' : 'switch';
    const entityId = await this.getRelatedEntityId(player, type, name);
    if (!entityId) {
      return;
    }
    if (typeof value === 'number') {
      await this.setNumber(entityId, value);
    } else {
      await this.setSwitch(entityId, value);
    }
  }

  async getRelatedEntityId(player: MediaPlayer, entityType: string, namePart: string) {
    const entities = await this.getRelatedEntities(player, entityType);
    return entities.find((e) => e?.entity_id?.toLowerCase().includes(namePart.toLowerCase()))?.entity_id;
  }
}
