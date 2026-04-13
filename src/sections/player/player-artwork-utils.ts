import Store from '../../model/store';
import { MUSIC_NOTES_BASE64_IMAGE, TV_BASE64_IMAGE } from '../../constants';
import { ArtworkMatchAttributes, MediaArtworkOverride } from '../../types';
import { findMatchingCustomFavorite } from '../../utils/media-browse-utils';

function matchesString(value: string | undefined, expected: string | undefined): boolean {
  return !!value && value === expected;
}

function matchesRegexp(value: string | undefined, pattern: string | undefined): boolean {
  if (!value || !pattern) {
    return false;
  }
  try {
    return new RegExp(pattern).test(value);
  } catch {
    return false;
  }
}

export function findMatchingOverride(overrides: MediaArtworkOverride[], attrs: ArtworkMatchAttributes, entityImage?: string): MediaArtworkOverride | undefined {
  let override = overrides.find(
    (value) =>
      matchesString(attrs.media_title, value.mediaTitleEquals) ||
      matchesString(attrs.media_artist, value.mediaArtistEquals) ||
      matchesString(attrs.media_album_name, value.mediaAlbumNameEquals) ||
      matchesString(attrs.media_channel, value.mediaChannelEquals) ||
      matchesString(attrs.media_content_id, value.mediaContentIdEquals) ||
      matchesString(attrs.app_name, value.appNameEquals) ||
      matchesString(attrs.source, value.sourceEquals) ||
      matchesString(attrs.app_id, value.appIdEquals) ||
      matchesRegexp(attrs.media_title, value.mediaTitleRegexp) ||
      matchesRegexp(attrs.media_artist, value.mediaArtistRegexp) ||
      matchesRegexp(attrs.media_album_name, value.mediaAlbumNameRegexp) ||
      matchesRegexp(attrs.media_channel, value.mediaChannelRegexp) ||
      matchesRegexp(attrs.media_content_id, value.mediaContentIdRegexp) ||
      matchesRegexp(attrs.app_name, value.appNameRegexp) ||
      matchesRegexp(attrs.source, value.sourceRegexp) ||
      matchesRegexp(attrs.app_id, value.appIdRegexp),
  );
  if (!override) {
    override = overrides.find((value) => !entityImage && value.ifMissing);
  }
  return override;
}

export function findArtworkOverride(store: Store, entityImage?: string) {
  const overrides = store.config.player?.mediaArtworkOverrides;
  if (!overrides) {
    return undefined;
  }
  const { media_title, media_artist, media_album_name, media_content_id, media_channel, app_name, source, app_id } = store.activePlayer.attributes;
  return findMatchingOverride(
    overrides,
    { media_title, media_artist, media_album_name, media_content_id, media_channel, app_name, source, app_id },
    entityImage,
  );
}

export function getArtworkImage(store: Store, resolvedImageUrl?: string) {
  const prefix = store.config.player?.artworkHostname || '';
  const { entity_picture, entity_picture_local, app_id } = store.activePlayer.attributes;
  let entityImage = entity_picture ? prefix + entity_picture : entity_picture;
  if (app_id === 'music_assistant') {
    entityImage = entity_picture_local ? prefix + entity_picture_local : entity_picture;
  }
  let sizePercentage = undefined;
  const override = findArtworkOverride(store, entityImage);
  if (override?.imageUrl) {
    if (override.imageUrl.includes('{{')) {
      entityImage = resolvedImageUrl ?? '';
    } else {
      entityImage = override.imageUrl;
    }
    sizePercentage = override?.sizePercentage ?? sizePercentage;
  }
  if (!override) {
    const matchingFavorite = findMatchingCustomFavorite(
      store.config.mediaBrowser?.favorites?.customFavorites,
      store.activePlayer.attributes.media_content_id,
      store.activePlayer.id,
    );
    if (matchingFavorite?.useThumbnailAsArtwork && matchingFavorite.thumbnail) {
      entityImage = matchingFavorite.thumbnail;
    }
  }
  return { entityImage, sizePercentage };
}

export function getFallbackImage(store: Store) {
  return store.config.player?.fallbackArtwork ?? (store.activePlayer.attributes.media_title === 'TV' ? TV_BASE64_IMAGE : MUSIC_NOTES_BASE64_IMAGE);
}

export function getBackgroundImage(store: Store, imageLoaded: boolean, resolvedImageUrl?: string) {
  const image = getArtworkImage(store, resolvedImageUrl);
  if (image?.entityImage && imageLoaded) {
    const sizeStyle = image.sizePercentage ? `; background-size: ${image.sizePercentage}%` : '';
    return `background-image: url(${image.entityImage.replace(/ /g, '%20')})${sizeStyle}`;
  }
  return `background-image: url(${getFallbackImage(store).replace(/ /g, '%20')})`;
}

export function getBackgroundImageUrl(store: Store, imageLoaded: boolean, resolvedImageUrl?: string) {
  const image = getArtworkImage(store, resolvedImageUrl);
  if (image?.entityImage && imageLoaded) {
    return `url(${image.entityImage.replace(/ /g, '%20')})`;
  }
  return `url(${getFallbackImage(store).replace(/ /g, '%20')})`;
}

export function getArtworkStyle(store: Store, imageLoaded: boolean, resolvedImageUrl?: string) {
  const { artworkMinHeight: minHeight = 5, artworkBorderRadius: borderRadius = 0 } = store.config.player ?? {};
  const bg = getBackgroundImage(store, imageLoaded, resolvedImageUrl);
  if (borderRadius > 0) {
    return `${bg}; border-radius: ${borderRadius}px; background-size: cover; aspect-ratio: 1; height: 100%; max-height: 50vh; width: auto; margin: 0 auto;`;
  }
  return `${bg}; min-height: ${minHeight}rem`;
}
