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

  async setVolumeAndMediaForPredefinedGroup(pg: PredefinedGroup) {
    for (const pgp of pg.entities) {
      const volume = pgp.volume ?? pg.volume;
      if (volume) {
        await this.volumeSetSinglePlayer(pgp.player, volume);
      }
      if (pg.unmuteWhenGrouped) {
        await this.setVolumeMute(pgp.player, false, false);
      }
    }
    if (pg.media) {
      await this.setSource(pg.entities[0].player, pg.media);
    }
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

  private async volumeWithStepSize(
    mainPlayer: MediaPlayer,
    updateMembers: boolean,
    volumeStepSize: number,
    calculateVolume: CalculateVolume,
  ) {
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
    let relativeVolumeChange: number | undefined;
    if (this.config.adjustVolumeRelativeToMainPlayer) {
      relativeVolumeChange = volumePercent / player.getVolume();
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

  async volumeSetSinglePlayer(player: MediaPlayer, volumePercent: number) {
    if (!player.ignoreVolume) {
      const volume = volumePercent / 100;
      await this.hassService.callMediaService('volume_set', { entity_id: player.id, volume_level: volume });
    }
  }

  async toggleMute(mediaPlayer: MediaPlayer, updateMembers = true) {
    const muteVolume = !mediaPlayer.isMuted(updateMembers);
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

  async playMedia(mediaPlayer: MediaPlayer, item: MediaPlayerItem) {
    await this.hassService.callMediaService('play_media', {
      entity_id: mediaPlayer.id,
      media_content_id: item.media_content_id,
      media_content_type: item.media_content_type,
    });
  }

  async seek(mediaPlayer: MediaPlayer, position: number) {
    await this.hassService.callMediaService('media_seek', {
      entity_id: mediaPlayer.id,
      seek_position: position,
    });
  }
}
