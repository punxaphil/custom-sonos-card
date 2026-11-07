/**
 * Helpers for the alphabetical index (A–Z rail) and the quick filter of the media browser.
 * Pure functions, no DOM – easy to unit test.
 */

export const INDEX_SYMBOL = '#';
export const INDEX_LETTERS = [INDEX_SYMBOL, ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

/** Minimum number of items before the A–Z rail is shown. */
export const MIN_ITEMS_FOR_INDEX = 40;

/** Share of neighbours that must be in alphabetical order for the list to be considered sorted. */
const SORTED_THRESHOLD = 0.85;

// Leading articles that libraries (Sonos, Plex, Jellyfin, Music Assistant…) commonly ignore when sorting.
const ARTICLES = /^(the|a|an|les|le|la|l'|l’|los|las|el|die|der|das)\s*/i;

export interface TitledItem {
  title?: string;
}

export interface BrowseIndex {
  /** Letters that have at least one item. */
  available: Set<string>;
  /** First item index for each available letter. */
  firstIndex: Map<string, number>;
  /** Letter for each item, same order as the items. */
  letters: string[];
  /** True when the rail is worth showing (enough items, alphabetical order). */
  useful: boolean;
}

/** Lower-case, strip accents and diacritics (é → e, œ → oe, ß → ss). */
export function normalizeText(text: string | undefined): string {
  return (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/gi, 'oe').replace(/æ/gi, 'ae').replace(/ß/g, 'ss').toLowerCase().trim();
}

export function stripArticle(text: string): string {
  const stripped = text.replace(ARTICLES, '');
  return stripped.length ? stripped : text;
}

/** Index letter of a title: A–Z, or '#' for digits, symbols and non-latin scripts. */
export function indexLetter(title: string | undefined, ignoreArticles = false): string {
  let text = normalizeText(title);
  if (ignoreArticles) {
    text = stripArticle(text);
  }
  // Libraries sort titles starting with digits or punctuation ("!!!", "2Pac", "(What's the Story)") first,
  // so they all go under '#'.
  const first = text.charAt(0).toUpperCase();
  return first >= 'A' && first <= 'Z' ? first : INDEX_SYMBOL;
}

function letterRank(letter: string) {
  return letter === INDEX_SYMBOL ? -1 : letter.charCodeAt(0);
}

function sortedRatio(letters: string[]): number {
  if (letters.length < 2) {
    return 1;
  }
  let ordered = 0;
  for (let i = 1; i < letters.length; i++) {
    if (letterRank(letters[i]) >= letterRank(letters[i - 1])) {
      ordered++;
    }
  }
  return ordered / (letters.length - 1);
}

/**
 * Build the A–Z index for a list. Detects automatically whether the source sorts with or without
 * leading articles ("The Beatles" under T or B) so a letter jumps to where the items really are.
 */
export function buildBrowseIndex(items: TitledItem[], minItems = MIN_ITEMS_FOR_INDEX): BrowseIndex {
  const plain = items.map((item) => indexLetter(item.title));
  const withoutArticles = items.map((item) => indexLetter(item.title, true));
  const plainRatio = sortedRatio(plain);
  const articleRatio = sortedRatio(withoutArticles);
  const letters = articleRatio > plainRatio ? withoutArticles : plain;
  const ratio = Math.max(plainRatio, articleRatio);

  const firstIndex = new Map<string, number>();
  letters.forEach((letter, index) => {
    if (!firstIndex.has(letter)) {
      firstIndex.set(letter, index);
    }
  });
  return {
    available: new Set(firstIndex.keys()),
    firstIndex,
    letters,
    useful: items.length >= minItems && ratio >= SORTED_THRESHOLD && firstIndex.size > 1,
  };
}

/**
 * Index to scroll to for a letter. When the letter has no items, go to the next letter that has some
 * (like the iOS contacts app) so the rail never feels "dead".
 */
export function indexForLetter(index: BrowseIndex, letter: string): number | undefined {
  const start = INDEX_LETTERS.indexOf(letter);
  if (start < 0) {
    return undefined;
  }
  for (let i = start; i < INDEX_LETTERS.length; i++) {
    const found = index.firstIndex.get(INDEX_LETTERS[i]);
    if (found !== undefined) {
      return found;
    }
  }
  for (let i = start - 1; i >= 0; i--) {
    const found = index.firstIndex.get(INDEX_LETTERS[i]);
    if (found !== undefined) {
      return found;
    }
  }
  return undefined;
}

/** Accent- and case-insensitive filter. Every word typed must appear in the title ("daft pu" matches "Daft Punk"). */
export function filterByText<T extends TitledItem>(items: T[], text: string | undefined): T[] {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  if (!words.length) {
    return items;
  }
  return items.filter((item) => {
    const title = normalizeText(item.title);
    return words.every((word) => title.includes(word));
  });
}

const titleCollator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true, ignorePunctuation: false });

/** Copy of the items sorted by title: accent/case-insensitive, numbers in natural order, '#' items first. */
export function sortByTitle<T extends TitledItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const la = indexLetter(a.title);
    const lb = indexLetter(b.title);
    if ((la === INDEX_SYMBOL) !== (lb === INDEX_SYMBOL)) {
      return la === INDEX_SYMBOL ? -1 : 1;
    }
    return titleCollator.compare(normalizeText(a.title), normalizeText(b.title));
  });
}
