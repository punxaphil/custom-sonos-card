import { HomeAssistant } from 'custom-card-helpers';
import { MediaPlayerItem } from '../types';
import { ServiceCallRequest } from 'custom-card-helpers/dist/types';

export default class HassService {
  private hass: HomeAssistant;

  constructor(hass: HomeAssistant) {
    this.hass = hass;
  }

  callSonosService(service: string, inOptions: ServiceCallRequest['serviceData']) {
    this.hass.callService('sonos', service, inOptions);
  }

  callMediaService(service: string, inOptions: ServiceCallRequest['serviceData']) {
    this.hass.callService('media_player', service, inOptions);
  }

  async browseMedia(entity_id: string, media_content_type?: string, media_content_id = '') {
    return await this.hass.callWS<MediaPlayerItem>({
      type: 'media_player/browse_media',
      entity_id,
      media_content_id,
      media_content_type,
    });
  }
}
