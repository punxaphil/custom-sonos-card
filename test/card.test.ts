import { HomeAssistant } from 'custom-card-helpers';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Card } from '../src/card';
import { SESSION_STORAGE_PLAYER_ID } from '../src/constants';
import { CardConfig } from '../src/types';

customElements.define('test-sonos-card', Card);

const FIRST_PLAYER = 'media_player.first';
const SECOND_PLAYER = 'media_player.second';
const THIRD_PLAYER = 'media_player.third';
const PLAYER_IDS = [FIRST_PLAYER, SECOND_PLAYER, THIRD_PLAYER];

describe.each(['custom:sonos-card', 'custom:maxi-media-player'])('%s configuration player selection', (type) => {
  let card: Card;
  let config: CardConfig;

  beforeEach(() => {
    card = document.createElement('test-sonos-card') as Card;
    config = { type, entities: PLAYER_IDS, entityId: FIRST_PLAYER };
    card.hass = {
      states: Object.fromEntries(PLAYER_IDS.map((id) => [id, { entity_id: id, state: 'idle', attributes: { friendly_name: id } }])),
      entities: Object.fromEntries(PLAYER_IDS.map((id) => [id, { platform: 'sonos' }])),
    } as unknown as HomeAssistant;
    card.setConfig(config);
    card.render();
  });

  afterEach(() => {
    window.history.replaceState(null, '', window.location.pathname);
    window.sessionStorage.clear();
  });

  function expectSelectedPlayer(playerId: string) {
    card.render();
    expect(card.activePlayerId).toBe(playerId);
    expect(card.store.activePlayer.id).toBe(playerId);
  }

  function selectPlayer(playerId: string) {
    card.activePlayerListener(new CustomEvent('active-player', { detail: { entityId: playerId } }));
    expectSelectedPlayer(playerId);
  }

  it('switches players when the configured entityId changes', () => {
    card.setConfig({ ...config, entityId: SECOND_PLAYER });
    expectSelectedPlayer(SECOND_PLAYER);
  });

  it('honors consecutive entityId changes before rendering', () => {
    card.setConfig({ ...config, entityId: SECOND_PLAYER });
    card.setConfig({ ...config, entityId: THIRD_PLAYER });
    expectSelectedPlayer(THIRD_PLAYER);
  });

  it('selects an entityId added after initialization', () => {
    card.setConfig({ ...config, entityId: undefined });
    card.setConfig({ ...config, entityId: SECOND_PLAYER });
    expectSelectedPlayer(SECOND_PLAYER);
  });

  it('preserves manual selection when the configured entityId is unchanged', () => {
    selectPlayer(THIRD_PLAYER);
    card.setConfig({ ...config, title: 'Updated title' });
    expectSelectedPlayer(THIRD_PLAYER);
  });

  it('allows manual selection after a configured entityId change', () => {
    card.setConfig({ ...config, entityId: SECOND_PLAYER });
    expectSelectedPlayer(SECOND_PLAYER);
    selectPlayer(THIRD_PLAYER);
    card.setConfig({ ...config, entityId: SECOND_PLAYER, title: 'Updated title' });
    expectSelectedPlayer(THIRD_PLAYER);
  });

  it.each([undefined, ''])('preserves selection when entityId is removed or empty (%s)', (entityId) => {
    selectPlayer(THIRD_PLAYER);
    card.setConfig({ ...config, entityId });
    expectSelectedPlayer(THIRD_PLAYER);
  });

  it('preserves manual selection when entityId remains absent', () => {
    card.setConfig({ ...config, entityId: undefined });
    selectPlayer(THIRD_PLAYER);
    card.setConfig({ ...config, entityId: undefined, title: 'Updated title' });
    expectSelectedPlayer(THIRD_PLAYER);
  });

  it.each([false, true])('overrides remembered selection on entityId changes (session storage: %s)', (storePlayerInSessionStorage) => {
    window.history.replaceState(null, '', `#${THIRD_PLAYER}`);
    window.sessionStorage.setItem(SESSION_STORAGE_PLAYER_ID, THIRD_PLAYER);
    card.setConfig({ ...config, entityId: SECOND_PLAYER, storePlayerInSessionStorage });
    expectSelectedPlayer(SECOND_PLAYER);
    expect(window.location.hash).toBe(`#${THIRD_PLAYER}`);
    expect(window.sessionStorage.getItem(SESSION_STORAGE_PLAYER_ID)).toBe(THIRD_PLAYER);
  });

  it.each([false, true])('preserves initial remembered selection (session storage: %s)', (storePlayerInSessionStorage) => {
    window.history.replaceState(null, '', `#${THIRD_PLAYER}`);
    window.sessionStorage.setItem(SESSION_STORAGE_PLAYER_ID, THIRD_PLAYER);
    card = document.createElement('test-sonos-card') as Card;
    card.hass = {
      states: { [THIRD_PLAYER]: { entity_id: THIRD_PLAYER, state: 'idle', attributes: {} } },
      entities: { [THIRD_PLAYER]: { platform: 'sonos' } },
    } as unknown as HomeAssistant;
    card.setConfig({ ...config, storePlayerInSessionStorage });
    expectSelectedPlayer(THIRD_PLAYER);
  });
});
