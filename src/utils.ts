import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { StyleInfo, styleMap } from 'lit-html/directives/style-map.js';
import { CardConfig, PlayerGroup, Section } from './types';
import { ACTIVE_PLAYER_EVENT, BROWSE_CLICKED, PLAY_DIR, REQUEST_PLAYER_EVENT, SHOW_SECTION } from './constants';

export function getEntityName(hass: HomeAssistant, config: CardConfig, entity: string) {
  const name = hass.states[entity].attributes.friendly_name || '';
  if (config.entityNameRegex) {
    const parts = config.entityNameRegex.split('/').filter((i: string) => i);
    if (parts.length === 2) {
      const [pattern, replaceWith] = parts;
      return name.replace(new RegExp(pattern, 'g'), replaceWith);
    }
  } else if (config.entityNameRegexToReplace) {
    return name.replace(new RegExp(config.entityNameRegexToReplace, 'g'), config.entityNameReplacement || '');
  }
  return name;
}

export function getGroupMembers(state: HassEntity) {
  return state.attributes.sonos_group || state.attributes.group_members;
}

export function stylable(configName: string, config: CardConfig, additionalStyle?: StyleInfo) {
  return styleMap({
    ...{
      '--sonos-card-style-name': configName,
    },
    ...additionalStyle,
    ...config?.styles?.[configName],
  });
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

export function validateConfig(config: CardConfig) {
  // Handle deprecated configs
  const deprecatedMessage = (deprecated: string, instead: string) =>
    console.error('Sonos Card: ' + deprecated + ' configuration is deprecated. Please use ' + instead + ' instead.');
  if (config.layout && !config.layout?.mediaBrowser && config.layout.favorites) {
    deprecatedMessage('layout.favorites', 'layout.mediaBrowser');
    config.layout.mediaBrowser = config.layout.favorites;
  }
  if (config.layout && !config.layout?.mediaItem && config.layout.favorite) {
    deprecatedMessage('layout.favorite', 'layout.mediaItem');
    config.layout.mediaItem = config.layout.favorite;
  }
  if (config.sections) {
    deprecatedMessage('singleSectionMode', 'individual cards');
  }
  if (config.selectedPlayer) {
    deprecatedMessage('selectedPlayer', 'entityId');
    config.entityId = config.selectedPlayer;
  }
}

export function isPlaying(state: string) {
  return state === 'playing';
}

export function getCurrentTrack(hassEntity: HassEntity) {
  const attributes = hassEntity.attributes;
  return `${attributes.media_artist || ''} - ${attributes.media_title || ''}`.replace(/^ - /g, '');
}

export function listStyle(config: CardConfig) {
  return stylable('groups-list', config, {
    '--mdc-theme-primary': 'var(--sonos-int-accent-color)',
    '--mdc-list-vertical-padding': '0px',
    overflow: 'hidden',
  });
}

export function getSpeakerList(group: PlayerGroup) {
  return [group.roomName, ...Object.values(group.members)].join(' + ');
}
