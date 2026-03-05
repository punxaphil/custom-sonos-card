import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { mdiCheckboxMultipleMarkedOutline, mdiCloseBoxMultipleOutline, mdiTrashCanOutline } from '@mdi/js';
import type Store from '../../model/store';
import type { MediaPlayerItem } from '../../types';
import { customEvent } from '../../utils/utils';
import type { QueueHeaderAction } from './queue.types';
import './queue-search';
import '../../components/selection-actions';
import '../../components/icon-button';

export class QueueHeader extends LitElement {
  @property() queueTitle = '';
  @property({ type: Number }) itemCount = 0;
  @property({ attribute: false }) items: MediaPlayerItem[] = [];
  @property({ type: Boolean }) selectMode = false;
  @property({ type: Boolean }) hasSelection = false;
  @property({ type: Boolean }) operationRunning = false;
  @property({ attribute: false }) store!: Store;

  render() {
    return html`
      <div class="header">
        <div class="title-container">
          <span class="title">${this.queueTitle}</span>
          <span class="item-count" ?hidden=${this.itemCount === 0}>(${this.itemCount} items)</span>
        </div>
        <div class="header-icons">
          <sonos-queue-search .items=${this.items} .selectMode=${this.selectMode} @queue-search-action=${this.onSearchAction}></sonos-queue-search>
          <div ?hidden=${!this.selectMode}>
            <sonos-selection-actions
              .hasSelection=${this.hasSelection}
              .disabled=${this.operationRunning}
              @invert-selection=${() => this.dispatchAction({ type: 'invert-selection' })}
              @play-selected=${() => this.dispatchAction({ type: 'play-selected' })}
              @queue-selected=${() => this.dispatchAction({ type: 'queue-selected-after-current' })}
              @queue-selected-at-end=${() => this.dispatchAction({ type: 'queue-selected-at-end' })}
            ></sonos-selection-actions>
            <sonos-icon-button
              .path=${mdiCloseBoxMultipleOutline}
              @click=${() => this.dispatchAction({ type: 'delete-selected' })}
              title="Delete selected"
              ?hidden=${!this.hasSelection}
            ></sonos-icon-button>
            <div class="delete-all-btn" @click=${() => this.dispatchAction({ type: 'clear-queue' })} title="Delete all">
              <sonos-icon-button .path=${mdiTrashCanOutline}></sonos-icon-button>
              <span class="all-label">*</span>
            </div>
          </div>
          <div ?hidden=${this.selectMode}>
            <sonos-shuffle .store=${this.store}></sonos-shuffle>
            <sonos-repeat .store=${this.store}></sonos-repeat>
          </div>
          <sonos-icon-button
            .path=${mdiCheckboxMultipleMarkedOutline}
            @click=${() => this.dispatchAction({ type: 'toggle-select-mode' })}
            ?selected=${this.selectMode}
            title="Select mode"
            ?disabled=${this.operationRunning}
          ></sonos-icon-button>
        </div>
      </div>
    `;
  }

  private onSearchAction(e: Event) {
    const { detail } = e as CustomEvent;
    this.dispatchEvent(new CustomEvent('queue-search-action', { detail, bubbles: true, composed: true }));
  }

  private dispatchAction(action: QueueHeaderAction) {
    this.dispatchEvent(customEvent('queue-header-action', action));
  }

  static styles = css`
    :host {
      display: block;
      flex-shrink: 0;
    }
    [hidden] {
      display: none !important;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem;
      position: relative;
    }
    .header-icons {
      white-space: nowrap;
      display: flex;
      align-items: center;
    }
    .header-icons > * {
      display: inline-block;
    }
    .title-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
      padding: 0.5rem;
    }
    .title {
      font-size: calc(var(--sonos-font-size, 1rem) * 1.2);
      font-weight: bold;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .item-count {
      font-size: calc(var(--sonos-font-size, 1rem) * 0.9);
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }
    .delete-all-btn {
      display: inline-flex;
      position: relative;
      cursor: pointer;
    }
    .delete-all-btn .all-label {
      position: absolute;
      bottom: -16px;
      left: 63%;
      font-size: 2em;
      font-weight: bold;
      color: var(--secondary-text-color);
      pointer-events: none;
      -webkit-text-stroke: 0.5px black;
      text-shadow: 0 0 2px black;
    }
  `;
}

customElements.define('sonos-queue-header', QueueHeader);
