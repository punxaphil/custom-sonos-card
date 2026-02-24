import { CalculateVolume, CardConfig, MediaPlayerItem, PredefinedGroup } from '../types';
import HassService from './hass-service';
import { MediaPlayer } from '../model/media-player';

export default class MediaControlService {
  private hassService: HassService;
  private readonly config: CardConfig;

  constructor(hassService: HassService, config: CardConfig) {
    this.hassService = hassService;
    this.config = config;
  }

  private isMusicAssistant(mediaPlayer: MediaPlayer): boolean {
    return mediaPlayer.attributes.platform === 'music_assistant';
  }

  async join(main: string, memberIds: string[]) {
    await this.hassService.callMediaService('join', {
      entity_id: main,
      group_members: memberIds,
    });
  }

  async unJoin(playerIds: string[]) {
    await this.hassService.callMediaService('unjoin', {
      entity_id: playerIds,
    });
  }

  async activatePredefinedGroup(pg: PredefinedGroup) {
    for (const pgp of pg.entities) {
      const volume = pgp.volume ?? pg.volume;
      if (volume) {
        await this.volumeSetSinglePlayer(pgp.player, volume);
      }
      if (pg.unmuteWhenGrouped) {
        await this.setVolumeMute(pgp.player, false, false);
      }
      await this.applyPredefinedGroupSettings(pgp.player, pg);
    }
    if (pg.media) {
      await this.setSource(pg.entities[0].player, pg.media);
    }
  }

  private async applyPredefinedGroupSettings(player: MediaPlayer, pg: PredefinedGroup) {
    await this.hassService.setRelatedEntityValue(player, 'bass', pg.bass);
    await this.hassService.setRelatedEntityValue(player, 'treble', pg.treble);
    await this.hassService.setRelatedEntityValue(player, 'loudness', pg.loudness);
    await this.hassService.setRelatedEntityValue(player, 'night_sound', pg.nightSound);
    await this.hassService.setRelatedEntityValue(player, 'speech_enhancement', pg.speechEnhancement);
    await this.hassService.setRelatedEntityValue(player, 'crossfade', pg.crossfade);
    await this.hassService.setRelatedEntityValue(player, 'touch_controls', pg.touchControls);
    await this.hassService.setRelatedEntityValue(player, 'status_light', pg.statusLight);
  }

  async stop(mediaPlayer: MediaPlayer) {
    await this.hassService.callMediaService('media_stop', { entity_id: mediaPlayer.id });
  }

  async pause(mediaPlayer: MediaPlayer) {
    await this.hassService.callMediaService('media_pause', { entity_id: mediaPlayer.id });
  }

  async prev(mediaPlayer: MediaPlayer) {
    await this.hassService.callMediaService('media_previous_track', {
      entity_id: mediaPlayer.id,
    });
  }

  async next(mediaPlayer: MediaPlayer) {
    await this.hassService.callMediaService('media_next_track', { entity_id: mediaPlayer.id });
  }

  async play(mediaPlayer: MediaPlayer) {
    await this.hassService.callMediaService('media_play', { entity_id: mediaPlayer.id });
  }

  async shuffle(mediaPlayer: MediaPlayer) {
    await this.hassService.callMediaService('shuffle_set', {
      entity_id: mediaPlayer.id,
      shuffle: !mediaPlayer.attributes.shuffle,
    });
  }

  async repeat(mediaPlayer: MediaPlayer) {
    const currentState = mediaPlayer.attributes.repeat;
    const repeat = currentState === 'all' ? 'one' : currentState === 'one' ? 'off' : 'all';
    await this.hassService.callMediaService('repeat_set', { entity_id: mediaPlayer.id, repeat });
  }

  async volumeDown(mainPlayer: MediaPlayer, updateMembers = true) {
    await this.volumeStep(mainPlayer, updateMembers, this.getStepDownVolume, 'volume_down');
  }

  async volumeUp(mainPlayer: MediaPlayer, updateMembers = true) {
    await this.volumeStep(mainPlayer, updateMembers, this.getStepUpVolume, 'volume_up');
  }

  private async volumeStep(
    mainPlayer: MediaPlayer,
    updateMembers: boolean,
    calculateVolume: (member: MediaPlayer, volumeStepSize: number) => number,
    stepDirection: string,
  ) {
    if (this.config.volumeStepSize) {
      await this.volumeWithStepSize(mainPlayer, updateMembers, this.config.volumeStepSize, calculateVolume);
    } else {
      await this.volumeDefaultStep(mainPlayer, updateMembers, stepDirection);
    }
  }

  private async volumeWithStepSize(mainPlayer: MediaPlayer, updateMembers: boolean, volumeStepSize: number, calculateVolume: CalculateVolume) {
    for (const member of mainPlayer.members) {
      if (mainPlayer.id === member.id || updateMembers) {
        const newVolume = calculateVolume(member, volumeStepSize);
        await this.volumeSetSinglePlayer(member, newVolume);
      }
    }
  }

  private getStepDownVolume(member: MediaPlayer, volumeStepSize: number) {
    return Math.max(0, member.getVolume() - volumeStepSize);
  }

  private getStepUpVolume(member: MediaPlayer, stepSize: number) {
    return Math.min(100, member.getVolume() + stepSize);
  }

  private async volumeDefaultStep(mainPlayer: MediaPlayer, updateMembers: boolean, stepDirection: string) {
    for (const member of mainPlayer.members) {
      if (mainPlayer.id === member.id || updateMembers) {
        if (!member.ignoreVolume) {
          await this.hassService.callMediaService(stepDirection, { entity_id: member.id });
        }
      }
    }
  }

  async volumeSet(player: MediaPlayer, volume: number, updateMembers: boolean) {
    if (updateMembers) {
      return await this.volumeSetGroup(player, volume);
    } else {
      return await this.volumeSetSinglePlayer(player, volume);
    }
  }
  private async volumeSetGroup(player: MediaPlayer, volumePercent: number) {
    const allZero = player.members.every((member) => member.getVolume() === 0);
    if (allZero) {
      await Promise.all(
        player.members.map((member) => {
          return this.volumeSetSinglePlayer(member, volumePercent);
        }),
      );
    } else {
      let relativeVolumeChange: number | undefined;
      if (this.config.adjustVolumeRelativeToMainPlayer) {
        relativeVolumeChange = player.getVolume() < 1 ? 1 : volumePercent / player.getVolume();
      }

      await Promise.all(
        player.members.map((member) => {
          let memberVolume = volumePercent;
          if (relativeVolumeChange !== undefined) {
            if (this.config.adjustVolumeRelativeToMainPlayer) {
              memberVolume = member.getVolume() * relativeVolumeChange;
              memberVolume = Math.min(100, Math.max(0, memberVolume));
            }
          }
          return this.volumeSetSinglePlayer(member, memberVolume);
        }),
      );
    }
  }

  async volumeSetSinglePlayer(player: MediaPlayer, volumePercent: number) {
    if (!player.ignoreVolume) {
      const volume = volumePercent / 100;
      await this.hassService.callMediaService('volume_set', { entity_id: player.id, volume_level: volume });
    }
  }

  async toggleMute(mediaPlayer: MediaPlayer, updateMembers = true) {
    const isMuted = updateMembers ? mediaPlayer.isGroupMuted() : mediaPlayer.isMemberMuted();
    const muteVolume = !isMuted;
    await this.setVolumeMute(mediaPlayer, muteVolume, updateMembers);
  }

  async setVolumeMute(mediaPlayer: MediaPlayer, muteVolume: boolean, updateMembers = true) {
    for (const member of mediaPlayer.members) {
      if (mediaPlayer.id === member.id || updateMembers) {
        await this.hassService.callMediaService('volume_mute', { entity_id: member.id, is_volume_muted: muteVolume });
      }
    }
  }

  async setSource(mediaPlayer: MediaPlayer, source: string) {
    await this.hassService.callMediaService('select_source', { source: source, entity_id: mediaPlayer.id });
  }

  async playMedia(mediaPlayer: MediaPlayer, item: MediaPlayerItem, enqueue?: 'add' | 'next' | 'replace' | 'play') {
    const mediaContentId = enqueue ? this.transformMediaContentId(item.media_content_id ?? '') : (item.media_content_id ?? '');

    if (this.config.entityPlatform === 'music_assistant') {
      await this.hassService.callWithLoader(() => this.hassService.musicAssistantService.playMedia(mediaPlayer, mediaContentId, enqueue));
    } else {
      await this.hassService.callMediaService('play_media', {
        entity_id: mediaPlayer.id,
        media_content_id: mediaContentId,
        media_content_type: item.media_content_type ?? 'music',
        ...(enqueue && { enqueue }),
      });
    }
  }

  async playQueue(mediaPlayer: MediaPlayer, queuePosition: number, queueItemId?: string) {
    if (this.isMusicAssistant(mediaPlayer) && queueItemId) {
      await this.hassService.callWithLoader(() => this.hassService.musicAssistantService.playQueueItem(mediaPlayer, queueItemId));
    } else {
      await this.hassService.callWithLoader(() =>
        this.hassService.callService('sonos', 'play_queue', {
          entity_id: mediaPlayer.id,
          queue_position: queuePosition,
        }),
      );
    }
  }

  async moveQueueItemAfterCurrent(mediaPlayer: MediaPlayer, item: MediaPlayerItem, index: number, currentIndex: number) {
    // For Music Assistant, can't move the currently playing item or the next buffered item
    if (this.isMusicAssistant(mediaPlayer)) {
      if (index === currentIndex || index === currentIndex + 1) {
        return;
      }
      if (item.queueItemId) {
        await this.hassService.musicAssistantService.moveQueueItemNext(mediaPlayer, item.queueItemId);
      }
    } else {
      await this.playMedia(mediaPlayer, item, 'next');
      const removeIndex = index > currentIndex ? index + 1 : index;
      await this.hassService.removeFromQueue(mediaPlayer, removeIndex, item.queueItemId);
    }
  }

  async moveQueueItemsAfterCurrent(
    mediaPlayer: MediaPlayer,
    items: MediaPlayerItem[],
    indices: number[],
    currentIndex: number,
    onProgress?: (completed: number) => void,
    shouldCancel?: () => boolean,
  ) {
    // For Music Assistant, use mass_queue.move_queue_item_next for each item
    if (this.isMusicAssistant(mediaPlayer)) {
      // Filter out the currently playing item and buffered next item - can't move them
      const filteredIndices = indices.filter((i) => i !== currentIndex && i !== currentIndex + 1);
      const reversedForInsert = [...filteredIndices].reverse();
      let completed = 0;
      for (const index of reversedForInsert) {
        if (shouldCancel?.()) {
          return;
        }
        const item = items[index];
        if (item?.queueItemId) {
          await this.hassService.musicAssistantService.moveQueueItemNext(mediaPlayer, item.queueItemId);
        }
        completed++;
        onProgress?.(completed);
      }
      return;
    }

    // For Sonos, use the old approach
    const reversedForInsert = [...indices].reverse();
    let completed = 0;

    for (const index of reversedForInsert) {
      if (shouldCancel?.()) {
        return;
      }
      const item = items[index];
      if (item?.media_content_id) {
        await this.playMedia(mediaPlayer, item, 'next');
      }
      completed++;
      onProgress?.(completed);
    }

    const numInserted = indices.length;
    const reversedIndices = [...indices].reverse();
    for (const originalIndex of reversedIndices) {
      if (shouldCancel?.()) {
        return;
      }
      const item = items[originalIndex];
      const removeIndex = originalIndex > currentIndex ? originalIndex + numInserted : originalIndex;
      await this.hassService.removeFromQueue(mediaPlayer, removeIndex, item?.queueItemId);
    }
  }

  async moveQueueItemsToEnd(
    mediaPlayer: MediaPlayer,
    items: MediaPlayerItem[],
    indices: number[],
    onProgress?: (completed: number) => void,
    shouldCancel?: () => boolean,
  ) {
    // First, add all items to the end of the queue
    let completed = 0;
    for (const index of indices) {
      if (shouldCancel?.()) {
        return;
      }
      const item = items[index];
      if (item?.media_content_id) {
        await this.playMedia(mediaPlayer, item, 'add');
      }
      completed++;
      onProgress?.(completed);
    }

    // Then remove original positions in reverse order (to preserve indices)
    const reversedIndices = [...indices].reverse();
    for (const originalIndex of reversedIndices) {
      if (shouldCancel?.()) {
        return;
      }
      const item = items[originalIndex];
      await this.hassService.removeFromQueue(mediaPlayer, originalIndex, item?.queueItemId);
    }
  }

  async queueAndPlay(
    mediaPlayer: MediaPlayer,
    items: MediaPlayerItem[],
    enqueueMode: 'replace' | 'play',
    onProgress?: (completed: number) => void,
    shouldCancel?: () => boolean,
  ) {
    if (items.length === 0) {
      return;
    }

    const [firstItem, ...restItems] = items;
    await this.playMedia(mediaPlayer, firstItem, enqueueMode);
    onProgress?.(1);

    // Add remaining items in reverse order with 'next' so they appear in correct sequence
    for (let i = restItems.length - 1; i >= 0; i--) {
      if (shouldCancel?.()) {
        return;
      }
      await this.playMedia(mediaPlayer, restItems[i], 'next');
      onProgress?.(restItems.length - i + 1);
    }
  }

  // Needed for playing queue items, example:
  // x-sonos-spotify:spotify%3atrack%3a6KfyfEiMAQJrMhRrP2Epm4?sid=12&flags=8232&sn=2
  // to
  // spotify:track:6KfyfEiMAQJrMhRrP2Epm4
  private transformMediaContentId(id: string): string {
    if (!id) {
      return '';
    }
    try {
      const withoutQuery = id.split('?')[0];
      const decoded = decodeURIComponent(withoutQuery);
      const colonMatches = decoded.match(/:/g);
      if (colonMatches && colonMatches.length >= 2) {
        const firstColonIndex = decoded.indexOf(':');
        return decoded.substring(firstColonIndex + 1);
      }
      return decoded;
    } catch {
      return id;
    }
  }

  async seek(mediaPlayer: MediaPlayer, position: number) {
    await this.hassService.callMediaService('media_seek', {
      entity_id: mediaPlayer.id,
      seek_position: position,
    });
  }

  async togglePower(mediaPlayer: MediaPlayer) {
    const service = mediaPlayer.isOn() ? 'turn_off' : 'turn_on';
    await this.hassService.callMediaService(service, { entity_id: mediaPlayer.id });
  }
}
