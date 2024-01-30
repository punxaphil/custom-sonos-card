import { HomeAssistant } from 'custom-card-helpers';
import { CardConfig, MediaPlayerItem, Section, TemplateResult } from '../types';
import { ServiceCallRequest } from 'custom-card-helpers/dist/types';
import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED } from '../constants';
import { MediaPlayer } from '../model/media-player';
import { HassEntity } from 'home-assistant-js-websocket';
import { customEvent } from '../utils/utils';

export default class HassService {
  private readonly hass: HomeAssistant;
  private readonly currentSection: Section;
  private readonly card: Element;

  constructor(hass: HomeAssistant, section: Section, card: Element) {
    this.hass = hass;
    this.currentSection = section;
    this.card = card;
  }

  async callMediaService(service: string, inOptions: ServiceCallRequest['serviceData']) {
    this.card.dispatchEvent(customEvent(CALL_MEDIA_STARTED, { section: this.currentSection }));
    try {
      await this.hass.callService('media_player', service, inOptions);
    } finally {
      this.card.dispatchEvent(customEvent(CALL_MEDIA_DONE));
    }
  }

  async browseMedia(
    mediaPlayer: MediaPlayer,
    config: CardConfig,
    media_content_type?: string,
    media_content_id?: string,
  ) {
    const mediaPlayerItem = await this.hass.callWS<MediaPlayerItem>({
      type: 'media_player/browse_media',
      entity_id: mediaPlayer.id,
      media_content_id,
      media_content_type,
    });
    if (config.replaceHttpWithHttpsForThumbnails) {
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
        template: "{{ device_entities(device_id('" + player.id + "')) }}",
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
}
