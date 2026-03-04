import { HomeAssistant } from 'custom-card-helpers';
import {
  ConfigEntry,
  MASS_QUEUE_NOT_INSTALLED,
  MassQueueItem,
  MassQueueResponse,
  MediaPlayerItem,
  MusicAssistantQueueResponse,
  TemplateResult,
} from '../types';
import { MusicAssistantSearchResponse, MusicAssistantSearchResult, SearchMediaType, SearchResultItem } from '../sections/search/search.types';
import { MediaPlayer } from '../model/media-player';

import { EnqueueMode, MusicAssistantFavoritesMediaType } from '../types';

const LIBRARY_URI_PREFIX = 'library://';

export class MusicAssistantService {
  private readonly hass: HomeAssistant;

  constructor(hass: HomeAssistant) {
    this.hass = hass;
  }

  /**
   * Discover the Music Assistant config entry ID
   * Returns the first found Music Assistant integration ID, or null if not found
   */
  async discoverConfigEntryId(): Promise<string> {
    const entries = await this.hass.callWS<ConfigEntry[]>({
      type: 'config_entries/get',
    });

    const musicAssistant = entries.find((entry) => entry.domain === 'music_assistant' && entry.state === 'loaded');

    if (!musicAssistant) {
      throw new Error('Music Assistant integration not found or not loaded');
    }
    return musicAssistant.entry_id;
  }

  /**
   * Discover the mass_queue config entry ID (needed for send_command)
   * Returns the first found mass_queue integration ID, or null if not found
   */
  async discoverMassQueueConfigEntryId(): Promise<string> {
    const entries = await this.hass.callWS<ConfigEntry[]>({
      type: 'config_entries/get',
    });

    const massQueue = entries.find((entry) => entry.domain === 'mass_queue' && entry.state === 'loaded');

    if (!massQueue?.entry_id) {
      throw new Error(MASS_QUEUE_NOT_INSTALLED);
    }
    return massQueue.entry_id;
  }

  /**
   * Get favorites from Music Assistant library
   */
  async getFavorites(
    configEntryId: string,
    mediaTypes: MusicAssistantFavoritesMediaType[] = ['track', 'album', 'artist', 'playlist', 'radio'],
  ): Promise<MediaPlayerItem[]> {
    const allFavorites: MediaPlayerItem[] = [];

    for (const mediaType of mediaTypes) {
      try {
        const response = await this.hass.callWS<{ response: { items: MusicAssistantSearchResult[] } }>({
          type: 'call_service',
          domain: 'music_assistant',
          service: 'get_library',
          service_data: {
            config_entry_id: configEntryId,
            favorite: true,
            media_type: mediaType,
            limit: 0,
          },
          return_response: true,
        });

        const items = response.response?.items ?? [];
        allFavorites.push(...items.map((item) => this.transformFavoriteItem(item, mediaType)));
      } catch (e) {
        console.warn(`Failed to get ${mediaType} favorites from Music Assistant:`, e);
      }
    }

    return allFavorites;
  }

  private transformFavoriteItem(item: MusicAssistantSearchResult, mediaType: string): MediaPlayerItem {
    let title = item.name;

    // For tracks, include artist name
    if (mediaType === 'track' && item.artists?.length) {
      const artistNames = item.artists.map((a) => a.name).join(', ');
      title = `${artistNames} - ${item.name}`;
    }

    // Image can be a string URL or an object with path property
    const thumbnail = typeof item.image === 'string' ? item.image : item.image?.path;

    return {
      title,
      media_content_id: item.uri,
      media_content_type: mediaType,
      thumbnail,
      can_play: true,
      favoriteType: this.getFavoriteTypeLabel(mediaType),
    };
  }

  private getFavoriteTypeLabel(mediaType: string): string {
    switch (mediaType) {
      case 'track':
        return 'Tracks';
      case 'album':
        return 'Albums';
      case 'artist':
        return 'Artists';
      case 'playlist':
        return 'Playlists';
      case 'radio':
        return 'Radio';
      default:
        return mediaType;
    }
  }

  /**
   * Search Music Assistant for media
   */
  async search(configEntryId: string, name: string, mediaType: SearchMediaType, limit: number = 50): Promise<SearchResultItem[]> {
    try {
      const response = await this.hass.callWS<{ response: MusicAssistantSearchResponse }>({
        type: 'call_service',
        domain: 'music_assistant',
        service: 'search',
        service_data: {
          config_entry_id: configEntryId,
          name,
          media_type: [mediaType],
          limit,
        },
        return_response: true,
      });

      return this.transformResults(response.response, mediaType);
    } catch (e) {
      console.error('Music Assistant search failed:', e);
      throw e;
    }
  }

  /**
   * Search multiple media types with library filter
   * @param libraryFilter - 'all' (no filter), 'library' (only library), 'non-library' (exclude library)
   */
  async searchMultipleTypes(
    configEntryId: string,
    name: string,
    mediaTypes: SearchMediaType[],
    limit: number = 50,
    libraryFilter: 'all' | 'library' | 'non-library' = 'all',
  ): Promise<SearchResultItem[]> {
    // Search all types in parallel
    const searchPromises = mediaTypes.map((type) => this.search(configEntryId, name, type, limit));
    const resultsArrays = await Promise.all(searchPromises);

    // Flatten results
    let allResults = resultsArrays.flat();

    // Apply library filter
    if (libraryFilter === 'library') {
      allResults = allResults.filter((item) => item.uri.startsWith(LIBRARY_URI_PREFIX));
    } else if (libraryFilter === 'non-library') {
      allResults = this.filterLibraryItems(allResults);
    }

    return allResults;
  }

  /**
   * Filter out items with library:// URIs
   */
  filterLibraryItems(results: SearchResultItem[]): SearchResultItem[] {
    return results.filter((item) => !item.uri.startsWith(LIBRARY_URI_PREFIX));
  }

  /**
   * Transform Music Assistant response to our internal format
   */
  private transformResults(response: MusicAssistantSearchResponse, mediaType: SearchMediaType): SearchResultItem[] {
    const items: MusicAssistantSearchResult[] = this.getResultsForType(response, mediaType);

    return items.map((item) => this.transformResultItem(item, mediaType));
  }

  private getResultsForType(response: MusicAssistantSearchResponse, mediaType: SearchMediaType): MusicAssistantSearchResult[] {
    switch (mediaType) {
      case 'artist':
        return response.artists ?? [];
      case 'album':
        return response.albums ?? [];
      case 'track':
        return response.tracks ?? [];
      case 'playlist':
        return response.playlists ?? [];
      case 'radio':
        return response.radio ?? [];
      default:
        return [];
    }
  }

  private transformResultItem(item: MusicAssistantSearchResult, mediaType: SearchMediaType): SearchResultItem {
    let title = item.name;
    let subtitle: string | undefined;

    if (mediaType === 'track') {
      // Format: "artist - song (album)"
      const artistNames = item.artists?.map((a) => a.name).join(', ');
      if (artistNames) {
        title = `${artistNames} - ${item.name}`;
      }
      if (item.album?.name) {
        subtitle = `(${item.album.name})`;
      }
    } else if (mediaType === 'album') {
      subtitle = item.artists?.map((a) => a.name).join(', ');
    }

    // Image can be a string URL or an object with path property
    const imageUrl = typeof item.image === 'string' ? item.image : item.image?.path;

    return {
      title,
      subtitle,
      uri: item.uri,
      mediaType,
      imageUrl,
      favorite: item.favorite,
      inLibrary: item.in_library ?? item.uri.startsWith(LIBRARY_URI_PREFIX),
      itemId: item.item_id,
      provider: item.provider,
    };
  }

  // --- Player-level Music Assistant methods ---

  isMusicAssistantPlayer(mediaPlayer: MediaPlayer): boolean {
    return mediaPlayer.attributes.platform === 'music_assistant';
  }

  async getCurrentSongFavorite(mediaPlayer: MediaPlayer): Promise<boolean | null> {
    try {
      const ret = await this.hass.callWS<MusicAssistantQueueResponse>({
        type: 'call_service',
        domain: 'music_assistant',
        service: 'get_queue',
        target: { entity_id: mediaPlayer.id },
        return_response: true,
      });
      return ret.response[mediaPlayer.id]?.current_item?.media_item?.favorite ?? null;
    } catch (e) {
      console.warn('Error getting favorite status', e);
      return null;
    }
  }

  async favoriteCurrentSong(mediaPlayer: MediaPlayer): Promise<boolean> {
    try {
      const buttonEntity = await this.findRelatedEntityId(mediaPlayer, 'button', 'favorite_current_song');
      if (buttonEntity) {
        await this.hass.callService('button', 'press', { entity_id: buttonEntity });
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Error favoriting current song', e);
      return false;
    }
  }

  async unfavoriteCurrentSong(mediaPlayer: MediaPlayer): Promise<boolean> {
    try {
      await this.hass.callService('mass_queue', 'unfavorite_current_item', {
        entity: mediaPlayer.id,
      });
      return true;
    } catch (e) {
      console.warn('Error unfavoriting current song', e);
      return false;
    }
  }

  async getCurrentQueueItemId(mediaPlayer: MediaPlayer): Promise<string | null> {
    if (!this.isMusicAssistantPlayer(mediaPlayer)) {
      return null;
    }
    try {
      const ret = await this.hass.callWS<MusicAssistantQueueResponse>({
        type: 'call_service',
        domain: 'music_assistant',
        service: 'get_queue',
        target: { entity_id: mediaPlayer.id },
        return_response: true,
      });
      return ret.response[mediaPlayer.id]?.current_item?.queue_item_id ?? null;
    } catch (e) {
      console.warn('Error getting current queue item id', e);
      return null;
    }
  }

  async getQueue(mediaPlayer: MediaPlayer): Promise<MediaPlayerItem[]> {
    try {
      const ret = await this.hass.callWS<MassQueueResponse>({
        type: 'call_service',
        domain: 'mass_queue',
        service: 'get_queue_items',
        service_data: {
          entity: mediaPlayer.id,
          limit_before: 5,
        },
        return_response: true,
      });
      const queueItems = ret.response[mediaPlayer.id];
      if (!Array.isArray(queueItems)) {
        return [];
      }
      return queueItems.map((item) => this.mapQueueItem(item));
    } catch (e) {
      const error = e as Error;
      if (error.message?.includes('mass_queue') || error.message?.includes('Service not found')) {
        throw new Error(MASS_QUEUE_NOT_INSTALLED);
      }
      throw e;
    }
  }

  private mapQueueItem(item: MassQueueItem): MediaPlayerItem {
    const artist = item.media_artist || '';
    const title = item.media_title || '';
    return {
      title: artist ? `${artist} - ${title}` : title,
      media_content_id: item.media_content_id,
      media_content_type: 'track',
      thumbnail: item.media_image || undefined,
      queueItemId: item.queue_item_id,
    };
  }

  async playQueueItem(mediaPlayer: MediaPlayer, queueItemId: string): Promise<void> {
    await this.hass.callService('mass_queue', 'play_queue_item', {
      entity: mediaPlayer.id,
      queue_item_id: queueItemId,
    });
  }

  async removeQueueItem(mediaPlayer: MediaPlayer, queueItemId: string): Promise<void> {
    await this.hass.callService('mass_queue', 'remove_queue_item', {
      entity: mediaPlayer.id,
      queue_item_id: queueItemId,
    });
  }

  async moveQueueItemNext(mediaPlayer: MediaPlayer, queueItemId: string): Promise<void> {
    await this.hass.callService('mass_queue', 'move_queue_item_next', {
      entity: mediaPlayer.id,
      queue_item_id: queueItemId,
    });
  }

  async playMedia(mediaPlayer: MediaPlayer, mediaId: string, enqueue?: EnqueueMode, radioMode?: boolean): Promise<void> {
    await this.hass.callService('music_assistant', 'play_media', {
      entity_id: mediaPlayer.id,
      media_id: [mediaId],
      ...(enqueue && { enqueue }),
      ...(radioMode && { radio_mode: true }),
    });
  }

  /**
   * Get collection items based on media type
   */
  async getCollectionItems(uri: string, mediaType: SearchMediaType, massConfigEntryId: string): Promise<SearchResultItem[]> {
    return this.getCollectionTracks(`get_${mediaType}_tracks`, uri, massConfigEntryId);
  }

  private async getCollectionTracks(service: string, uri: string, massQueueConfigEntryId: string): Promise<SearchResultItem[]> {
    try {
      const ret = await this.hass.callWS<{ response: { tracks: MassQueueItem[] } }>({
        type: 'call_service',
        domain: 'mass_queue',
        service,
        service_data: { uri, config_entry_id: massQueueConfigEntryId },
        return_response: true,
      });
      const items = ret.response?.tracks;
      if (!Array.isArray(items)) {
        return [];
      }
      return items.map((item) => this.mapCollectionTrack(item));
    } catch (e) {
      console.error(`Failed to get collection tracks (${service}):`, e);
      throw e;
    }
  }

  private mapCollectionTrack(item: MassQueueItem): SearchResultItem {
    const artist = item.media_artist || '';
    const title = item.media_title || '';
    return {
      title: artist ? `${artist} - ${title}` : title,
      subtitle: item.media_album_name || undefined,
      uri: item.media_content_id,
      mediaType: 'track',
      imageUrl: item.media_image || undefined,
      favorite: item.favorite,
    };
  }

  private async findRelatedEntityId(mediaPlayer: MediaPlayer, entityType: string, namePart: string): Promise<string | undefined> {
    const template = `{{ device_entities(device_id('${mediaPlayer.id}')) }}`;
    const entities = await this.renderTemplate<string[]>(template, []);
    const matching = entities
      .filter((id: string) => id.includes(entityType))
      .map((id) => this.hass.states[id])
      .filter(Boolean);
    return matching.find((e) => e?.entity_id?.toLowerCase().includes(namePart.toLowerCase()))?.entity_id;
  }

  private renderTemplate<T>(template: string, defaultValue: T): Promise<T> {
    return new Promise<T>((resolve) => {
      try {
        this.hass.connection
          .subscribeMessage<TemplateResult<T>>(
            (response) => {
              try {
                resolve(response.result);
              } catch {
                resolve(defaultValue);
              }
            },
            { type: 'render_template', template },
          )
          .then((unsub) => unsub());
      } catch {
        resolve(defaultValue);
      }
    });
  }

  /**
   * Send a command to Music Assistant via mass_queue.send_command
   */
  private async sendMassCommand<T = unknown>(
    massQueueConfigEntryId: string,
    command: string,
    data: Record<string, unknown> = {},
    returnResponse = false,
  ): Promise<T | undefined> {
    if (returnResponse) {
      const ret = await this.hass.callWS<{ response: { response: T } }>({
        type: 'call_service',
        domain: 'mass_queue',
        service: 'send_command',
        service_data: {
          command,
          data,
          config_entry_id: massQueueConfigEntryId,
        },
        return_response: true,
      });
      return ret.response.response;
    }
    await this.hass.callService('mass_queue', 'send_command', {
      command,
      data,
      config_entry_id: massQueueConfigEntryId,
    });
    return undefined;
  }

  /**
   * Add an item to favorites via Music Assistant API
   * Uses music/favorites/add_item which accepts a URI and handles
   * adding to library + setting favorite automatically
   */
  async addToFavorites(massQueueConfigEntryId: string, uri: string): Promise<boolean> {
    try {
      await this.sendMassCommand(massQueueConfigEntryId, 'music/favorites/add_item', { item: uri });
      return true;
    } catch (e) {
      console.error('Failed to add to favorites:', e);
      return false;
    }
  }

  /**
   * Remove an item from favorites via Music Assistant API
   * Uses music/favorites/remove_item which requires media_type and library_item_id
   */
  async removeFromFavorites(massQueueConfigEntryId: string, uri: string, mediaType: SearchMediaType, itemId?: string, provider?: string): Promise<boolean> {
    try {
      const libraryItemId = await this.resolveLibraryItemId(massQueueConfigEntryId, uri, mediaType, itemId, provider);

      if (!libraryItemId) {
        console.error('Could not determine library item ID for unfavoriting');
        return false;
      }

      await this.sendMassCommand(massQueueConfigEntryId, 'music/favorites/remove_item', {
        media_type: mediaType,
        library_item_id: libraryItemId,
      });
      return true;
    } catch (e) {
      console.error('Failed to remove from favorites:', e);
      return false;
    }
  }

  /**
   * Add an item to the library via Music Assistant API
   */
  async addToLibrary(massQueueConfigEntryId: string, uri: string): Promise<boolean> {
    try {
      await this.sendMassCommand(massQueueConfigEntryId, 'music/library/add_item', { item: uri });
      return true;
    } catch (e) {
      console.error('Failed to add to library:', e);
      return false;
    }
  }

  /**
   * Remove an item from the library via Music Assistant API
   */
  async removeFromLibrary(massQueueConfigEntryId: string, uri: string, mediaType: SearchMediaType, itemId?: string, provider?: string): Promise<boolean> {
    try {
      const libraryItemId = await this.resolveLibraryItemId(massQueueConfigEntryId, uri, mediaType, itemId, provider);

      if (!libraryItemId) {
        console.error('Could not determine library item ID for removal');
        return false;
      }

      await this.sendMassCommand(massQueueConfigEntryId, 'music/library/remove_item', {
        media_type: mediaType,
        library_item_id: libraryItemId,
      });
      return true;
    } catch (e) {
      console.error('Failed to remove from library:', e);
      return false;
    }
  }

  /**
   * Resolve the library item ID from various sources
   */
  private async resolveLibraryItemId(
    massQueueConfigEntryId: string,
    uri: string,
    mediaType: SearchMediaType,
    itemId?: string,
    provider?: string,
  ): Promise<string | undefined> {
    if (provider === 'library' && itemId) {
      // Item is already a library item, use its item_id directly
      return itemId;
    }

    if (uri.startsWith(LIBRARY_URI_PREFIX)) {
      // Parse library item_id from URI like library://track/47
      return uri.split('/').pop();
    }

    if (itemId && provider) {
      // Look up the library version of this provider item
      const libraryItem = await this.sendMassCommand<{ item_id: string }>(
        massQueueConfigEntryId,
        'music/get_library_item',
        {
          media_type: mediaType,
          item_id: itemId,
          provider_instance_id_or_domain: provider,
        },
        true,
      );
      return libraryItem?.item_id ? String(libraryItem.item_id) : undefined;
    }

    return undefined;
  }
}
