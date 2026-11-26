import { HomeAssistant } from 'custom-card-helpers';
import { MusicAssistantCollectionItem, MusicAssistantCollectionResponse, MusicAssistantMediaType, SearchResultItem } from '../sections/search/search.types';

export async function getMusicAssistantCollectionItems(
  hass: HomeAssistant,
  uri: string,
  mediaType: MusicAssistantMediaType,
  configEntryId: string,
): Promise<SearchResultItem[]> {
  const service = mediaType === 'podcast' ? 'get_podcast_episodes' : `get_${mediaType}_tracks`;
  try {
    const { response } = await hass.callWS<{ response: MusicAssistantCollectionResponse }>({
      type: 'call_service',
      domain: 'mass_queue',
      service,
      service_data: { uri, config_entry_id: configEntryId },
      return_response: true,
    });
    return transformCollectionItems(response, mediaType);
  } catch (e) {
    console.error(`Failed to get collection items (${service}):`, e);
    throw e;
  }
}

function transformCollectionItems(response: MusicAssistantCollectionResponse, mediaType: MusicAssistantMediaType): SearchResultItem[] {
  const items = mediaType === 'podcast' ? response.episodes : response.tracks;
  if (!Array.isArray(items)) {
    throw new Error(`Invalid ${mediaType} collection response`);
  }
  return items.map((item) => transformCollectionItem(item, mediaType === 'podcast' ? 'podcast_episode' : 'track'));
}

function transformCollectionItem(item: MusicAssistantCollectionItem, mediaType: MusicAssistantMediaType): SearchResultItem {
  return {
    title: item.media_artist ? `${item.media_artist} - ${item.media_title}` : item.media_title,
    subtitle: (mediaType === 'podcast_episode' ? item.release_date : item.media_album_name) || undefined,
    uri: item.media_content_id,
    mediaType,
    imageUrl: item.media_image || undefined,
    favorite: item.favorite,
  };
}
