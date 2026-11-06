import { describe, expect, it, vi } from 'vitest';
import { HassEntity } from 'home-assistant-js-websocket';
import { CardConfig, EntityName, HomeAssistantWithEntityNames } from '../../src/types';
import { MediaPlayer } from '../../src/model/media-player';
import { getPlayerName } from '../../src/utils/entity-name-utils';

const entity = (entityId = 'media_player.speaker', friendlyName = 'Sonos'): HassEntity => ({
  entity_id: entityId,
  state: 'playing',
  attributes: { friendly_name: friendlyName },
  context: { id: '', user_id: null, parent_id: null },
  last_changed: '',
  last_updated: '',
});

const config = (options: Partial<CardConfig> = {}): CardConfig => ({ type: 'custom:sonos-card', ...options });
const hass = (formatEntityName: HomeAssistantWithEntityNames['formatEntityName'], version = '2026.4.0') =>
  ({ config: { version }, formatEntityName }) as HomeAssistantWithEntityNames;

describe('player name parts', () => {
  it.each<EntityName>([
    { type: 'area' },
    [{ type: 'area' }, { type: 'device' }],
    [{ type: 'area' }, { type: 'text', text: '·' }, { type: 'device' }],
    [{ type: 'parent_device' }, { type: 'entity' }],
    'Custom speaker label',
  ])('passes the configured name to the native formatter: %j', (entityName) => {
    const state = entity();
    const formatter = vi.fn().mockReturnValue('Kitchen');
    expect(getPlayerName(hass(formatter), state, config({ entityName }))).toBe('Kitchen');
    expect(formatter).toHaveBeenCalledWith(state, entityName);
  });

  it('retains default native formatting when the setting is absent', () => {
    const state = entity();
    const formatter = vi.fn().mockReturnValue('Kitchen Sonos');
    expect(getPlayerName(hass(formatter), state, config())).toBe('Kitchen Sonos');
    expect(formatter).toHaveBeenCalledWith(state, undefined);
  });

  it('applies regex replacement after native name composition', () => {
    const formatter = vi.fn().mockReturnValue('Kitchen Sonos');
    expect(getPlayerName(hass(formatter), entity(), config({ entityName: [{ type: 'area' }, { type: 'device' }], entityNameRegexToReplace: ' Sonos$' }))).toBe(
      'Kitchen',
    );
  });

  it.each(['', '   ', undefined])('uses the default name when selected parts are missing: %j', (missingName) => {
    const formatter = vi.fn((_state: HassEntity, name?: EntityName) => (name === undefined ? 'Sonos' : missingName));
    expect(getPlayerName(hass(formatter), entity(), config({ entityName: { type: 'area' } }))).toBe('Sonos');
  });

  it('retains a readable label when regex removes a configured name entirely', () => {
    const formatter = vi.fn((_state: HassEntity, name?: EntityName) => (name === undefined ? 'Sonos' : 'Kitchen'));
    expect(getPlayerName(hass(formatter), entity(), config({ entityName: { type: 'area' }, entityNameRegexToReplace: '.*' }))).toBe('Sonos');
  });

  it('falls back to the entity ID when neither selected parts nor a default name exist', () => {
    expect(getPlayerName(hass(vi.fn().mockReturnValue('')), entity(), config({ entityName: { type: 'area' } }))).toBe('media_player.speaker');
  });

  it.each<EntityName>(['', []])('keeps a readable name for an empty selection: %j', (entityName) => {
    const formatter = vi.fn((_state: HassEntity, name?: EntityName) => (name === undefined ? 'Sonos' : ''));
    expect(getPlayerName(hass(formatter), entity(), config({ entityName }))).toBe('Sonos');
  });

  it('retains legacy friendly-name and regex behavior when unset', () => {
    expect(getPlayerName(undefined, entity('media_player.speaker', 'Kitchen Sonos'), config({ entityNameRegexToReplace: ' Sonos$' }))).toBe('Kitchen');
    expect(getPlayerName(undefined, entity(), config({ entityNameRegexToReplace: 'Sonos' }))).toBe('');
  });

  it('falls back to friendly names on older HA versions', () => {
    const formatter = vi.fn();
    expect(getPlayerName(hass(formatter, '2026.3.0'), entity(), config({ entityName: { type: 'area' } }))).toBe('Sonos');
    expect(formatter).not.toHaveBeenCalled();
  });

  it('handles a formatter that has not loaded yet', () => {
    expect(getPlayerName(undefined, entity(), config({ entityName: { type: 'area' } }))).toBe('Sonos');
  });

  it('uses the same naming for group members without changing their identities or attributes', () => {
    const first = entity('media_player.first');
    const second = entity('media_player.second');
    first.attributes.group_members = [first.entity_id, second.entity_id];
    const formatter = vi.fn((state: HassEntity) => (state.entity_id === first.entity_id ? 'Kitchen' : 'Hallway'));
    const player = new MediaPlayer(first, config({ entityName: { type: 'area' } }), [first, second], hass(formatter));
    expect(player.name).toBe('Kitchen');
    expect(player.members.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: first.entity_id, name: 'Kitchen' },
      { id: second.entity_id, name: 'Hallway' },
    ]);
    expect(player.attributes).toBe(first.attributes);
    expect(player.members[1].attributes).toBe(second.attributes);
  });
});
