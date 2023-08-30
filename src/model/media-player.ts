import { HassEntity } from 'home-assistant-js-websocket';
import { CardConfig } from '../types';
import { getGroupPlayerIds } from '../utils/utils';

export class MediaPlayer {
  id!: string;
  name!: string;
  state!: string;
  members: MediaPlayer[];
  attributes!: {
    [key: string]: any;
  };
  private readonly config: CardConfig;

  constructor(hassEntity: HassEntity, config: CardConfig, mediaPlayerHassEntities?: HassEntity[]) {
    this.id = hassEntity.entity_id;
    this.config = config;
    this.name = this.getEntityName(hassEntity, config);
    this.state = hassEntity.state;
    this.attributes = hassEntity.attributes;
    this.members = mediaPlayerHassEntities ? this.createGroupMembers(hassEntity, mediaPlayerHassEntities) : [];
  }

  isInGroup(playerId: string) {
    return this.id === playerId || this.hasMember(playerId);
  }
  hasMember(playerId: string) {
    return this.members.some((member) => member.id === playerId);
  }

  isPlaying() {
    return this.state === 'playing';
  }

  isMuted(): boolean {
    return (this.attributes.is_volume_muted as boolean) || this.members.some((member) => member.isMuted());
  }
  getCurrentTrack() {
    const attributes = this.attributes;
    return `${attributes.media_artist || ''} - ${attributes.media_title || ''}`.replace(/^ - /g, '');
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
          groupPlayerIds.indexOf(hassEntity.entity_id) > -1 && mainHassEntity.entity_id !== hassEntity.entity_id,
      )
      .map((hassEntity) => new MediaPlayer(hassEntity, this.config));
  }

  isGrouped() {
    return this.members.length > 0;
  }
}
