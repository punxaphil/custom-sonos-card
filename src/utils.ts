import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { CardConfig, PlayerGroup, Section } from './types';
import { ACTIVE_PLAYER_EVENT, BROWSE_CLICKED, PLAY_DIR, REQUEST_PLAYER_EVENT, SHOW_SECTION } from './constants';
import { styleMap } from 'lit-html/directives/style-map.js';

export function getEntityName(hass: HomeAssistant, config: CardConfig, entity: string) {
  const name = hass.states[entity].attributes.friendly_name || '';
  if (config.entityNameRegexToReplace) {
    return name.replace(new RegExp(config.entityNameRegexToReplace, 'g'), config.entityNameReplacement || '');
  }
  return name;
}

export function getGroupMembers(state: HassEntity) {
  return state.attributes.sonos_group || state.attributes.group_members;
}

export function listenForEntityId(listener: EventListener) {
  window.addEventListener(ACTIVE_PLAYER_EVENT, listener);
  const event = new CustomEvent(REQUEST_PLAYER_EVENT, { bubbles: true, composed: true });
  window.dispatchEvent(event);
}

export function stopListeningForEntityId(listener: EventListener) {
  window.removeEventListener(ACTIVE_PLAYER_EVENT, listener);
}

export function listenForPlayerRequest(listener: EventListener) {
  window.addEventListener(REQUEST_PLAYER_EVENT, listener);
}

export function stopListeningForPlayerRequest(listener: EventListener) {
  window.removeEventListener(REQUEST_PLAYER_EVENT, listener);
}

export function dispatchShowSection(section: Section) {
  window.dispatchEvent(new CustomEvent(SHOW_SECTION, { detail: section }));
}

export function dispatchPlayDir() {
  window.dispatchEvent(new CustomEvent(PLAY_DIR));
}
export function dispatchBrowseClicked() {
  window.dispatchEvent(new CustomEvent(BROWSE_CLICKED));
}

export function isPlaying(state: string) {
  return state === 'playing';
}

export function getCurrentTrack(hassEntity: HassEntity) {
  const attributes = hassEntity.attributes;
  return `${attributes.media_artist || ''} - ${attributes.media_title || ''}`.replace(/^ - /g, '');
}

export function listStyle() {
  return styleMap({
    '--mdc-theme-primary': 'var(--accent-color)',
    '--mdc-list-vertical-padding': '0px',
    overflow: 'hidden',
  });
}

export function getSpeakerList(group: PlayerGroup) {
  return [group.roomName, ...Object.values(group.members)].join(' + ');
}
