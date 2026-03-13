import { css, html, LitElement, nothing, PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { mdiBookshelf, mdiHeart, mdiHeartOutline, mdiSkipNext } from '@mdi/js';
import Store from '../model/store';
import { MediaPlayerItem } from '../types';
import { mediaItemTitleStyle } from '../constants';
import { renderFavoritesItem } from '../utils/media-browse-utils';
import './playing-bars';
import './icon-button';
import { customEvent } from '../utils/utils';

class MediaRow extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) item!: MediaPlayerItem;
  @property({ type: Boolean }) selected = false;
  @property({ type: Boolean }) playing = false;
  @property({ type: Boolean }) searchHighlight = false;
  @property({ type: Boolean }) showCheckbox = false;
  @property({ type: Boolean }) checked = false;
  @property({ type: Boolean }) showQueueButton = false;
  @property({ type: Boolean }) queueButtonDisabled = false;
  @property({ type: Boolean }) showFavoriteBadge = false;
  @property({ type: Boolean }) showLibraryBadge = false;
  @property({ type: Boolean }) isFavorite: boolean | null = null;
  @property({ type: Boolean }) favoriteLoading = false;
  @property({ type: Boolean }) isInLibrary: boolean | null = null;
  @property({ type: Boolean }) libraryLoading = false;

  render() {
    const { itemBackgroundColor, itemTextColor, selectedItemBackgroundColor, selectedItemTextColor } = this.store?.config?.queue ?? {};
    const bgColor = this.selected ? selectedItemBackgroundColor : itemBackgroundColor;
    const textColor = this.selected ? selectedItemTextColor : itemTextColor;
    const listItemHeight = this.store.config.listItemHeight;
    const cssVars =
      (bgColor ? `--secondary-background-color: ${bgColor};` : '') +
      (textColor ? `--secondary-text-color: ${textColor};` : '') +
      (listItemHeight ? `height: ${listItemHeight}rem;` : '');
    const hasBadges = this.showFavoriteBadge || this.showLibraryBadge || this.isFavorite !== null || this.isInLibrary !== null;
    const showClickableHeart = this.isFavorite !== null;
    const showClickableLibrary = this.isInLibrary !== null;
    return html`
      <mwc-list-item
        ?hasMeta=${this.playing || hasBadges}
        ?selected=${this.selected}
        ?activated=${this.selected}
        class="button ${this.searchHighlight ? 'search-highlight' : ''}"
        style="${cssVars}"
      >
        <div class="row">
          ${this.showCheckbox
            ? html`<div class="icon-slot">
                <ha-checkbox .checked=${this.checked} @change=${this.onCheckboxChange} @click=${(e: Event) => e.stopPropagation()}></ha-checkbox>
              </div>`
            : this.showQueueButton
              ? html`<div class="icon-slot">
                  <sonos-icon-button
                    class=${classMap({ 'queue-btn': true, disabled: this.queueButtonDisabled })}
                    .path=${mdiSkipNext}
                    ?disabled=${this.queueButtonDisabled}
                    @click=${this.onQueueClick}
                  ></sonos-icon-button>
                </div>`
              : nothing}
          ${renderFavoritesItem(this.item)}
        </div>
        <div class="meta-content" slot="meta">
          <sonos-playing-bars .show=${this.playing}></sonos-playing-bars>
          ${hasBadges
            ? html`<div class="badges">
                ${showClickableHeart
                  ? html`<div class="badge-toggle ${this.favoriteLoading ? 'loading' : ''}" @click=${this.onFavoriteClick}>
                      ${this.favoriteLoading
                        ? html`<ha-circular-progress indeterminate size="tiny"></ha-circular-progress>`
                        : html`<ha-svg-icon class=${this.isFavorite ? 'accent' : ''} .path=${this.isFavorite ? mdiHeart : mdiHeartOutline}></ha-svg-icon>`}
                    </div>`
                  : this.showFavoriteBadge
                    ? html`<ha-svg-icon class="accent" .path=${mdiHeart}></ha-svg-icon>`
                    : nothing}
                ${showClickableLibrary
                  ? html`<div class="badge-toggle ${this.libraryLoading ? 'loading' : ''}" @click=${this.onLibraryClick}>
                      ${this.libraryLoading
                        ? html`<ha-circular-progress indeterminate size="tiny"></ha-circular-progress>`
                        : html`<ha-svg-icon class=${this.isInLibrary ? 'accent' : ''} .path=${mdiBookshelf}></ha-svg-icon>`}
                    </div>`
                  : this.showLibraryBadge
                    ? html`<ha-svg-icon class="accent" .path=${mdiBookshelf}></ha-svg-icon>`
                    : nothing}
              </div>`
            : nothing}
          <slot></slot>
        </div>
      </mwc-list-item>
    `;
  }

  private onCheckboxChange(e: Event) {
    const checkbox = e.target as HTMLInputElement;
    this.dispatchEvent(customEvent('checkbox-change', { checked: checkbox.checked }));
  }

  private onQueueClick(e: Event) {
    e.stopPropagation();
    this.dispatchEvent(customEvent('queue-item'));
  }

  private onFavoriteClick(e: Event) {
    e.stopPropagation();
    if (!this.favoriteLoading) {
      this.dispatchEvent(customEvent('favorite-toggle', { isFavorite: this.isFavorite }));
    }
  }

  private onLibraryClick(e: Event) {
    e.stopPropagation();
    if (!this.libraryLoading) {
      this.dispatchEvent(customEvent('library-toggle', { isInLibrary: this.isInLibrary }));
    }
  }

  protected async firstUpdated(_changedProperties: PropertyValues) {
    super.firstUpdated(_changedProperties);
    await this.scrollToSelected(_changedProperties);
  }

  protected async updated(_changedProperties: PropertyValues) {
    super.updated(_changedProperties);
    await this.scrollToSelected(_changedProperties);
  }

  private async scrollToSelected(changedProperties: PropertyValues) {
    await new Promise((r) => setTimeout(r, 0));
    const selectedChanged = changedProperties.has('selected') && this.selected;
    const highlightChanged = changedProperties.has('searchHighlight') && this.searchHighlight;
    if (selectedChanged || highlightChanged) {
      this.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  static get styles() {
    return [
      css`
        :host {
          display: block;
          min-width: 0;
        }
        .mdc-deprecated-list-item__text {
          width: 100%;
        }
        .button {
          margin: 0.3rem;
          border-radius: 0.3rem;
          height: 1.8rem;
          padding-inline: 0.1rem;
        }

        .button.search-highlight {
          outline: 2px solid var(--accent-color, #03a9f4);
          outline-offset: -2px;
        }

        .row {
          display: flex;
          flex: 1;
          align-items: center;
          min-width: 0;
        }

        .icon-slot {
          width: 36px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        ha-checkbox {
          --mdc-checkbox-unchecked-color: var(--secondary-text-color);
          flex-shrink: 0;
        }

        .queue-btn {
          flex-shrink: 0;
          --mdc-icon-button-size: 36px;
          --mdc-icon-size: 20px;
        }

        .queue-btn.disabled {
          color: var(--disabled-text-color);
          cursor: default;
        }

        .thumbnail {
          width: var(--icon-width, 20px);
          height: var(--icon-width, 20px);
          background-size: contain;
          background-repeat: no-repeat;
          background-position: left;
        }

        .title {
          font-size: calc(var(--sonos-font-size, 1rem) * 1.1);
          align-self: center;
          flex: 1;
        }

        .meta-content {
          display: flex;
          align-items: center;
          gap: 4px;
          padding-inline: 4px;
        }

        .badges {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .badges > *:not(.badge-toggle) {
          --mdc-icon-size: 16px;
          width: 16px;
          height: 16px;
          opacity: 0.7;
        }

        .badges ha-svg-icon.accent {
          color: var(--accent-color, #03a9f4);
          opacity: 1;
        }

        .badge-toggle {
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }

        .badge-toggle ha-svg-icon {
          --mdc-icon-size: 16px;
          width: 16px;
          height: 16px;
          opacity: 0.7;
        }

        .badge-toggle:hover ha-svg-icon {
          opacity: 1;
        }

        .badge-toggle.loading {
          pointer-events: none;
        }

        .badge-toggle ha-circular-progress {
          --md-circular-progress-size: 14px;
        }

        mwc-list-item {
          --mdc-list-item-meta-size: auto;
          overflow: visible;
        }

        .mdc-deprecated-list-item__meta {
          margin-right: 4px;
        }
      `,
      mediaItemTitleStyle,
    ];
  }
}

customElements.define('sonos-media-row', MediaRow);
