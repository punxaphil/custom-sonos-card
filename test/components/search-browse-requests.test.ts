import { afterEach, describe, expect, it, vi } from 'vitest';
import Store from '../../src/model/store';
import { MusicAssistantService } from '../../src/services/music-assistant-service';
import { SearchBrowseView } from '../../src/sections/search/search-browse-view';
import { SearchResultItem } from '../../src/sections/search/search.types';
import '../../src/sections/search/search-browse-view';

const PODCAST_A: SearchResultItem = { title: 'Podcast A', uri: 'library://podcast/1', mediaType: 'podcast' };
const PODCAST_B: SearchResultItem = { title: 'Podcast B', uri: 'library://podcast/2', mediaType: 'podcast' };
const EPISODE_A: SearchResultItem = { title: 'Episode A', uri: 'provider://podcast_episode/1', mediaType: 'podcast_episode' };
const EPISODE_B: SearchResultItem = { title: 'Episode B', uri: 'provider://podcast_episode/2', mediaType: 'podcast_episode' };

describe('collection request navigation', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it.each([
    ['success', false],
    ['failure', false],
    ['success', true],
    ['failure', true],
  ] as const)('ignores stale %s when the active request has completed: %s', async (outcome, activeCompleted) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let resolveA!: (items: SearchResultItem[]) => void;
    let rejectA!: (error: Error) => void;
    let resolveB!: (items: SearchResultItem[]) => void;
    const pendingA = new Promise<SearchResultItem[]>((resolve, reject) => {
      resolveA = resolve;
      rejectA = reject;
    });
    const pendingB = new Promise<SearchResultItem[]>((resolve) => {
      resolveB = resolve;
    });
    const service: MusicAssistantService = Object.create(MusicAssistantService.prototype);
    const getItems = vi.spyOn(service, 'getCollectionItems').mockReturnValueOnce(pendingA).mockReturnValueOnce(pendingB);
    const store: Store = Object.create(Store.prototype);
    store.config = { type: 'custom:maxi-media-player' };
    const element = document.createElement('sonos-search-browse-view') as SearchBrowseView;
    element.store = store;
    element.musicAssistantService = service;
    element.item = PODCAST_A;
    document.body.appendChild(element);
    await element.updateComplete;

    element.shadowRoot!.querySelector<HTMLElement>('sonos-icon-button')!.click();
    element.item = null;
    await element.updateComplete;
    element.item = PODCAST_B;
    await element.updateComplete;
    expect(getItems).toHaveBeenCalledTimes(2);
    if (activeCompleted) {
      resolveB([EPISODE_B]);
      await pendingB;
      await element.updateComplete;
    }
    if (outcome === 'success') {
      resolveA([EPISODE_A]);
    } else {
      rejectA(new Error('Stale failure'));
    }
    await pendingA.catch(() => {});
    await element.updateComplete;
    expect(element.shadowRoot!.querySelector('.loading')!.hasAttribute('hidden')).toBe(activeCompleted);
    expect(element.shadowRoot!.querySelectorAll('sonos-media-row')).toHaveLength(activeCompleted ? 1 : 0);
    expect(element.shadowRoot!.textContent).not.toContain('Stale failure');
    if (!activeCompleted) {
      resolveB([EPISODE_B]);
      await pendingB;
      await element.updateComplete;
    }
    const row = element.shadowRoot!.querySelector<HTMLElement & { item: { media_content_id: string } }>('sonos-media-row')!;
    expect(row.item.media_content_id).toBe(EPISODE_B.uri);
    expect(element.shadowRoot!.querySelector('.browse-title')!.textContent).toBe(PODCAST_B.title);
  });
});
