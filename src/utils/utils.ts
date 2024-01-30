import { HassEntity } from 'home-assistant-js-websocket';
import { CardConfig, PredefinedGroup, Section } from '../types';
import { ACTIVE_PLAYER_EVENT, ACTIVE_PLAYER_EVENT_INTERNAL } from '../constants';
import { MediaPlayer } from '../model/media-player';

export function getSpeakerList(mainPlayer: MediaPlayer, predefinedGroups: PredefinedGroup[] = []) {
  const playerIds = [mainPlayer.id, ...mainPlayer.members.map((member) => member.id)].sort();
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
  return [mainPlayer.name, ...mainPlayer.members.map((member) => member.name)].join(' + ');
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
  return hassEntity.attributes.sonos_group || hassEntity.attributes.group_members || [];
}
