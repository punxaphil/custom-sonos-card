import { HomeAssistant } from 'custom-card-helpers';
import { MediaPlayerItem, Section, TemplateResult } from '../types';
import { ServiceCallRequest } from 'custom-card-helpers/dist/types';
import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED } from '../constants';
import { MediaPlayer } from '../model/media-player';

export default class HassService {
  private readonly hass: HomeAssistant;
  private readonly sectionOnCreate?: Section;

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
    return new Promise<string[]>(async (resolve, reject) => {
      const subscribeMessage = {
        type: 'render_template',
        template: "{{ device_entities(device_id('" + player.id + "')) }}",
      };
      try {
        const unsubscribe = await this.hass.connection.subscribeMessage<TemplateResult>((response) => {
          unsubscribe();
          resolve(response.result.filter((item: string) => item.indexOf('switch') > -1));
        }, subscribeMessage);
      } catch (e) {
        reject(e);
      }
    });
  }

  async toggle(entity_id: string) {
    await this.hass.callService('homeassistant', 'toggle', {
      entity_id,
    });
  }
}
