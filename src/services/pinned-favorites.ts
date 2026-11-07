import { HomeAssistant } from 'custom-card-helpers';
import { MediaPlayerItem } from '../types';

/**
 * Favorites added from the card ("Add to favorites" in the long-press menu).
 *
 * Home Assistant cannot create Sonos favorites, so they are kept in Home Assistant's per-user
 * frontend storage (`frontend/set_user_data`): they survive cache resets and follow the user to
 * any device. When that storage is unavailable they fall back to the browser's localStorage.
 */
const USER_DATA_KEY = 'sonos-card-pinned-favorites';
const LOCAL_KEY = 'sonos-card-pinned-favorites';
export const PINNED_CHANGED = 'sonos-card-pinned-changed';

export type PinnedFavorite = Pick<
  MediaPlayerItem,
  'title' | 'media_content_id' | 'media_content_type' | 'media_class' | 'thumbnail' | 'can_play' | 'can_expand'
>;

let cache: PinnedFavorite[] | null = null;
let loading: Promise<PinnedFavorite[]> | null = null;

function readLocal(): PinnedFavorite[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function getPinnedFavorites(hass: HomeAssistant): Promise<PinnedFavorite[]> {
  if (cache) {
    return Promise.resolve(cache);
  }
  if (!loading) {
    loading = hass
      .callWS<{ value: PinnedFavorite[] | null }>({ type: 'frontend/get_user_data', key: USER_DATA_KEY })
      .then((result) => result?.value ?? readLocal())
      .catch(() => readLocal())
      .then((list) => (cache = Array.isArray(list) ? list : []))
      .finally(() => (loading = null));
  }
  return loading;
}

export function isPinned(item: MediaPlayerItem | undefined): boolean {
  return !!item?.media_content_id && !!cache?.some((f) => f.media_content_id === item.media_content_id);
}

async function save(hass: HomeAssistant, list: PinnedFavorite[]) {
  cache = list;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch {
    // private mode: ignore
  }
  try {
    await hass.callWS({ type: 'frontend/set_user_data', key: USER_DATA_KEY, value: list });
  } catch (e) {
    console.warn('Could not save favorites in Home Assistant, kept in this browser only', e);
  }
  window.dispatchEvent(new CustomEvent(PINNED_CHANGED));
}

export async function addPinnedFavorite(hass: HomeAssistant, item: MediaPlayerItem) {
  const list = await getPinnedFavorites(hass);
  if (!item.media_content_id || list.some((f) => f.media_content_id === item.media_content_id)) {
    return;
  }
  const { title, media_content_id, media_content_type, media_class, thumbnail, can_play, can_expand } = item;
  // proxied artwork (/api/...) needs a short-lived token; keep only stable URLs
  const stableThumbnail = thumbnail && !thumbnail.startsWith('/') ? thumbnail : undefined;
  await save(hass, [{ title, media_content_id, media_content_type, media_class, thumbnail: stableThumbnail, can_play, can_expand }, ...list]);
}

export async function removePinnedFavorite(hass: HomeAssistant, item: MediaPlayerItem) {
  const list = await getPinnedFavorites(hass);
  await save(
    hass,
    list.filter((f) => f.media_content_id !== item.media_content_id),
  );
}
