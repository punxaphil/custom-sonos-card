import { describe, expect, it, vi } from 'vitest';
import HassService from '../src/services/hass-service';

function makePlayer(queueSize: number, shuffle = false) {
  return { id: 'media_player.kitchen', attributes: { queue_size: queueSize, shuffle } } as never;
}

describe('Sonos queue cache', () => {
  it('asks the speaker once for many callers and refetches only when the queue changes', async () => {
    const callWS = vi.fn(async () => ({
      response: { 'media_player.kitchen': [{ media_artist: 'A', media_title: 'B', media_content_id: 'x', media_content_type: 'music' }] },
    }));
    const hass = { callWS, states: {} } as never;
    const service = new HassService(hass, 'queue' as never, document.createElement('div'));
    (service as unknown as { isMusicAssistant: () => boolean }).isMusicAssistant = () => false;

    await Promise.all([service.getQueue(makePlayer(5232)), service.getQueue(makePlayer(5232)), service.getQueue(makePlayer(5232))]);
    expect(callWS).toHaveBeenCalledTimes(1);

    await service.getQueue(makePlayer(5233));
    expect(callWS).toHaveBeenCalledTimes(2);

    await service.getQueue(makePlayer(5233), true);
    expect(callWS).toHaveBeenCalledTimes(3);
  });

  it('backs off after a failure instead of retrying on every update', async () => {
    const callWS = vi.fn(async () => {
      throw new Error('Read timed out');
    });
    const service = new HassService({ callWS, states: {} } as never, 'queue' as never, document.createElement('div'));
    (service as unknown as { isMusicAssistant: () => boolean }).isMusicAssistant = () => false;
    const player = { id: 'media_player.other', attributes: { queue_size: 10, shuffle: false } } as never;
    await expect(service.getQueue(player)).rejects.toThrow();
    await expect(service.getQueue(player)).rejects.toThrow();
    expect(callWS).toHaveBeenCalledTimes(1);
  });
});
