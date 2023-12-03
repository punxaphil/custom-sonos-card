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

  constructor(hassEntity: HassEntity, config: CardConfig, mediaPlayerHassEntities?: HassEntity[]) {
    this.id = hassEntity.entity_id;
    this.config = config;
    this.name = this.getEntityName(hassEntity, config);
    this.state = hassEntity.state;
    this.attributes = hassEntity.attributes;
    this.members = mediaPlayerHassEntities ? this.createGroupMembers(hassEntity, mediaPlayerHassEntities) : [];
  }

  getPlayer(playerId: string) {
    return this.id === playerId ? this : this.getMember(playerId);
  }

  private getMember(playerId: string) {
    return this.members.find((member) => member.id === playerId);
  }

  hasMember(playerId: string) {
    return this.getMember(playerId) !== undefined;
  }

  isPlaying() {
    return this.state === 'playing';
  }

  isMuted(checkMembers: boolean): boolean {
    return (
      (this.attributes.is_volume_muted as boolean) ||
      (checkMembers && this.members.some((member) => member.isMuted(true)))
    );
  }
  getCurrentTrack() {
    return `${this.attributes.media_artist || ''} - ${this.attributes.media_title || ''}`.replace(/^ - /g, '');
  }

  private getEntityName(hassEntity: HassEntity, config: CardConfig) {
    const name = hassEntity.attributes.friendly_name || '';
    if (config.entityNameRegexToReplace) {
      return name.replace(new RegExp(config.entityNameRegexToReplace, 'g'), config.entityNameReplacement || '');
    }
    return name;
  }

  private createGroupMembers(mainHassEntity: HassEntity, mediaPlayerHassEntities: HassEntity[]): MediaPlayer[] {
    const groupPlayerIds = getGroupPlayerIds(mainHassEntity);
    return mediaPlayerHassEntities
      .filter(
        (hassEntity) =>
          groupPlayerIds.includes(hassEntity.entity_id) && mainHassEntity.entity_id !== hassEntity.entity_id,
      )
      .map((hassEntity) => new MediaPlayer(hassEntity, this.config));
  }

  isGrouped() {
    return this.members.length > 0;
  }
}
