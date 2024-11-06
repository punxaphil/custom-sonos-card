import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, GetQueueResponse, MediaPlayerItem, Section, TemplateResult } from '../types';
import { ServiceCallRequest } from 'custom-card-helpers/dist/types';
import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED } from '../constants';
import { MediaPlayer } from '../model/media-player';
import { HassEntity } from 'home-assistant-js-websocket';
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
    if (this.config.replaceHttpWithHttpsForThumbnails) {
      mediaPlayerItem.children = mediaPlayerItem.children?.map((child) => ({
        ...child,
        thumbnail: child.thumbnail?.replace('http://', 'https://'),
      }));
    }
    return mediaPlayerItem;
  }

  async getRelatedEntities(player: MediaPlayer, ...entityTypes: string[]) {
    return new Promise<HassEntity[]>((resolve) => {
      const subscribeMessage = {
        type: 'render_template',
        template: `{{ device_entities(device_id('${player.id}')) }}`,
      };
      try {
        this.hass.connection
          .subscribeMessage<TemplateResult>((response) => {
            try {
              resolve(
                response.result
                  .filter((item: string) => entityTypes.some((type) => item.includes(type)))
                  .map((item) => this.hass.states[item]),
              );
            } catch {
              resolve([]);
            }
          }, subscribeMessage)
          .then((unsub) => unsub);
      } catch {
        resolve([]);
      }
    });
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
}
