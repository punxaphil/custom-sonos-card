import { html, nothing } from 'lit';
import { mdiBookmark } from '@mdi/js';
import Store from '../../model/store';
import { MediaBrowserShortcut, MediaPlayerItem } from '../../types';
import '../../components/icon-button';

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
