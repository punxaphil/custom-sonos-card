import { HassEntity } from 'home-assistant-js-websocket';
import { CardConfig, MediaPlayerEntityFeature, PredefinedGroup, Section } from '../types';
import { ACTIVE_PLAYER_EVENT, ACTIVE_PLAYER_EVENT_INTERNAL } from '../constants';
import { MediaPlayer } from '../model/media-player';
import { GroupingItem } from '../model/grouping-item';

const { TURN_ON } = MediaPlayerEntityFeature;

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
  return hassEntity.attributes.group_members || [hassEntity.entity_id];
}

export function supportsTurnOn(player: MediaPlayer) {
  return ((player.attributes.supported_features || 0) & TURN_ON) == TURN_ON;
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
