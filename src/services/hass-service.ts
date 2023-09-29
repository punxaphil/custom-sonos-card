import { HomeAssistant } from 'custom-card-helpers';
import { MediaPlayerItem, Section, TemplateResult } from '../types';
import { ServiceCallRequest } from 'custom-card-helpers/dist/types';
import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED } from '../constants';
import { MediaPlayer } from '../model/media-player';
import { HassEntity } from 'home-assistant-js-websocket';

export default class HassService {
  private readonly hass: HomeAssistant;
  private readonly sectionOnCreate?: Section;
  private templateCache: { [key: string]: unknown } = {};

  constructor(hass: HomeAssistant, section?: Section) {
    this.hass = hass;
    this.sectionOnCreate = section;
  }

  async callMediaService(service: string, inOptions: ServiceCallRequest['serviceData']) {
    window.dispatchEvent(
      new CustomEvent(CALL_MEDIA_STARTED, {
        bubbles: true,
        composed: true,
        detail: { section: this.sectionOnCreate },
      }),
    );

    try {
      await this.hass.callService('media_player', service, inOptions);
    } finally {
      window.dispatchEvent(
        new CustomEvent(CALL_MEDIA_DONE, {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  async browseMedia(mediaPlayer: MediaPlayer, media_content_type?: string, media_content_id?: string) {
    return await this.hass.callWS<MediaPlayerItem>({
      type: 'media_player/browse_media',
      entity_id: mediaPlayer.id,
      media_content_id,
      media_content_type,
    });
  }

  async getRelatedSwitchEntities(player: MediaPlayer) {
    return (await this.renderTemplate<string[]>("{{ device_entities(device_id('" + player.id + "')) }}"))
      .filter((item: string) => item.indexOf('switch') > -1)
      .map((item) => this.hass.states[item]);
  }

  async renderTemplate<T>(template: string) {
    const cachedRender = this.templateCache[template] as T;
    if (cachedRender) {
      return cachedRender;
    }
    const result = await new Promise<T>(async (resolve, reject) => {
      try {
        const unsubscribe = await this.hass.connection.subscribeMessage<TemplateResult<T>>(
          (response) => {
            unsubscribe();
            resolve(response.result);
          },
          {
            type: 'render_template',
            template,
          },
        );
      } catch (e) {
        reject(e);
      }
    });
    this.templateCache[template] = result;
    return result;
  }

  async toggle(entity: HassEntity) {
    await this.hass.callService('homeassistant', 'toggle', {
      entity_id: entity.entity_id,
    });
  }
}
