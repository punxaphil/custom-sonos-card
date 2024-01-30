import { CardConfig, MediaPlayerItem, PredefinedGroup } from '../types';
import HassService from './hass-service';
import { dispatchActivePlayerId } from '../utils/utils';
import { MediaPlayer } from '../model/media-player';

export default class MediaControlService {
  private hassService: HassService;

  constructor(hassService: HassService) {
    this.hassService = hassService;
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

  async createGroup(
    predefinedGroup: PredefinedGroup,
    currentGroups: MediaPlayer[],
    config: CardConfig,
    element: Element,
  ) {
    let candidateGroup!: MediaPlayer;
    for (const group of currentGroups) {
      if (predefinedGroup.entities.some((item) => item.player.id === group.id)) {
        if (group.isPlaying()) {
          await this.modifyExistingGroup(group, predefinedGroup, config, element);
          return;
        }
        candidateGroup = candidateGroup || group;
      }
    }
    if (candidateGroup) {
      await this.modifyExistingGroup(candidateGroup, predefinedGroup, config, element);
    } else {
      const { player } = predefinedGroup.entities[0];
      dispatchActivePlayerId(player.id, config, element);
      await this.joinPredefinedGroup(player, predefinedGroup);
    }
  }

  private async modifyExistingGroup(group: MediaPlayer, pg: PredefinedGroup, config: CardConfig, element: Element) {
    const members = group.members;
    const membersNotToBeGrouped = members.filter((member) => !pg.entities.some((item) => item.player.id === member.id));
    if (membersNotToBeGrouped?.length) {
      await this.unJoin(membersNotToBeGrouped.map((member) => member.id));
    }
    dispatchActivePlayerId(group.id, config, element);
    await this.joinPredefinedGroup(group, pg);
    for (const pgp of pg.entities) {
      const volume = pgp.volume ?? pg.volume;
      if (volume) {
        await this.volumeSet(pgp.player, volume, false);
      }
      if (pg.unmuteWhenGrouped) {
        await this.setVolumeMute(pgp.player, false, false);
      }
    }
    if (pg.media) {
      await this.setSource(pg.entities[0].player, pg.media);
    }
  }

  async volumeDown(mediaPlayer: MediaPlayer, updateMembers = true) {
    await this.hassService.callMediaService('volume_down', { entity_id: mediaPlayer.id });
    if (updateMembers) {
      for (const member of mediaPlayer.members) {
        await this.hassService.callMediaService('volume_down', { entity_id: member.id });
      }
    }
  }

  async volumeUp(mediaPlayer: MediaPlayer, updateMembers = true) {
    await this.hassService.callMediaService('volume_up', { entity_id: mediaPlayer.id });
    if (updateMembers) {
      for (const member of mediaPlayer.members) {
        await this.hassService.callMediaService('volume_up', { entity_id: member.id });
      }
    }
  }

  async volumeSet(mediaPlayer: MediaPlayer, volume: number, updateMembers = true) {
    const volume_level = volume / 100;

    await this.hassService.callMediaService('volume_set', { entity_id: mediaPlayer.id, volume_level: volume_level });
    if (updateMembers) {
      for (const member of mediaPlayer.members) {
        await this.hassService.callMediaService('volume_set', { entity_id: member.id, volume_level });
      }
    }
  }

  async toggleMute(mediaPlayer: MediaPlayer, updateMembers = true) {
    const muteVolume = !mediaPlayer.isMuted(updateMembers);
    await this.setVolumeMute(mediaPlayer, muteVolume, updateMembers);
  }

  async setVolumeMute(mediaPlayer: MediaPlayer, muteVolume: boolean, updateMembers = true) {
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

  async seek(mediaPlayer: MediaPlayer, position: number) {
    await this.hassService.callMediaService('media_seek', {
      entity_id: mediaPlayer.id,
      seek_position: position,
    });
  }
}
