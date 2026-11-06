import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { CardConfig, EntityName, HomeAssistantWithEntityNames } from '../types';

const FIRST_SUPPORTED_MAJOR = 2026;
const FIRST_SUPPORTED_MINOR = 4;

export const supportsEntityNames = (hass?: HomeAssistant): hass is HomeAssistantWithEntityNames => {
  if (typeof (hass as HomeAssistantWithEntityNames | undefined)?.formatEntityName !== 'function') {
    return false;
  }
  const [major, minor] = (hass?.config?.version ?? '').split('.', 2);
  return Number(major) > FIRST_SUPPORTED_MAJOR || (Number(major) === FIRST_SUPPORTED_MAJOR && Number(minor) >= FIRST_SUPPORTED_MINOR);
};

export const getEntityName = (hass?: HomeAssistant, hassEntity?: HassEntity, name?: EntityName): string => {
  if (!hassEntity) {
    return '';
  }
  if (supportsEntityNames(hass)) {
    return hass.formatEntityName(hassEntity, name) ?? '';
  }
  return hassEntity.attributes.friendly_name ?? '';
};

export const getPlayerName = (hass: HomeAssistant | undefined, hassEntity: HassEntity | undefined, config: CardConfig): string => {
  const name = getEntityName(hass, hassEntity, config.entityName);
  const displayName = config.entityNameRegexToReplace
    ? name.replace(new RegExp(config.entityNameRegexToReplace, 'g'), config.entityNameReplacement || '')
    : name;
  if (config.entityName === undefined || displayName.trim()) {
    return displayName;
  }
  const defaultName = getEntityName(hass, hassEntity);
  return defaultName.trim() ? defaultName : hassEntity?.entity_id || '';
};

export const getEntityNameWithoutDevice = (hass: HomeAssistant | undefined, hassEntity: HassEntity, deviceName: string): string => {
  if (supportsEntityNames(hass)) {
    return getEntityName(hass, hassEntity, { type: 'entity' });
  }
  return getEntityName(hass, hassEntity).replaceAll(deviceName, '').trim();
};
