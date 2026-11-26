import { afterEach, describe, expect, it, vi } from 'vitest';
import Store from '../../src/model/store';
import { MusicAssistantService } from '../../src/services/music-assistant-service';
import { SearchResults } from '../../src/sections/search/search-results';
import { SearchBrowseView } from '../../src/sections/search/search-browse-view';
import { PlayMenu } from '../../src/components/play-menu';
import { SearchResultItem } from '../../src/sections/search/search.types';
import { Search } from '../../src/sections/search/search-section';
import { SearchHeader } from '../../src/sections/search/search-header';
import { MediaPlayer } from '../../src/model/media-player';
import '../../src/sections/search/search-results';
import '../../src/sections/search/search-browse-view';
import '../../src/components/play-menu';
import '../../src/sections/search/search-section';

customElements.define('test-podcast-search', Search);

const PODCAST: SearchResultItem = { title: 'Example podcast', uri: 'library://podcast/12', mediaType: 'podcast' };
const EPISODE: SearchResultItem = { title: 'Episode 34', uri: 'provider://podcast_episode/34', mediaType: 'podcast_episode' };

function createStore(): Store {
  const store: Store = Object.create(Store.prototype);
  store.config = { type: 'custom:maxi-media-player' };
  store.activePlayer = new MediaPlayer(
    { entity_id: 'media_player.test', state: 'idle', attributes: {}, last_changed: '', last_updated: '', context: { id: '', parent_id: null, user_id: null } },
    store.config,
  );
  return store;
}

describe('podcast search navigation', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it.each(['list', 'grid'] as const)('opens episodes when clicking a podcast in %s view', async (viewMode) => {
    const element = document.createElement('sonos-search-results') as SearchResults;
    element.store = createStore();
    element.results = [PODCAST];
    element.viewMode = viewMode;
    const onBrowse = vi.fn();
    element.addEventListener('browse-collection', onBrowse);
    document.body.appendChild(element);
    await element.updateComplete;

    element.shadowRoot!.querySelector<HTMLElement>(viewMode === 'list' ? 'sonos-media-row' : '.grid-tile')!.click();
    expect(onBrowse).toHaveBeenCalledWith(expect.objectContaining({ detail: PODCAST }));
  });

  it('selects podcasts rather than browsing them in selection mode', async () => {
    const element = document.createElement('sonos-search-results') as SearchResults;
    element.store = createStore();
    element.results = [PODCAST];
    element.selectMode = true;
    const onBrowse = vi.fn();
    element.addEventListener('browse-collection', onBrowse);
    document.body.appendChild(element);
    await element.updateComplete;

    element.shadowRoot!.querySelector<HTMLElement>('sonos-media-row')!.click();
    expect(element.hasPodcastSelection()).toBe(true);
    expect(onBrowse).not.toHaveBeenCalled();
  });

  it('updates radio visibility when selected result types change or a podcast is added to the selection', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
    const store = createStore();
    store.config.entityPlatform = 'music_assistant';
    store.hass = Object.create(null);
    store.hass.callWS = vi.fn().mockResolvedValue([{ domain: 'music_assistant', state: 'loaded', entry_id: 'mass-entry' }]);
    const element = document.createElement('test-podcast-search') as Search;
    element.store = store;
    element.results = [{ title: 'Song', uri: 'library://track/1', mediaType: 'track' }, PODCAST];
    document.body.appendChild(element);
    await vi.waitFor(() => expect(element.shadowRoot!.querySelector('sonos-search-header')).not.toBeNull());
    const results = element.shadowRoot!.querySelector<SearchResults>('sonos-search-results')!;
    const header = element.shadowRoot!.querySelector<SearchHeader>('sonos-search-header')!;
    await results.updateComplete;
    results.selectMode = true;
    results.shadowRoot!.querySelectorAll<HTMLElement>('sonos-media-row')[0].click();
    await element.updateComplete;
    expect(header.showRadio).toBe(true);
    results.shadowRoot!.querySelectorAll<HTMLElement>('sonos-media-row')[1].click();
    await element.updateComplete;
    expect(header.showRadio).toBe(false);
    element.results = [element.results[0]];
    await element.updateComplete;
    expect(header.showRadio).toBe(true);
    element.results = [PODCAST];
    await element.updateComplete;
    expect(header.showRadio).toBe(false);
  });

  it('renders episodes and plays the clicked episode through the existing media control service', async () => {
    const store = createStore();
    const service: MusicAssistantService = Object.create(MusicAssistantService.prototype);
    vi.spyOn(service, 'getCollectionItems').mockResolvedValue([EPISODE]);
    store.mediaControlService = Object.create(null);
    store.mediaControlService.playMedia = vi.fn();
    const element = document.createElement('sonos-search-browse-view') as SearchBrowseView;
    element.store = store;
    element.musicAssistantService = service;
    element.massQueueConfigEntryId = 'queue-entry';
    element.item = PODCAST;
    document.body.appendChild(element);
    await vi.waitFor(() => expect(element.shadowRoot!.querySelector('sonos-media-row')).not.toBeNull());

    expect(service.getCollectionItems).toHaveBeenCalledWith(PODCAST.uri, 'podcast', 'queue-entry');
    expect(element.shadowRoot!.querySelector('[value="1"]')!.hasAttribute('hidden')).toBe(true);
    element.shadowRoot!.querySelector<HTMLElement>('sonos-media-row')!.click();
    expect(store.mediaControlService.playMedia).toHaveBeenCalledWith(
      store.activePlayer,
      { title: EPISODE.title, media_content_id: EPISODE.uri, media_content_type: 'podcast_episode', thumbnail: undefined },
      'play',
    );
  });

  it('shows episode loading failures instead of an empty result message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const service: MusicAssistantService = Object.create(MusicAssistantService.prototype);
    vi.spyOn(service, 'getCollectionItems').mockRejectedValue(new Error('Episode request failed'));
    const element = document.createElement('sonos-search-browse-view') as SearchBrowseView;
    element.store = createStore();
    element.musicAssistantService = service;
    element.item = PODCAST;
    document.body.appendChild(element);
    await vi.waitFor(() => expect(element.shadowRoot!.textContent).toContain('Episode request failed'));
    const messages = element.shadowRoot!.querySelectorAll('.no-results');
    expect(messages[0].hasAttribute('hidden')).toBe(false);
    expect(messages[1].hasAttribute('hidden')).toBe(true);
  });

  it.each([false, true])('hides radio only when showRadio is false (inline: %s)', async (inline) => {
    const element = document.createElement('sonos-play-menu') as PlayMenu;
    element.hasSelection = true;
    element.inline = inline;
    element.showRadio = false;
    document.body.appendChild(element);
    await element.updateComplete;
    const radio = element.shadowRoot!.querySelector(inline ? '.inline-menu-item:nth-of-type(2)' : '[value="1"]');
    expect(radio!.hasAttribute('hidden')).toBe(true);
    element.showRadio = true;
    await element.updateComplete;
    expect(radio!.hasAttribute('hidden')).toBe(false);
  });
});
