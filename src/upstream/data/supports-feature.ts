// @ts-nocheck
// Stub for supportsFeature
import type { HassEntity } from 'home-assistant-js-websocket';

export const supportsFeature = (stateObj: HassEntity, feature: number): boolean => {
  return (stateObj.attributes.supported_features! & feature) !== 0;
};
