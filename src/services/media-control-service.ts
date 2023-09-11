import { CardConfig, MediaPlayerItem, PredefinedGroup } from '../types';
import HassService from './hass-service';
import { dispatchActivePlayerId } from '../utils/utils';
import { MediaPlayer } from '../model/media-player';

export default class MediaControlService {
  private hassService: HassService;
  private allGroups: MediaPlayer[];
  private config: CardConfig;

  constructor(hassService: HassService, allGroups: MediaPlayer[], config: CardConfig) {
    this.hassService = hassService;
    this.allGroups = allGroups;
    this.config = config;
  }

  async join(main: string, memberIds: string[]) {
    await this.hassService.callMediaService('join', {
      entity_id: main,
      group_members: memberIds,
    });
  }

  private async joinPredefinedGroup(player: MediaPlayer, pg: PredefinedGroup) {
    const ids = pg.entities.map(({ player }) => player.id);
    await this.join(player.id, ids);
  }

  async unJoin(playerIds: string[]) {
    await this.hassService.callMediaService('unjoin', {
      entity_id: playerIds,
    });
  }

  async createGroup(predefinedGroup: PredefinedGroup, currentGroups: MediaPlayer[]) {
    let candidateGroup!: MediaPlayer;
    for (const group of currentGroups) {
      if (predefinedGroup.entities.some((item) => item.player.id === group.id)) {
        if (group.isPlaying()) {
          await this.modifyExistingGroup(group, predefinedGroup);
          return;
        }
        candidateGroup = candidateGroup || group;
      }
    }
    if (candidateGroup) {
      await this.modifyExistingGroup(candidateGroup, predefinedGroup);
    } else {
      const { player } = predefinedGroup.entities[0];
      dispatchActivePlayerId(player.id);
      await this.joinPredefinedGroup(player, predefinedGroup);
    }
  }

  private async modifyExistingGroup(group: MediaPlayer, toBeGrouped: PredefinedGroup) {
    const members = group.members;
    const membersNotToBeGrouped = members.filter(
      (member) => !toBeGrouped.entities.some((item) => item.player.id === member.id),
    );
    if (membersNotToBeGrouped?.length) {
      await this.unJoin(membersNotToBeGrouped.map((member) => member.id));
    }
    dispatchActivePlayerId(group.id);
    await this.joinPredefinedGroup(group, toBeGrouped);
    for (const pgp of toBeGrouped.entities) {
      if (pgp.volume != null) {
        this.volumeSet(pgp.player, pgp.volume, false);
      }
    }
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

  async volumeDown(mediaPlayer: MediaPlayer, updateMembers = true) {
    await this.hassService.callMediaService('volume_down', { entity_id: mediaPlayer.id });
    if (updateMembers) {
      for (const member of mediaPlayer.members) {
        if (!this.isInVolumeRatios(member, mediaPlayer)) {
          await this.hassService.callMediaService('volume_down', { entity_id: member.id });
        }
      }
    }
  }

  async volumeUp(mediaPlayer: MediaPlayer, updateMembers = true) {
    await this.hassService.callMediaService('volume_up', { entity_id: mediaPlayer.id });
    if (updateMembers) {
      for (const member of mediaPlayer.members) {
        if (!this.isInVolumeRatios(member, mediaPlayer)) {
          await this.hassService.callMediaService('volume_up', { entity_id: member.id });
        }
      }
    }
  }
  async volumeSet(mediaPlayer: MediaPlayer, volume: number, updateMembers = true) {
    const volume_level = volume / 100;

    await this.hassService.callMediaService('volume_set', { entity_id: mediaPlayer.id, volume_level: volume_level });
    if (updateMembers) {
      for (const member of mediaPlayer.members) {
        if (!this.isInVolumeRatios(member, mediaPlayer)) {
          await this.hassService.callMediaService('volume_set', { entity_id: member.id, volume_level });
        }
      }
    }
  }

  async volumeMute(mediaPlayer: MediaPlayer, updateMembers = true) {
    const muteVolume = !mediaPlayer.isMuted();
    await this.hassService.callMediaService('volume_mute', { entity_id: mediaPlayer.id, is_volume_muted: muteVolume });
    if (updateMembers) {
      for (const member of mediaPlayer.members) {
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

  isInVolumeRatios(member: MediaPlayer, group: MediaPlayer) {
    return this.config.volumeRatios?.some(
      (volumeRatio) =>
        group.hasPlayer(volumeRatio.basePlayer) &&
        group.hasPlayer(volumeRatio.adjustedPlayer) &&
        volumeRatio.adjustedPlayer === member.id,
    );
  }

  applyVolumeRatios(playerId: string) {
    this.config.volumeRatios?.forEach(async (volumeRatio) => {
      const group = this.allGroups.find(
        (group) =>
          group.hasPlayer(volumeRatio.basePlayer) &&
          group.hasPlayer(volumeRatio.adjustedPlayer) &&
          volumeRatio.basePlayer === playerId,
      );
      if (group) {
        const base = group.getPlayer(volumeRatio.basePlayer);
        const adjusted = group.getPlayer(volumeRatio.adjustedPlayer);
        if (adjusted) {
          const volume = base?.attributes.volume_level * volumeRatio.ratio * 100;
          await this.volumeSet(adjusted, volume, false);
          return;
        }
      }
    });
  }
}
