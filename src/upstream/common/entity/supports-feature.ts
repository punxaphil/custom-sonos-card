// @ts-nocheck
export const supportsFeature = (stateObj: { attributes: { supported_features?: number } }, feature: number): boolean => {
    return ((stateObj.attributes.supported_features ?? 0) & feature) !== 0;
};
