import { CardConfig, MediaPlayerItem } from './types';
import { DEFAULT_MEDIA_THUMBNAIL } from './constants';
import { html } from 'lit/development';

function hasItemsWithImage(items: MediaPlayerItem[]) {
  return items.some((item) => item.thumbnail);
}
function getThumbnail(mediaItem: MediaPlayerItem, config: CardConfig, itemsWithImage: boolean) {
  let thumbnail = mediaItem.thumbnail;
  if (!thumbnail) {
    thumbnail = config.customThumbnailIfMissing?.[mediaItem.title];
    if (itemsWithImage && !thumbnail) {
      thumbnail = config.customThumbnailIfMissing?.['default'] || DEFAULT_MEDIA_THUMBNAIL;
    }
  } else if (thumbnail?.match(/https:\/\/brands.home-assistant.io\/.+\/logo.png/)) {
    thumbnail = thumbnail?.replace('logo.png', 'icon.png');
  }
  return thumbnail || '';
}

export function itemsWithFallbacks(mediaPlayerItems: MediaPlayerItem[], config: CardConfig) {
  const itemsWithImage = hasItemsWithImage(mediaPlayerItems);
  return mediaPlayerItems.map((item) => {
    const thumbnail = getThumbnail(item, config, itemsWithImage);
    return {
      ...item,
      thumbnail,
      showFolderIcon: item.can_expand && !thumbnail,
    };
  });
}

export function mediaItemBackgroundImageStyle(thumbnail: string, index: number) {
  return html`
    <style>
      .button:nth-of-type(${index + 1}) .thumbnail {
        background-image: url(${thumbnail});
      }
    </style>
  `;
}

export function renderMediaBrowserItem(item: MediaPlayerItem, showTitle = true) {
  return html`
    <div class="thumbnail" ?hidden="${!item.thumbnail}"></div>
    <ha-icon class="folder" .icon=${'mdi:folder-music'} ?hidden="${!item.showFolderIcon}"></ha-icon>
    <div class="title" ?hidden="${!showTitle}">${item.title}</div>
  `;
}
