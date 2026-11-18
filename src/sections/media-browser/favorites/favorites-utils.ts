import { CardConfig, MediaPlayerItem } from '../../../types';
import { itemsWithFallbacks } from '../../../utils/media-browse-utils';

export function getFavoriteItems(items: MediaPlayerItem[], config: CardConfig): MediaPlayerItem[] {
  const favorites = itemsWithFallbacks(items, config);
  if (config.mediaBrowser?.favorites?.sortByType) {
    favorites.sort((a, b) => (a.favoriteType ?? '').localeCompare(b.favoriteType ?? '') || a.title.localeCompare(b.title));
  }
  return favorites;
}
