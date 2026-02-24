import { html, nothing } from 'lit';
import { mdiBookmark } from '@mdi/js';
import Store from '../../model/store';
import { MediaBrowserShortcut, MediaPlayerItem } from '../../types';

export async function playAll(store: Store, children: MediaPlayerItem[]): Promise<MediaPlayerItem | null> {
  if (!children.length) {
    return null;
  }
  const player = store.activePlayer;
  await store.hass.callService('media_player', 'play_media', {
    entity_id: player.id,
    media_content_id: children[0].media_content_id,
    media_content_type: children[0].media_content_type,
    enqueue: 'replace',
  });
  await Promise.all(
    children.slice(1).map((child) =>
      store.hass.callService('media_player', 'play_media', {
        entity_id: player.id,
        media_content_id: child.media_content_id,
        media_content_type: child.media_content_type,
        enqueue: 'add',
      }),
    ),
  );
  return children[0];
}

export function renderShortcutButton(shortcut: MediaBrowserShortcut | undefined, onClick: () => void, isActive = false) {
  if (!shortcut?.media_content_id || !shortcut?.media_content_type || !shortcut?.name) {
    return nothing;
  }
  const icon = shortcut.icon ?? mdiBookmark;
  return html`
    <ha-icon-button class=${isActive ? 'shortcut-active' : ''} @click=${onClick} title=${shortcut.name} .path=${icon.startsWith('mdi:') ? undefined : icon}>
      ${icon.startsWith('mdi:') ? html`<ha-icon .icon=${icon}></ha-icon>` : nothing}
    </ha-icon-button>
  `;
}
