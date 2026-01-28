// @ts-nocheck
// Stub for state_active - simplified version
import type { HassEntity } from 'home-assistant-js-websocket';

export const stateActive = (stateObj: HassEntity): boolean => {
  const state = stateObj.state;
  return state !== 'unavailable' && state !== 'unknown' && state !== 'off';
};
