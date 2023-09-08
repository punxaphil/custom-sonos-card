import { HassEntity } from 'home-assistant-js-websocket';
import { CardConfig, MediaPlayerItem, PredefinedGroup, Section } from '../types';
import { ACTIVE_PLAYER_EVENT, MEDIA_ITEM_SELECTED, SHOW_SECTION } from '../constants';
import { MediaPlayer } from '../model/media-player';

export function dispatchShowSection(section: Section) {
  window.dispatchEvent(new CustomEvent(SHOW_SECTION, { detail: section }));
}

export function getSpeakerList(mainPlayer: MediaPlayer, predefinedGroups: PredefinedGroup[] = []) {
  const playerIds = [mainPlayer.id, ...mainPlayer.members.map((member) => member.id)].sort();
  if (predefinedGroups?.length) {
    const found = predefinedGroups.find((pg) => pg.entities.sort().toString() === playerIds.toString());
    if (found) {
      return found.name;
    }
  }
  return [mainPlayer.name, ...mainPlayer.members.map((member) => member.name)].join(' + ');
}

export function dispatchActivePlayerId(playerId: string) {
  const event = new CustomEvent(ACTIVE_PLAYER_EVENT, {
    bubbles: true,
    composed: true,
    detail: { entityId: playerId },
  });
  window.dispatchEvent(event);
}

export function dispatchMediaItemSelected(mediaItem: MediaPlayerItem) {
  const event = new CustomEvent(MEDIA_ITEM_SELECTED, {
    bubbles: true,
    composed: true,
    detail: mediaItem,
  });
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
  return hassEntity.attributes.sonos_group || hassEntity.attributes.group_members;
}
