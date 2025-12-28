// @ts-nocheck
export const isTTSMediaSource = (mediaContentId?: string): boolean => {
    return mediaContentId?.startsWith('media-source://tts/') ?? false;
};
