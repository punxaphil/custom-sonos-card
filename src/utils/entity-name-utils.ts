import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { EntityNameItem, HomeAssistantWithEntityNames } from '../types';

const FIRST_SUPPORTED_MAJOR = 2026;
const FIRST_SUPPORTED_MINOR = 4;

export const supportsEntityNames = (hass?: HomeAssistant): hass is HomeAssistantWithEntityNames => {
  if (typeof (hass as HomeAssistantWithEntityNames | undefined)?.formatEntityName !== 'function') {
    return false;
  }
  const [major, minor] = (hass?.config?.version ?? '').split('.', 2);
  return Number(major) > FIRST_SUPPORTED_MAJOR || (Number(major) === FIRST_SUPPORTED_MAJOR && Number(minor) >= FIRST_SUPPORTED_MINOR);
};

export const getEntityName = (hass?: HomeAssistant, hassEntity?: HassEntity, name?: EntityNameItem | EntityNameItem[]): string => {
  if (!hassEntity) {
    return '';
  }
  if (supportsEntityNames(hass)) {
    return hass.formatEntityName(hassEntity, name) ?? '';
  }
  return hassEntity.attributes.friendly_name ?? '';
};

export const getEntityNameWithoutDevice = (hass: HomeAssistant | undefined, hassEntity: HassEntity, deviceName: string): string => {
  if (supportsEntityNames(hass)) {
    return getEntityName(hass, hassEntity, { type: 'entity' });
  }
  return getEntityName(hass, hassEntity).replaceAll(deviceName, '').trim();
};
