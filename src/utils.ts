import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { css } from 'lit';
import { StyleInfo, styleMap } from 'lit-html/directives/style-map.js';
import { ACTIVE_PLAYER_EVENT, CardConfig, REQUEST_PLAYER_EVENT, Section, SHOW_SECTION } from './types';

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
  if (config.singleSectionMode) {
    deprecatedMessage('singleSectionMode', 'individual cards');
  }
  if (config.selectedPlayer) {
    deprecatedMessage('selectedPlayer', 'entityId');
    config.entityId = config.selectedPlayer;
  }
}

export const sharedStyle = css`
  :host {
    --sonos-int-background-color: var(--sonos-background-color, transparent);
    --sonos-int-ha-card-background-color: var(
      --sonos-ha-card-background-color,
      var(--ha-card-background, var(--card-background-color, white))
    );
    --sonos-int-player-section-background: var(--sonos-player-section-background, #ffffffe6);
    --sonos-int-color: var(--sonos-color, var(--secondary-text-color));
    --sonos-int-artist-album-text-color: var(--sonos-artist-album-text-color, var(--secondary-text-color));
    --sonos-int-song-text-color: var(--sonos-song-text-color, var(--sonos-accent-color, var(--accent-color)));
    --sonos-int-accent-color: var(--sonos-accent-color, var(--accent-color));
    --sonos-int-title-color: var(--sonos-title-color, var(--secondary-text-color));
    --sonos-int-border-radius: var(--sonos-border-radius, 0.25rem);
    --sonos-int-border-width: var(--sonos-border-width, 0rem);
    --sonos-int-media-button-white-space: var(
      --sonos-media-buttons-multiline,
      var(--sonos-favorites-multiline, nowrap)
    );
    --sonos-int-button-section-background-color: var(--sonos-button-section-background-color, transparent);
  }

  .sonos-icon-button {
    margin-bottom: 0.4rem;
  }
`;

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
