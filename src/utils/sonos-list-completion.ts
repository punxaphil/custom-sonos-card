import type { MediaPlayerItem } from '../upstream/data/media-player';
import { INDEX_LETTERS, INDEX_SYMBOL, indexLetter, sortByTitle } from './browse-index-utils';

/** Sonos speakers return at most this many items for one browse request. */
export const SONOS_MAX_ITEMS = 1000;

/** Top-level Sonos library categories (A:ALBUMARTIST, A:ALBUM, A:GENRE…) that support prefix search. */
const LIBRARY_CATEGORY = /^A:[A-Z]+$/;

/** Accented first letters searched in addition to the plain letter (Édith Piaf, Ólafur Arnalds…). */
const ACCENTED: Record<string, string[]> = {
  A: ['À', 'Â', 'Á', 'Ä'],
  C: ['Ç'],
  E: ['É', 'È', 'Ê', 'Ë'],
  I: ['Î', 'Í', 'Ï'],
  O: ['Ô', 'Ó', 'Ö', 'Ø'],
  U: ['Ù', 'Û', 'Ú', 'Ü'],
};

export function isTruncatedSonosList(item: MediaPlayerItem): boolean {
  return (item.children?.length ?? 0) >= SONOS_MAX_ITEMS && LIBRARY_CATEGORY.test(item.media_content_id ?? '');
}

/**
 * Home Assistant's Sonos integration asks the speaker for a whole category in one request, and the
 * speaker stops at 1000 items (e.g. artists A → P). Sonos also answers prefix searches such as
 * "A:ALBUMARTIST:Q" (items with a word starting with Q, those starting with Q first), so the missing
 * part is fetched one letter at a time, from the letter of the last item received to Z.
 * `onProgress` gets the merged list after every letter, so the screen fills in progressively.
 */
export async function completeSonosList(
  item: MediaPlayerItem,
  browse: (mediaContentId: string) => Promise<MediaPlayerItem>,
  onProgress: (merged: MediaPlayerItem) => void,
): Promise<MediaPlayerItem> {
  const children = item.children ?? [];
  const lastLetter = indexLetter(children[children.length - 1]?.title);
  const startIndex = lastLetter === INDEX_SYMBOL ? 1 : INDEX_LETTERS.indexOf(lastLetter);
  const letters = INDEX_LETTERS.slice(Math.max(1, startIndex));
  const firstMissing = letters[0];
  // keep everything sorted before the partially received letter; that letter is fetched again in full
  const head = children.filter((child) => {
    const letter = indexLetter(child.title);
    return letter === INDEX_SYMBOL || letter < firstMissing;
  });
  const seen = new Set(head.map((child) => child.media_content_id));
  const byLetter = new Map<string, MediaPlayerItem[]>();
  for (const child of children) {
    const letter = indexLetter(child.title);
    if (letters.includes(letter) && !seen.has(child.media_content_id)) {
      seen.add(child.media_content_id);
      byLetter.set(letter, [...(byLetter.get(letter) ?? []), child]);
    }
  }
  let merged = item;
  for (const letter of letters) {
    for (const prefix of [letter, ...(ACCENTED[letter] ?? [])]) {
      try {
        const result = await browse(`${item.media_content_id}:${prefix}`);
        for (const child of result.children ?? []) {
          if (indexLetter(child.title) === letter && !seen.has(child.media_content_id)) {
            seen.add(child.media_content_id);
            byLetter.set(letter, [...(byLetter.get(letter) ?? []), child]);
          }
        }
      } catch {
        // speaker busy or prefix unsupported: keep what we have and continue
      }
    }
    const tail = letters.flatMap((l) => sortByTitle(byLetter.get(l) ?? []));
    merged = { ...item, children: [...head, ...tail] };
    onProgress(merged);
  }
  return merged;
}
