import { HassEntity } from 'home-assistant-js-websocket';
import { CardConfig } from '../types';
import { getGroupPlayerIds } from '../utils/utils';

export class MediaPlayer {
  id: string;
  name: string;
  state: string;
  members: MediaPlayer[];
  attributes: HassEntity['attributes'];
  private readonly config: CardConfig;
  volumePlayer: MediaPlayer;
  ignoreVolume: boolean;

  constructor(hassEntity: HassEntity, config: CardConfig, mediaPlayerHassEntities?: HassEntity[]) {
    this.id = hassEntity.entity_id;
    this.config = config;
    this.name = this.getEntityName(hassEntity, config);
    this.state = hassEntity.state;
    this.attributes = hassEntity.attributes;
    this.members = mediaPlayerHassEntities ? this.createGroupMembers(hassEntity, mediaPlayerHassEntities) : [this];
    this.volumePlayer = this.determineVolumePlayer();
    this.ignoreVolume = !!this.config.entitiesToIgnoreVolumeLevelFor?.includes(this.volumePlayer.id);
  }

  getMember(playerId?: string) {
    return this.members.find((member) => member.id === playerId);
  }

  hasMember(playerId: string) {
    return this.getMember(playerId) !== undefined;
  }

  isPlaying() {
    return this.state === 'playing';
  }

  isMuted(checkMembers: boolean): boolean {
    return this.attributes.is_volume_muted && (!checkMembers || this.members.every((member) => member.isMuted(false)));
  }

  getCurrentTrack() {
    return `${this.attributes.media_artist || ''} - ${this.attributes.media_title || ''}`.replace(/^ - | - $/g, '');
  }
  private getEntityName(hassEntity: HassEntity, config: CardConfig) {
    const name = hassEntity.attributes.friendly_name || '';
    if (config.entityNameRegexToReplace) {
      return name.replace(new RegExp(config.entityNameRegexToReplace, 'g'), config.entityNameReplacement || '');
    }
    return name;
  }

  private createGroupMembers(mainHassEntity: HassEntity, mediaPlayerHassEntities: HassEntity[]): MediaPlayer[] {
    return getGroupPlayerIds(mainHassEntity).reduce((players: MediaPlayer[], id) => {
      const hassEntity = mediaPlayerHassEntities.find((hassEntity) => hassEntity.entity_id === id);
      return hassEntity ? [...players, new MediaPlayer(hassEntity, this.config)] : players;
    }, []);
  }

  private determineVolumePlayer() {
    let find;
    if (this.members.length > 1 && this.config.entitiesToIgnoreVolumeLevelFor) {
      find = this.members.find((p) => {
        return !this.config.entitiesToIgnoreVolumeLevelFor?.includes(p.id);
      });
    }
    return find ?? this;
  }

  getVolume() {
    if (this.members.length > 1 && this.config.adjustVolumeRelativeToMainPlayer) {
      return this.getAverageVolume();
    } else {
      return 100 * this.volumePlayer.attributes.volume_level;
    }
  }

  private getAverageVolume() {
    const volumes = this.members
      .filter((m) => !this.config.entitiesToIgnoreVolumeLevelFor?.includes(m.id))
      .map((m) => m.attributes.volume_level);
    return (100 * volumes.reduce((a, b) => a + b, 0)) / volumes.length;
  }
}
