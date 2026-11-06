import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { CardConfig, HomeAssistantWithEntityNames } from '../../src/types';
import { BaseEditor } from '../../src/editor/base-editor';
import '../../src/editor/form';
import '../../src/editor/tabs/common-tab';

type EditorForm = HTMLElement & {
  schema: { name: string; label?: string; selector?: unknown }[];
  changed: (event: CustomEvent) => void;
};

const player: HassEntity = {
  entity_id: 'media_player.speaker',
  state: 'playing',
  attributes: { friendly_name: 'Kitchen Sonos' },
  context: { id: '', user_id: null, parent_id: null },
  last_changed: '',
  last_updated: '',
};

const hass = (version: string, formatEntityName?: HomeAssistantWithEntityNames['formatEntityName']) => {
  const homeAssistant = { config: { version }, states: { [player.entity_id]: player } } as HomeAssistant;
  return formatEntityName ? Object.assign(homeAssistant, { formatEntityName }) : homeAssistant;
};

async function editor(tag: string, homeAssistant: HomeAssistant, options: Partial<CardConfig> = {}) {
  const element = document.createElement(tag) as BaseEditor;
  element.hass = homeAssistant;
  element.config = { type: 'custom:sonos-card', ...options };
  if (tag === 'sonos-card-predefined-group-editor') {
    element.setAttribute('index', '0');
  }
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
}

afterEach(() => document.body.replaceChildren());

describe('entity name editor', () => {
  it('exposes the native name selector on supported HA versions', async () => {
    const element = await editor('sonos-card-common-tab', hass('2026.4.0', vi.fn()));
    const form = element.shadowRoot!.querySelector('sonos-card-editor-form') as EditorForm;
    expect(form.schema.find(({ name }) => name === 'entityName')).toMatchObject({ selector: { entity_name: {} } });
  });

  it.each([
    ['2026.3.0', vi.fn()],
    ['2026.4.0', undefined],
  ])('hides the unsupported selector for %s', async (version, formatter) => {
    const element = await editor('sonos-card-common-tab', hass(version, formatter));
    const form = element.shadowRoot!.querySelector('sonos-card-editor-form') as EditorForm;
    expect(form.schema.some(({ name }) => name === 'entityName')).toBe(false);
  });

  it('persists the ordered name parts selected in the visual editor', async () => {
    const element = await editor('sonos-card-common-tab', hass('2026.4.0', vi.fn()));
    const form = element.shadowRoot!.querySelector('sonos-card-editor-form') as EditorForm;
    const entityName: CardConfig['entityName'] = [{ type: 'area' }, { type: 'text', text: '·' }, { type: 'device' }];
    form.changed(new CustomEvent('value-changed', { detail: { value: { ...element.config, entityName } } }));
    expect(element.config.entityName).toEqual(entityName);
  });

  it('uses the configured player name for predefined-group volume labels', async () => {
    const formatter = vi.fn().mockReturnValue('Kitchen Sonos');
    const element = await editor('sonos-card-predefined-group-editor', hass('2026.4.0', formatter), {
      entityName: [{ type: 'area' }, { type: 'device' }],
      entityNameRegexToReplace: ' Sonos$',
      predefinedGroups: [{ name: 'Test group', entities: [{ player: player.entity_id, volume: 15 }] }],
    });
    const forms = Array.from(element.shadowRoot!.querySelectorAll('sonos-card-editor-form')) as EditorForm[];
    expect(forms.flatMap(({ schema }) => schema).find(({ name }) => name === 'volume')?.label).toBe('Kitchen: 15');
    expect(formatter).toHaveBeenCalledWith(player, element.config.entityName);
  });

  it('preserves the old predefined-group labels when name parts are unset', async () => {
    const element = await editor('sonos-card-predefined-group-editor', hass('2026.3.0'), {
      entityNameRegexToReplace: ' Sonos$',
      predefinedGroups: [{ name: 'Test group', entities: [{ player: player.entity_id }] }],
    });
    const forms = Array.from(element.shadowRoot!.querySelectorAll('sonos-card-editor-form')) as EditorForm[];
    expect(forms.flatMap(({ schema }) => schema).find(({ name }) => name === 'volume')?.label).toBe('Kitchen Sonos');
  });
});
