import { css, html, nothing, type TemplateResult } from 'lit';
import { mdiBookmark } from '@mdi/js';
import Store from '../../model/store';
import { MediaBrowserShortcut, MediaPlayerItem } from '../../types';
import '../../components/icon-button';

export const mediaGridCardStyles = css`
  .child {
    display: flex;
    flex-direction: column;
    cursor: pointer;
  }

  ha-card {
    position: relative;
    width: 100%;
    box-sizing: border-box;
  }

  .child ha-card {
    overflow: hidden;
  }

  .child ha-card .thumbnail {
    width: 100%;
    position: relative;
    box-sizing: border-box;
    transition: padding-bottom 0.1s ease-out;
    padding-bottom: 100%;
  }

  ha-card .image {
    border-radius: var(--ha-border-radius-sm) var(--ha-border-radius-sm) var(--ha-border-radius-square) var(--ha-border-radius-square);
  }

  .image {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
  }

  .centered-image {
    margin: 0 8px;
    background-size: contain;
  }

  .brand-image {
    background-size: 40%;
  }

  .child .title {
    color: var(--secondary-text-color);
    font-size: calc(var(--sonos-font-size, 1rem) * 0.8);
    font-weight: normal;
    padding-top: 7px;
    padding-inline: 8px;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .child ha-card .title {
    margin-bottom: 6px;
    padding-left: 8px;
    padding-right: 8px;
  }

  ha-card:hover .image {
    filter: brightness(70%);
    transition: filter 0.5s;
  }
`;

export function renderMediaGridCard(params: {
  item: MediaPlayerItem;
  onClick: (event: MouseEvent) => void;
  thumbnailContent: TemplateResult;
  actionContent?: TemplateResult;
  titleContent?: TemplateResult | typeof nothing;
  cardStyle?: string;
}) {
  const { item, onClick, thumbnailContent, actionContent = nothing, titleContent, cardStyle } = params;
  return html`
    <div class="child" .item=${item} @click=${onClick}>
      <ha-card outlined style=${cardStyle ?? ''}>
        <div class="thumbnail">${thumbnailContent} ${actionContent}</div>
        ${titleContent !== undefined ? titleContent : html`<div class="title">${item.title}</div>`}
      </ha-card>
    </div>
  `;
}

export async function playAll(store: Store, children: MediaPlayerItem[]): Promise<MediaPlayerItem | null> {
  if (!children.length) {
    return null;
  }
  await store.mediaControlService.queueAndPlay(store.activePlayer, children, 'replace');
  return children[0];
}

export function renderShortcutButton(shortcut: MediaBrowserShortcut | undefined, onClick: () => void, isActive = false) {
  if (!shortcut?.media_content_id || !shortcut?.media_content_type || !shortcut?.name) {
    return nothing;
  }
  const icon = shortcut.icon ?? mdiBookmark;
  return html`
    <sonos-icon-button class=${isActive ? 'shortcut-active' : ''} @click=${onClick} title=${shortcut.name} .path=${icon.startsWith('mdi:') ? undefined : icon}>
      ${icon.startsWith('mdi:') ? html`<ha-icon .icon=${icon}></ha-icon>` : nothing}
    </sonos-icon-button>
  `;
}
