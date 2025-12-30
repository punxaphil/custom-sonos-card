import { HassEntity } from 'home-assistant-js-websocket';
import { CardConfig, HomeAssistantWithEntities, PredefinedGroup, Section } from '../types';
import { MediaPlayerEntityFeature } from '../upstream/data/media-player';
import { ACTIVE_PLAYER_EVENT, ACTIVE_PLAYER_EVENT_INTERNAL } from '../constants';
import { MediaPlayer } from '../model/media-player';
import { GroupingItem } from '../model/grouping-item';

export function getSpeakerList(mainPlayer: MediaPlayer, predefinedGroups: PredefinedGroup[] = []) {
  const playerIds = mainPlayer.members.map((member) => member.id).sort();
  if (predefinedGroups?.length) {
    const found = predefinedGroups.find(
      (pg) =>
        pg.entities
          .map((p) => p.player.id)
          .sort()
          .toString() === playerIds.toString(),
    );
    if (found) {
      return found.name;
    }
  }
  return mainPlayer.members.map((member) => member.name).join(' + ');
}

export function dispatchActivePlayerId(playerId: string, config: CardConfig, element: Element) {
  if (cardDoesNotContainAllSections(config)) {
    dispatch(ACTIVE_PLAYER_EVENT, { entityId: playerId });
  } else {
    element.dispatchEvent(customEvent(ACTIVE_PLAYER_EVENT_INTERNAL, { entityId: playerId }));
  }
}

export function cardDoesNotContainAllSections(config: CardConfig) {
  return config.sections && config.sections.length < Object.keys(Section).length;
}

export function customEvent(type: string, detail?: unknown) {
  return new CustomEvent(type, {
    bubbles: true,
    composed: true,
    detail,
  });
}

export function dispatch(type: string, detail?: unknown) {
  const event = customEvent(type, detail);
  window.dispatchEvent(event);
}

const HEIGHT_AND_WIDTH = 40;

function getWidthOrHeight(confValue?: number) {
  if (confValue) {
    return (confValue / 100) * HEIGHT_AND_WIDTH;
  }
  return HEIGHT_AND_WIDTH;
}

export function getHeight(config: CardConfig) {
  return getWidthOrHeight(config.heightPercentage);
}

export function getWidth(config: CardConfig) {
  return getWidthOrHeight(config.widthPercentage);
}

export function getGroupPlayerIds(hassEntity: HassEntity): string[] {
  let groupMembers = hassEntity.attributes.group_members;
  groupMembers = groupMembers?.filter((id: string) => id !== null && id !== undefined);
  return groupMembers?.length ? groupMembers : [hassEntity.entity_id];
}

export function supportsTurnOn(player: MediaPlayer) {
  return (
    ((player.attributes.supported_features || 0) & MediaPlayerEntityFeature.TURN_ON) ===
    MediaPlayerEntityFeature.TURN_ON
  );
}

export function getGroupingChanges(groupingItems: GroupingItem[], joinedPlayers: string[], activePlayerId: string) {
  const isSelected = groupingItems.filter((item) => item.isSelected);
  const unJoin = groupingItems
    .filter((item) => !item.isSelected && joinedPlayers.includes(item.player.id))
    .map((item) => item.player.id);
  const join = groupingItems
    .filter((item) => item.isSelected && !joinedPlayers.includes(item.player.id))
    .map((item) => item.player.id);

  let newMainPlayer = activePlayerId;

  if (unJoin.includes(activePlayerId)) {
    newMainPlayer = isSelected[0].player.id;
  }
  return { unJoin, join, newMainPlayer };
}

export function entityMatchSonos(config: CardConfig, entity: HassEntity, hassWithEntities: HomeAssistantWithEntities) {
  const entityId = entity.entity_id;
  const configEntities = [...new Set(config.entities)];
  let includeEntity = true;
  if (configEntities.length) {
    const includesEntity = configEntities.includes(entityId);
    includeEntity = !!config.excludeItemsInEntitiesList !== includesEntity;
  }
  let matchesPlatform = true;
  entity.attributes.platform = hassWithEntities.entities?.[entityId]?.platform;
  if (config.entityPlatform) {
    matchesPlatform = entity.attributes.platform === config.entityPlatform;
  }
  return includeEntity && matchesPlatform;
}

export function entityMatchMxmp(config: CardConfig, entity: HassEntity, hassWithEntities: HomeAssistantWithEntities) {
  const entityId = entity.entity_id;
  const configEntities = [...new Set(config.entities)];
  let matchesPlatform = false;
  entity.attributes.platform = hassWithEntities.entities?.[entityId]?.platform;
  if (config.entityPlatform) {
    matchesPlatform = entity.attributes.platform === config.entityPlatform;
  }
  let includeEntity = false;
  if (configEntities.length) {
    const includesEntity = configEntities.includes(entityId);
    includeEntity = !!config.excludeItemsInEntitiesList !== includesEntity;
  }
  if (config.entityPlatform && configEntities.length) {
    return matchesPlatform && includeEntity;
  }
  return matchesPlatform || includeEntity;
}

export function isSonosCard(config: CardConfig) {
  return config.type.indexOf('sonos') > -1;
}

export function sortEntities(config: CardConfig, filtered: HassEntity[]) {
  if (config.entities) {
    return filtered.sort((a, b) => {
      const aIndex = config.entities?.indexOf(a.entity_id) ?? -1;
      const bIndex = config.entities?.indexOf(b.entity_id) ?? -1;
      return aIndex - bIndex;
    });
  } else {
    return filtered.sort((a, b) => a.entity_id.localeCompare(b.entity_id));
  }
}

export function findPlayer(mediaPlayers: MediaPlayer[], playerId: string | undefined) {
  return mediaPlayers.find((member) => member.id === playerId);
}
