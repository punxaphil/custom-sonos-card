import { describe, expect, it, vi } from 'vitest';
import { QueueController } from '../../../src/sections/queue/queue-controller';
import type Store from '../../../src/model/store';
import type { MediaPlayer } from '../../../src/model/media-player';
import type { MediaPlayerItem } from '../../../src/types';
import type { QueueHost } from '../../../src/sections/queue/queue.types';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

function player(id: string): MediaPlayer {
  return { id, attributes: {} } as MediaPlayer;
}

describe('QueueController', () => {
  it('keeps the current player queue when an older player response resolves last', async () => {
    const playerA = player('media_player.a');
    const playerB = player('media_player.b');
    const requestA = deferred<MediaPlayerItem[]>();
    const requestB = deferred<MediaPlayerItem[]>();
    const store = {
      activePlayer: playerA,
      hassService: {
        getQueue: vi.fn((activePlayer: MediaPlayer) => (activePlayer.id === playerA.id ? requestA.promise : requestB.promise)),
        musicAssistantService: { getCurrentQueueItemId: vi.fn().mockResolvedValue(null) },
      },
    } as unknown as Store;
    const host = {
      addController: vi.fn(),
      requestUpdate: vi.fn(),
      dispatchEvent: vi.fn(),
      shadowRoot: null,
    } as unknown as QueueHost;
    const controller = new QueueController(host, () => store);

    const fetchA = controller.fetchQueue();
    store.activePlayer = playerB;
    const fetchB = controller.fetchQueue();
    requestB.resolve([{ title: 'Player B', queueItemId: 'b' }]);
    await fetchB;
    requestA.resolve([{ title: 'Player A', queueItemId: 'a' }]);
    await fetchA;

    expect(controller.queueItems).toEqual([{ title: 'Player B', queueItemId: 'b' }]);
  });

  it('keeps the newer result when same-player requests resolve out of order', async () => {
    const activePlayer = player('media_player.mass');
    const firstRequest = deferred<MediaPlayerItem[]>();
    const secondRequest = deferred<MediaPlayerItem[]>();
    const getQueue = vi.fn().mockReturnValueOnce(firstRequest.promise).mockReturnValueOnce(secondRequest.promise);
    const store = {
      activePlayer,
      hassService: {
        getQueue,
        musicAssistantService: { getCurrentQueueItemId: vi.fn().mockResolvedValue(null) },
      },
    } as unknown as Store;
    const host = {
      addController: vi.fn(),
      requestUpdate: vi.fn(),
      dispatchEvent: vi.fn(),
      shadowRoot: null,
    } as unknown as QueueHost;
    const controller = new QueueController(host, () => store);

    const firstFetch = controller.fetchQueue();
    const secondFetch = controller.fetchQueue();
    secondRequest.resolve([{ title: 'New', queueItemId: 'new' }]);
    await secondFetch;
    firstRequest.resolve([{ title: 'Old', queueItemId: 'old' }]);
    await firstFetch;

    expect(controller.queueItems).toEqual([{ title: 'New', queueItemId: 'new' }]);
  });

  it('cancels a pending debounce when the active player changes', () => {
    vi.useFakeTimers();
    try {
      const playerA = player('media_player.a');
      const playerB = player('media_player.b');
      const getQueue = vi.fn().mockResolvedValue([]);
      const hassService = {
        getQueue,
        musicAssistantService: { getCurrentQueueItemId: vi.fn().mockResolvedValue(null) },
      };
      let store = { activePlayer: playerA, hassService } as unknown as Store;
      const host = {
        addController: vi.fn(),
        requestUpdate: vi.fn(),
        dispatchEvent: vi.fn(),
        shadowRoot: null,
      } as unknown as QueueHost;
      const controller = new QueueController(host, () => store);

      controller.hostUpdate();
      store = { activePlayer: playerA, hassService } as unknown as Store;
      controller.hostUpdate();
      store = { activePlayer: playerB, hassService } as unknown as Store;
      controller.hostUpdate();
      vi.runAllTimers();

      expect(getQueue.mock.calls.map(([activePlayer]) => activePlayer.id)).toEqual([playerA.id, playerB.id]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not invalidate an in-flight fetch during repeated same-player store updates', async () => {
    const activePlayer = player('media_player.mass');
    const request = deferred<MediaPlayerItem[]>();
    const getQueue = vi.fn().mockReturnValue(request.promise);
    const hassService = {
      getQueue,
      musicAssistantService: { getCurrentQueueItemId: vi.fn().mockResolvedValue(null) },
    };
    let store = { activePlayer, hassService } as unknown as Store;
    const host = {
      addController: vi.fn(),
      requestUpdate: vi.fn(),
      dispatchEvent: vi.fn(),
      shadowRoot: null,
    } as unknown as QueueHost;
    const controller = new QueueController(host, () => store);

    try {
      controller.hostUpdate();
      for (let i = 0; i < 3; i++) {
        store = { activePlayer, hassService } as unknown as Store;
        controller.hostUpdate();
      }
      request.resolve([{ title: 'Current', queueItemId: 'current' }]);

      await vi.waitFor(() => expect(controller.queueItems).toEqual([{ title: 'Current', queueItemId: 'current' }]));
      expect(getQueue).toHaveBeenCalledTimes(1);
    } finally {
      controller.hostDisconnected();
    }
  });
});
