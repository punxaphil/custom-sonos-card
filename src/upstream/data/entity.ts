// @ts-nocheck
export const isUnavailableState = (state: string | undefined): boolean => {
    return state === 'unavailable' || state === 'unknown' || !state;
};
