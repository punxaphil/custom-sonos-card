import { describe, expect, it, vi } from 'vitest';
import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { getEntityName, getEntityNameWithoutDevice, supportsEntityNames } from '../../src/utils/entity-name-utils';

const HASS_ENTITY = {
  entity_id: 'switch.kitchen_crossfade',
  attributes: { friendly_name: 'Kitchen Crossfade' },
} as unknown as HassEntity;

function hass(version: string, formatEntityName?: (hassEntity: HassEntity, name?: unknown) => string) {
  return { config: { version }, formatEntityName } as unknown as HomeAssistant;
}

describe('supportsEntityNames', () => {
  it.each([
    ['2026.4.0', true],
    ['2027.1.0', true],
    ['2026.3.4', false],
    ['2025.11.0', false],
  ])('is %s supported: %s', (version, expected) => {
    expect(supportsEntityNames(hass(version, vi.fn()))).toBe(expected);
  });

  it('is false when hass does not have the formatter yet', () => {
    expect(supportsEntityNames(hass('2026.4.0'))).toBe(false);
  });

  it('is false without hass', () => {
    expect(supportsEntityNames(undefined)).toBe(false);
  });
});

describe('getEntityName', () => {
  it('uses the formatter when supported', () => {
    const formatEntityName = vi.fn().mockReturnValue('Kitchen speaker');
    expect(getEntityName(hass('2026.4.0', formatEntityName), HASS_ENTITY)).toBe('Kitchen speaker');
    expect(formatEntityName).toHaveBeenCalledWith(HASS_ENTITY, undefined);
  });

  it('falls back to the friendly name', () => {
    expect(getEntityName(hass('2026.3.0', vi.fn()), HASS_ENTITY)).toBe('Kitchen Crossfade');
  });

  it('is empty without an entity', () => {
    expect(getEntityName(hass('2026.4.0', vi.fn()), undefined)).toBe('');
  });
});

describe('getEntityNameWithoutDevice', () => {
  it('asks the formatter for the entity part only', () => {
    const formatEntityName = vi.fn().mockReturnValue('Crossfade');
    expect(getEntityNameWithoutDevice(hass('2026.4.0', formatEntityName), HASS_ENTITY, 'Kitchen')).toBe('Crossfade');
    expect(formatEntityName).toHaveBeenCalledWith(HASS_ENTITY, { type: 'entity' });
  });

  it('strips the device name from the friendly name when unsupported', () => {
    expect(getEntityNameWithoutDevice(hass('2026.3.0', vi.fn()), HASS_ENTITY, 'Kitchen')).toBe('Crossfade');
  });
});
