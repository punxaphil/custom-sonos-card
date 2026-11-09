import { describe, expect, it } from 'vitest';
import { buildBrowseIndex, filterByText, indexForLetter, indexLetter, normalizeText } from '../../src/utils/browse-index-utils';

const titles = (list: string[]) => list.map((title) => ({ title }));

describe('normalizeText', () => {
  it('removes accents and ligatures', () => {
    expect(normalizeText('Édith Piaf')).toBe('edith piaf');
    expect(normalizeText('Cœur de Pirate')).toBe('coeur de pirate');
    expect(normalizeText('Sigur Rós')).toBe('sigur ros');
  });
});

describe('indexLetter', () => {
  it('maps accented letters to their base letter', () => {
    expect(indexLetter('Émile Proulx')).toBe('E');
    expect(indexLetter('Ólafur Arnalds')).toBe('O');
  });
  it('puts digits, symbols and other scripts under #', () => {
    expect(indexLetter('2Pac')).toBe('#');
    expect(indexLetter('!!!')).toBe('#');
    expect(indexLetter('坂本龍一')).toBe('#');
    expect(indexLetter('')).toBe('#');
  });
  it('can ignore leading articles', () => {
    expect(indexLetter('The Beatles', true)).toBe('B');
    expect(indexLetter('Les Cowboys Fringants', true)).toBe('C');
    expect(indexLetter('The The', true)).toBe('T');
  });
});

describe('buildBrowseIndex', () => {
  const sorted = titles(['10cc', 'ABBA', 'Air', 'Beck', 'Björk', 'Coldplay', 'Daft Punk', 'Édith Piaf', 'Muse', 'Zaz']);

  it('finds the first item of each letter', () => {
    const index = buildBrowseIndex(sorted, 5);
    expect(index.useful).toBe(true);
    expect(index.firstIndex.get('#')).toBe(0);
    expect(index.firstIndex.get('B')).toBe(3);
    expect(index.firstIndex.get('E')).toBe(7);
    expect(index.available.has('Q')).toBe(false);
  });

  it('is not useful for short lists', () => {
    expect(buildBrowseIndex(sorted).useful).toBe(false);
  });

  it('is not useful for unsorted lists (album track listings)', () => {
    const tracks = titles(['Zebra', 'Apple', 'Mango', 'Banana', 'Yak', 'Cherry', 'Xylophone', 'Date', 'Walrus', 'Egg']);
    expect(buildBrowseIndex(tracks, 5).useful).toBe(false);
  });

  it('detects libraries that sort without "The"', () => {
    const list = titles(['Arcade Fire', 'The Beatles', 'Blur', 'The Cure', 'Daft Punk', 'The Doors', 'Eels', 'Feist']);
    const index = buildBrowseIndex(list, 5);
    expect(index.firstIndex.get('B')).toBe(1);
    expect(index.available.has('T')).toBe(false);
  });

  it('jumps to the next available letter', () => {
    const index = buildBrowseIndex(sorted, 5);
    expect(indexForLetter(index, 'F')).toBe(8); // no F → M (Muse)
    expect(indexForLetter(index, 'Z')).toBe(9);
  });
});

describe('filterByText', () => {
  const list = titles(['Cœur de Pirate', 'Daft Punk', 'Édith Piaf', 'Pink Floyd']);
  it('is accent and case insensitive', () => {
    expect(filterByText(list, 'coeur').map((i) => i.title)).toEqual(['Cœur de Pirate']);
    expect(filterByText(list, 'EDITH').map((i) => i.title)).toEqual(['Édith Piaf']);
  });
  it('matches every word in any order', () => {
    expect(filterByText(list, 'punk daft').map((i) => i.title)).toEqual(['Daft Punk']);
    expect(filterByText(list, 'pi').length).toBe(3);
  });
  it('returns everything for empty text', () => {
    expect(filterByText(list, '  ')).toBe(list);
  });
});
