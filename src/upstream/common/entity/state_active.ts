// @ts-nocheck
const UNAVAILABLE_STATES = ['unavailable', 'unknown'];

export const stateActive = (stateObj: { state: string }): boolean => {
    return !UNAVAILABLE_STATES.includes(stateObj.state) && stateObj.state !== 'off';
};
