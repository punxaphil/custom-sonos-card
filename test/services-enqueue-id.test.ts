import { describe, expect, it, vi } from 'vitest';
import MediaControlService from '../src/services/media-control-service';

describe('enqueue keeps Sonos ids untouched', () => {
  const folder = { title: 'Ait Menguellet', media_content_id: 'S://192.168.0.10/music/Kabyle/Ait%20Menguellet', media_content_type: 'directory' };
  const player = { id: 'media_player.kitchen', attributes: { platform: 'sonos' } } as never;

  it.each(['next', 'add', 'replace'] as const)('%s sends the browsed id', async (enqueue) => {
    const callMediaService = vi.fn(async () => undefined);
    const service = new MediaControlService({ callMediaService } as never, {} as never);
    await service.playMedia(player, folder as never, enqueue);
    expect(callMediaService).toHaveBeenCalledWith('play_media', expect.objectContaining({ media_content_id: folder.media_content_id, enqueue }));
  });
});
