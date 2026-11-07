import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { mdiFolderOpen, mdiPlayBoxMultiple, mdiPlaylistPlus, mdiShuffleVariant, mdiSkipNext, mdiStar, mdiStarOff } from '@mdi/js';
import { HomeAssistant } from 'custom-card-helpers';
import { MediaPlayerItem } from '../types';
import { browserText, BrowserStringKey } from '../sections/media-browser/i18n';

export type ItemAction = 'replace' | 'next' | 'add' | 'shuffle' | 'open' | 'favorite-add' | 'favorite-remove';

interface ActionRow {
  action: ItemAction;
  icon: string;
  label: BrowserStringKey;
  hint?: BrowserStringKey;
}

/**
 * Bottom sheet opened by a long press on an item: big 56px rows for the kitchen touch screen.
 * Fires `item-action` with `{ action, item }`, and `close`.
 */
export class ItemActionsSheet extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) item?: MediaPlayerItem;
  @property({ type: Boolean }) pinned = false;
  /** Hide "Open" (e.g. when the sheet is opened from inside that item). */
  @property({ type: Boolean }) hideOpen = false;

  private rows(): ActionRow[] {
    const item = this.item!;
    const rows: ActionRow[] = [];
    if (item.can_play !== false) {
      rows.push(
        { action: 'replace', icon: mdiPlayBoxMultiple, label: 'actionReplace', hint: 'actionReplaceHint' },
        { action: 'next', icon: mdiSkipNext, label: 'actionNext' },
        { action: 'add', icon: mdiPlaylistPlus, label: 'actionAdd' },
      );
      if (item.can_expand) {
        rows.push({ action: 'shuffle', icon: mdiShuffleVariant, label: 'actionShuffle' });
      }
    }
    if (item.can_expand && !this.hideOpen) {
      rows.push({ action: 'open', icon: mdiFolderOpen, label: 'actionOpen' });
    }
    if (item.media_content_id) {
      rows.push(
        this.pinned
          ? { action: 'favorite-remove', icon: mdiStarOff, label: 'actionFavoriteRemove' }
          : { action: 'favorite-add', icon: mdiStar, label: 'actionFavoriteAdd' },
      );
    }
    return rows;
  }

  private select(action: ItemAction) {
    this.dispatchEvent(new CustomEvent('item-action', { detail: { action, item: this.item }, bubbles: true, composed: true }));
  }

  private close = () => this.dispatchEvent(new CustomEvent('close'));

  render() {
    if (!this.item) {
      return nothing;
    }
    const t = (key: BrowserStringKey) => browserText(this.hass, key);
    const thumbnail = this.item.thumbnail && !this.item.thumbnail.startsWith('/') ? this.item.thumbnail : '';
    return html`
      <div class="backdrop" @click=${this.close}></div>
      <div class="sheet" role="dialog" aria-label=${this.item.title ?? ''}>
        <div class="grabber"></div>
        <div class="head">
          <div class="art" style=${thumbnail ? `background-image:url("${thumbnail}")` : ''}></div>
          <div class="head-text">
            <div class="title">${this.item.title}</div>
            ${
              this.item.media_class
                ? html`<div class="subtitle">
                    ${this.hass.localize(`ui.components.media-browser.class.${String(this.item.media_class)}`) || String(this.item.media_class)}
                  </div>`
                : nothing
            }
          </div>
        </div>
        ${this.rows().map(
          (row) => html`
            <button class="row ${row.action.startsWith('favorite') ? 'favorite' : ''}" @click=${() => this.select(row.action)}>
              <ha-svg-icon .path=${row.icon}></ha-svg-icon>
              <span class="label"> ${t(row.label)} ${row.hint ? html`<small>${t(row.hint)}</small>` : nothing} </span>
            </button>
          `,
        )}
        <button class="cancel" @click=${this.close}>${t('cancel')}</button>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        position: absolute;
        inset: 0;
        z-index: 30;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }
      .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        animation: fade 0.15s ease-out;
      }
      .sheet {
        position: relative;
        max-height: 90%;
        overflow-y: auto;
        padding: 6px 12px 12px;
        border-radius: 20px 20px 0 0;
        background: var(--card-background-color, #1c1c1c);
        color: var(--primary-text-color);
        box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.4);
        animation: up 0.2s ease-out;
      }
      .grabber {
        width: 40px;
        height: 4px;
        border-radius: 2px;
        margin: 4px auto 10px;
        background: var(--divider-color);
      }
      .head {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 4px 12px;
        border-bottom: 1px solid var(--divider-color);
        margin-bottom: 6px;
      }
      .art {
        width: 52px;
        height: 52px;
        flex: none;
        border-radius: 10px;
        background: rgba(127, 127, 127, 0.18) center / cover no-repeat;
      }
      .head-text {
        min-width: 0;
      }
      .title {
        font-weight: 600;
        font-size: 1.05rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .subtitle {
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
        margin-top: 2px;
      }
      button {
        font: inherit;
        color: inherit;
        border: none;
        background: none;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .row {
        width: 100%;
        min-height: 56px;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 0 12px;
        border-radius: 12px;
        text-align: left;
        font-size: 1rem;
      }
      .row:active {
        background: rgba(127, 127, 127, 0.18);
      }
      .row ha-svg-icon {
        --mdc-icon-size: 26px;
        color: var(--secondary-text-color);
        flex: none;
      }
      .row.favorite ha-svg-icon {
        color: var(--accent-color, var(--primary-color));
      }
      .label {
        display: flex;
        flex-direction: column;
      }
      .label small {
        font-size: 0.75rem;
        color: var(--secondary-text-color);
      }
      .cancel {
        width: 100%;
        height: 52px;
        margin-top: 8px;
        border-radius: 26px;
        background: rgba(127, 127, 127, 0.16);
        font-weight: 600;
      }
      @keyframes up {
        from {
          transform: translateY(100%);
        }
      }
      @keyframes fade {
        from {
          opacity: 0;
        }
      }
    `;
  }
}

if (!customElements.get('sonos-item-actions')) {
  customElements.define('sonos-item-actions', ItemActionsSheet);
}
