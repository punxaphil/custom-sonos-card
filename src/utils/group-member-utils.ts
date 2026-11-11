import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { CardConfig } from '../types';
import { MediaPlayer } from '../model/media-player';

export function isGroupPlayer(hassEntity: HassEntity): boolean {
  const groupMembers: string[] = hassEntity.attributes.group_members?.filter((id: string) => id !== null && id !== undefined) ?? [];
  return groupMembers.length > 0 && !groupMembers.includes(hassEntity.entity_id);
}

export function getGroupMemberCandidates(
  config: CardConfig,
  hass: HomeAssistant | undefined,
  mainHassEntity: HassEntity,
  mediaPlayerHassEntities: HassEntity[],
): HassEntity[] {
  if (!config.allowGroupMembersOutsideOfEntities || !hass || !isGroupPlayer(mainHassEntity)) {
    return mediaPlayerHassEntities;
  }
  const groupMemberIds: string[] = mainHassEntity.attributes.group_members;
  return groupMemberIds.map((id) => hass.states[id]).filter((hassEntity): hassEntity is HassEntity => hassEntity !== undefined);
}

export function getAllMediaPlayers(groups: MediaPlayer[], config: CardConfig): MediaPlayer[] {
  const players = groups.flatMap((group) => group.members);
  if (!config.allowGroupMembersOutsideOfEntities) {
    return players;
  }
  return players.filter((player, index) => players.findIndex((other) => other.id === player.id) === index);
}
