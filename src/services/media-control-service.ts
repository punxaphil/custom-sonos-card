import { MediaPlayerItem } from '../types';
import HassService from './hass-service';
import { HomeAssistant } from 'custom-card-helpers';
import { dispatchActivePlayerId } from '../utils/utils';
import { MediaPlayer } from '../model/media-player';

export default class MediaControlService {
  private hassService: HassService;
  private hass: HomeAssistant;

  constructor(hass: HomeAssistant, hassService: HassService) {
    this.hassService = hassService;
    this.hass = hass;
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

  async createGroup(toBeGrouped: string[], currentGroups: MediaPlayer[]) {
    toBeGrouped = this.ignoreUnavailableEntities(toBeGrouped);
    let candidateGroup!: MediaPlayer;
    for (const group of currentGroups) {
      if (toBeGrouped.indexOf(group.id) > -1) {
        if (group.isPlaying()) {
          await this.modifyExistingGroup(group, toBeGrouped);
          return;
        }
        candidateGroup = candidateGroup || group;
      }
    }
    if (candidateGroup) {
      await this.modifyExistingGroup(candidateGroup, toBeGrouped);
    } else {
      const main = toBeGrouped[0];
      dispatchActivePlayerId(main);
      await this.join(main, toBeGrouped);
    }
  }

  private ignoreUnavailableEntities(entities: string[]) {
    return entities.filter((entityId) => this.hass.states[entityId]?.state !== 'unavailable');
  }

  private async modifyExistingGroup(group: MediaPlayer, toBeGrouped: string[]) {
    const members = group.members;
    const membersNotToBeGrouped = members.filter((member) => toBeGrouped.indexOf(member.id) === -1);
    if (membersNotToBeGrouped?.length) {
      await this.unJoin(membersNotToBeGrouped.map((member) => member.id));
    }
    dispatchActivePlayerId(group.id);
    await this.join(group.id, toBeGrouped);
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

  async volumeDown(mediaPlayer: MediaPlayer) {
    await this.hassService.callMediaService('volume_down', { entity_id: mediaPlayer.id });

    for (const member of mediaPlayer.members) {
      await this.hassService.callMediaService('volume_down', { entity_id: member.id });
    }
  }

  async volumeUp(mediaPlayer: MediaPlayer) {
    await this.hassService.callMediaService('volume_up', { entity_id: mediaPlayer.id });

    for (const member of mediaPlayer.members) {
      await this.hassService.callMediaService('volume_up', { entity_id: member.id });
    }
  }
  async volumeSet(mediaPlayer: MediaPlayer, volume: number) {
    const volume_level = volume / 100;

    await this.hassService.callMediaService('volume_set', { entity_id: mediaPlayer.id, volume_level: volume_level });

    for (const member of mediaPlayer.members) {
      await this.hassService.callMediaService('volume_set', { entity_id: member.id, volume_level });
    }
  }

  async volumeMute(mediaPlayer: MediaPlayer) {
    const muteVolume = !mediaPlayer.isMuted();
    await this.hassService.callMediaService('volume_mute', { entity_id: mediaPlayer.id, is_volume_muted: muteVolume });

    for (const member of mediaPlayer.members) {
      await this.hassService.callMediaService('volume_mute', { entity_id: member.id, is_volume_muted: muteVolume });
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
}
