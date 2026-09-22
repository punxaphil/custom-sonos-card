import { beforeAll, describe, expect, it, vi } from 'vitest';
import { QueueSonos } from '../../../src/sections/queue/queue-sonos';
import type Store from '../../../src/model/store';
import type { MediaPlayer } from '../../../src/model/media-player';
import type { MediaPlayerItem, OperationProgress } from '../../../src/types';
import type { QueueHeaderAction } from '../../../src/sections/queue/queue.types';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

interface TestableQueueSonos extends HTMLElement {
  store: Store;
  fetchQueue(): Promise<void>;
  requestLifecycleFetch(): void;
  onHeaderAction(event: CustomEvent<QueueHeaderAction>): void | Promise<void>;
  queueItems: MediaPlayerItem[];
  selectedIndices: Set<number>;
  cancelOperation: boolean;
  operationProgress: OperationProgress | null;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function player(id: string, queuePosition = 1): MediaPlayer {
  return { id, attributes: { queue_position: queuePosition } } as unknown as MediaPlayer;
}

function createElement(store: Store): TestableQueueSonos {
  const element = document.createElement('test-queue-sonos') as unknown as TestableQueueSonos;
  element.store = store;
  return element;
}

beforeAll(() => {
  if (!customElements.get('test-queue-sonos')) {
    customElements.define('test-queue-sonos', QueueSonos);
  }
});

describe('QueueSonos', () => {
  it('moves selected queue items to the end in queue order', async () => {
    const activePlayer = player('media_player.sonos');
    const queueItems = Array.from({ length: 5 }, (_, index) => ({ title: `Song ${index}`, media_content_id: `track:${index}` }));
    const moveQueueItemsToEnd = vi.fn();
    const store = {
      activePlayer,
      mediaControlService: { moveQueueItemsToEnd },
      hassService: { getQueue: vi.fn() },
    } as unknown as Store;
    const element = createElement(store);
    element.queueItems = queueItems;
    element.selectedIndices = new Set([4, 1, 3]);
    moveQueueItemsToEnd.mockImplementation(async () => {
      element.cancelOperation = true;
    });

    await element.onHeaderAction(new CustomEvent('queue-header-action', { detail: { type: 'queue-selected-at-end' } }));

    expect(moveQueueItemsToEnd).toHaveBeenCalledWith(activePlayer, queueItems, [1, 3, 4], expect.any(Function), expect.any(Function));
  });

  it('excludes the currently playing item when moving selected items to the end', async () => {
    const activePlayer = player('media_player.sonos', 4);
    const queueItems = Array.from({ length: 5 }, (_, index) => ({ title: `Song ${index}`, media_content_id: `track:${index}` }));
    const moveQueueItemsToEnd = vi.fn();
    const store = {
      activePlayer,
      mediaControlService: { moveQueueItemsToEnd },
      hassService: { getQueue: vi.fn() },
    } as unknown as Store;
    const element = createElement(store);
    element.queueItems = queueItems;
    element.selectedIndices = new Set([4, 3, 1]);
    moveQueueItemsToEnd.mockImplementation(async () => {
      element.cancelOperation = true;
    });

    await element.onHeaderAction(new CustomEvent('queue-header-action', { detail: { type: 'queue-selected-at-end' } }));

    expect(moveQueueItemsToEnd).toHaveBeenCalledWith(activePlayer, queueItems, [1, 4], expect.any(Function), expect.any(Function));
  });

  it('does nothing cleanly when only the currently playing item is selected', async () => {
    const activePlayer = player('media_player.sonos', 4);
    const queueItems = Array.from({ length: 5 }, (_, index) => ({ title: `Song ${index}`, media_content_id: `track:${index}` }));
    const moveQueueItemsToEnd = vi.fn();
    const store = {
      activePlayer,
      mediaControlService: { moveQueueItemsToEnd },
    } as unknown as Store;
    const element = createElement(store);
    element.queueItems = queueItems;
    element.selectedIndices = new Set([3]);

    await element.onHeaderAction(new CustomEvent('queue-header-action', { detail: { type: 'queue-selected-at-end' } }));

    expect(moveQueueItemsToEnd).not.toHaveBeenCalled();
    expect(element.operationProgress).toBeNull();
  });

  it('keeps the current player queue when an older player response resolves last', async () => {
    const playerA = player('media_player.a');
    const playerB = player('media_player.b');
    const requestA = deferred<MediaPlayerItem[]>();
    const requestB = deferred<MediaPlayerItem[]>();
    const store = {
      activePlayer: playerA,
      hassService: {
        getQueue: vi.fn((activePlayer: MediaPlayer) => (activePlayer.id === playerA.id ? requestA.promise : requestB.promise)),
      },
    } as unknown as Store;
    const element = createElement(store);

    const fetchA = element.fetchQueue();
    store.activePlayer = playerB;
    const fetchB = element.fetchQueue();
    requestB.resolve([{ title: 'Player B', media_content_id: 'track:b' }]);
    await fetchB;
    requestA.resolve([{ title: 'Player A', media_content_id: 'track:a' }]);
    await fetchA;

    expect(element.queueItems).toEqual([{ title: 'Player B', media_content_id: 'track:b' }]);
  });

  it('keeps the newer result when same-player requests resolve out of order', async () => {
    const activePlayer = player('media_player.sonos');
    const firstRequest = deferred<MediaPlayerItem[]>();
    const secondRequest = deferred<MediaPlayerItem[]>();
    const getQueue = vi.fn().mockReturnValueOnce(firstRequest.promise).mockReturnValueOnce(secondRequest.promise);
    const store = { activePlayer, hassService: { getQueue } } as unknown as Store;
    const element = createElement(store);

    const firstFetch = element.fetchQueue();
    const secondFetch = element.fetchQueue();
    secondRequest.resolve([{ title: 'New', media_content_id: 'track:new' }]);
    await secondFetch;
    firstRequest.resolve([{ title: 'Old', media_content_id: 'track:old' }]);
    await firstFetch;

    expect(element.queueItems).toEqual([{ title: 'New', media_content_id: 'track:new' }]);
  });

  it('keeps the existing array when fetched queue data is unchanged', async () => {
    const activePlayer = player('media_player.sonos');
    const queueItems: MediaPlayerItem[] = [{ title: 'Song', media_content_id: 'track:1' }];
    const store = {
      activePlayer,
      hassService: { getQueue: vi.fn().mockResolvedValue(queueItems.map((item) => ({ ...item }))) },
    } as unknown as Store;
    const element = createElement(store);
    element.queueItems = queueItems;

    await element.fetchQueue();

    expect(element.queueItems).toBe(queueItems);
  });

  it('coalesces repeated lifecycle refreshes for the same player', async () => {
    const activePlayer = player('media_player.sonos');
    const firstRequest = deferred<MediaPlayerItem[]>();
    const secondRequest = deferred<MediaPlayerItem[]>();
    const getQueue = vi.fn().mockReturnValueOnce(firstRequest.promise).mockReturnValueOnce(secondRequest.promise);
    const store = { activePlayer, hassService: { getQueue } } as unknown as Store;
    const element = createElement(store);

    element.requestLifecycleFetch();
    element.requestLifecycleFetch();
    element.requestLifecycleFetch();
    expect(getQueue).toHaveBeenCalledTimes(1);

    firstRequest.resolve([{ title: 'First', media_content_id: 'track:first' }]);
    await vi.waitFor(() => expect(getQueue).toHaveBeenCalledTimes(2));
    secondRequest.resolve([{ title: 'Latest', media_content_id: 'track:latest' }]);
    await vi.waitFor(() => expect(element.queueItems).toEqual([{ title: 'Latest', media_content_id: 'track:latest' }]));
  });
});
