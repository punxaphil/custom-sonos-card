import { HomeAssistant } from 'custom-card-helpers';
import { ACTIVE_PLAYER_EVENT, CardConfig, PlayerGroups, REQUEST_PLAYER_EVENT, Size } from './types';
import { StyleInfo, styleMap } from 'lit-html/directives/style-map.js';
import { HassEntity } from 'home-assistant-js-websocket';
import { css, html, TemplateResult } from 'lit';

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

export function getMediaPlayers(config: CardConfig, hass: HomeAssistant) {
  if (config.entities) {
    return [...new Set(config.entities)].filter((player) => hass.states[player]);
  } else {
    return Object.values(hass.states)
      .filter(getGroupMembers)
      .map((state) => state.entity_id)
      .sort();
  }
}

export function createPlayerGroups(mediaPlayers: string[], hass: HomeAssistant, config: CardConfig): PlayerGroups {
  const groupMasters = mediaPlayers.filter((player) => createGroupMasters(hass, player, mediaPlayers));
  const groupArray = groupMasters.map((groupMaster) => createGroupArray(hass, groupMaster, mediaPlayers, config));
  return Object.fromEntries(groupArray.map((group) => [group.entity, group]));
}

function createGroupMasters(hass: HomeAssistant, player: string, mediaPlayers: string[]) {
  const state = hass.states[player];
  try {
    const sonosGroup = getGroupMembers(state).filter((member: string) => mediaPlayers.indexOf(member) > -1);
    const isGrouped = sonosGroup?.length > 1;
    const isMasterInGroup = isGrouped && sonosGroup && sonosGroup[0] === player;
    return !isGrouped || isMasterInGroup;
  } catch (e) {
    console.error('Failed to determine group master', JSON.stringify(state), e);
    return false;
  }
}

function createGroupArray(hass: HomeAssistant, groupMaster: string, mediaPlayers: string[], config: CardConfig) {
  const state = hass.states[groupMaster];
  try {
    const membersArray = getGroupMembers(state).filter((member: string) => {
      return member !== groupMaster && mediaPlayers.indexOf(member) > -1;
    });
    return {
      entity: groupMaster,
      state: state.state,
      roomName: getEntityName(hass, config, groupMaster),
      members: createGroupMembers(membersArray, hass, config),
    };
  } catch (e) {
    console.error('Failed to create group', JSON.stringify(state), e);
    return {};
  }
}

function createGroupMembers(membersArray: string[], hass: HomeAssistant, config: CardConfig) {
  return Object.fromEntries(
    membersArray.map((member: string) => {
      const friendlyName = getEntityName(hass, config, member);
      return [member, friendlyName];
    }),
  );
}

export function getWidth(config: CardConfig, defaultWidth: string, defaultMobileWidth: string, size?: Size) {
  return isMobile(config) ? size?.mobileWidth || defaultMobileWidth : size?.width || defaultWidth;
}

export function isMobile(config: CardConfig) {
  return innerWidth < (config.layout?.mobileThresholdPx || 650);
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

export function buttonSectionStyle(config: CardConfig, additionalStyle?: StyleInfo) {
  return stylable('button-section', config, {
    background: 'var(--sonos-int-button-section-background-color)',
    borderRadius: 'var(--sonos-int-border-radius)',
    border: 'var(--sonos-int-border-width) solid var(--sonos-int-color)',
    marginTop: '1rem',
    padding: '0 0.5rem',
    ...additionalStyle,
  });
}

export const noPlayerHtml = html` <div>
  No Sonos player selected. Do one of the following:
  <ul>
    <li>Add the Sonos Groups card to this dashboard</li>
    <li>Configure <i>entityId</i> for the card</li>
    <li>Replace this one with the Sonos card containing all sections.</li>
  </ul>
</div>`;

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

export const haIconStyle = (config: CardConfig) =>
  stylable('sonos-ha-icon', config, {
    marginBottom: '0.4rem',
  });

export function wrapInHaCardUnlessAllSectionsShown(cardHtml: TemplateResult, config: CardConfig) {
  return config.showAllSections ? cardHtml : html` <ha-card style="${haCardStyle(config)}"> ${cardHtml}</ha-card>`;
}

export function haCardStyle(config: CardConfig) {
  return stylable('ha-card', config, {
    color: 'var(--sonos-int-color)',
    background: 'var(--sonos-int-ha-card-background-color)',
  });
}

export function isPlaying(state: string) {
  return state === 'playing';
}

export function getCurrentTrack(hassEntity: HassEntity) {
  const attributes = hassEntity.attributes;
  return `${attributes.media_artist || ''} - ${attributes.media_title || ''}`.replace(/^ - /g, '');
}
