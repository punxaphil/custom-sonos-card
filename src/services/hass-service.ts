import { HomeAssistant } from 'custom-card-helpers';
import { GetQueueResponse, MediaPlayerItem, Section, TemplateResult } from '../types';
import { ServiceCallRequest } from 'custom-card-helpers/dist/types';
import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED } from '../constants';
import { MediaPlayer } from '../model/media-player';
import { customEvent } from '../utils/utils';
import { MusicAssistantService } from './music-assistant-service';

interface QueueCacheEntry {
  key: string;
  time: number;
  promise: Promise<MediaPlayerItem[]>;
  failed?: boolean;
}
const sonosQueueCache = new Map<string, QueueCacheEntry>();
const QUEUE_CACHE_MS = 120_000;
const QUEUE_ERROR_BACKOFF_MS = 60_000;

export default class HassService {
  private readonly hass: HomeAssistant;
  private readonly currentSection: Section;
  private readonly card: Element;
  public readonly musicAssistantService: MusicAssistantService;

  constructor(hass: HomeAssistant, section: Section, card: Element) {
    this.hass = hass;
    this.currentSection = section;
    this.card = card;
    this.musicAssistantService = new MusicAssistantService(hass);
  }

  async callWithLoader<T>(action: () => Promise<T>): Promise<T> {
    this.card.dispatchEvent(customEvent(CALL_MEDIA_STARTED, { section: this.currentSection }));
    try {
      return await action();
    } finally {
      this.card.dispatchEvent(customEvent(CALL_MEDIA_DONE));
    }
  }

  async callMediaService(service: string, inOptions: ServiceCallRequest['serviceData']) {
    await this.callWithLoader(() => this.hass.callService('media_player', service, inOptions));
  }

  async callService(domain: string, service: string, serviceData?: Record<string, unknown>) {
    await this.hass.callService(domain, service, serviceData);
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
    return result.filter((item: string) => entityTypes.some((type) => item.includes(type))).map((item) => this.hass.states[item]);
  }

  private isMusicAssistant(mediaPlayer: MediaPlayer): boolean {
    return this.musicAssistantService.isMusicAssistantPlayer(mediaPlayer);
  }

  /**
   * Sonos queues can hold thousands of tracks, and every sonos.get_queue call makes the speaker
   * serialise the whole queue (several seconds for 5000 tracks). The card used to ask again on every
   * Home Assistant state change, which overloaded the speaker. Results are now shared between all
   * cards and only re-fetched when the queue size or shuffle changes, every 2 minutes at most, or
   * when `force` is set (after the user edits the queue). Failures back off for a minute.
   */
  async getQueue(mediaPlayer: MediaPlayer, force = false): Promise<MediaPlayerItem[]> {
    if (this.isMusicAssistant(mediaPlayer)) {
      return await this.musicAssistantService.getQueue(mediaPlayer);
    }
    const attributes = mediaPlayer.attributes ?? {};
    const key = `${attributes.queue_size ?? ''}|${attributes.shuffle ?? ''}`;
    const now = Date.now();
    const cached = sonosQueueCache.get(mediaPlayer.id);
    if (!force && cached && cached.key === key && now - cached.time < (cached.failed ? QUEUE_ERROR_BACKOFF_MS : QUEUE_CACHE_MS)) {
      return cached.promise;
    }
    const entry: QueueCacheEntry = { key, time: now, promise: this.getSonosQueue(mediaPlayer) };
    entry.promise.catch(() => (entry.failed = true));
    sonosQueueCache.set(mediaPlayer.id, entry);
    return entry.promise;
  }

  private async getSonosQueue(mediaPlayer: MediaPlayer): Promise<MediaPlayerItem[]> {
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
        media_content_id: item.media_content_id,
        media_content_type: item.media_content_type,
      };
    });
  }

  async removeFromQueue(mediaPlayer: MediaPlayer, queuePosition: number, queueItemId?: string) {
    if (this.isMusicAssistant(mediaPlayer) && queueItemId) {
      await this.musicAssistantService.removeQueueItem(mediaPlayer, queueItemId);
    } else {
      await this.hass.callService('sonos', 'remove_from_queue', {
        entity_id: mediaPlayer.id,
        queue_position: queuePosition,
      });
    }
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
