import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import type Store from '../../model/store';
import type { MediaPlayerItem } from '../../types';
import { customEvent } from '../../utils/utils';
import type { QueueListAction } from './queue.types';
import '../../components/media-row';

export class QueueList extends LitElement {
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) searchExpanded = false;
  @property({ type: Number }) selectedIndex = -1;
  @property({ type: Number }) searchHighlightIndex = -1;
  @property({ type: Boolean }) selectMode = false;
  @property({ type: Boolean }) showQueueButton = false;
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) displayItems: MediaPlayerItem[] = [];
  @property({ attribute: false }) shownIndices: number[] = [];
  @property({ attribute: false }) selectedIndices = new Set<number>();

  scrollToItem(index: number) {
    this.shadowRoot?.querySelectorAll('sonos-media-row')?.[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  render() {
    return html`
      <div class="list ${this.searchExpanded ? 'search-active' : ''}">
        <div class="loading" ?hidden=${!this.loading}><ha-spinner></ha-spinner></div>
        <mwc-list multi ?hidden=${this.loading}>
          ${this.displayItems.map((item, index) => {
            const realIndex = this.shownIndices.length > 0 ? this.shownIndices[index] : index;
            const isSelected = this.selectedIndex >= 0 && realIndex === this.selectedIndex;
            const isPlaying = isSelected && this.store.activePlayer.isPlaying();
            const isSearchHighlight = this.searchHighlightIndex === realIndex;
            const isChecked = this.selectedIndices.has(realIndex);
            const queueButtonDisabled = isSelected || (this.selectedIndex >= 0 && realIndex === this.selectedIndex + 1);
            return html`
              <sonos-media-row
                @click=${() => this.dispatchAction({ type: 'item-click', payload: { displayIndex: index } })}
                .item=${item}
                .selected=${isSelected}
                .playing=${isPlaying}
                .searchHighlight=${isSearchHighlight}
                .showCheckbox=${this.selectMode}
                .showQueueButton=${this.showQueueButton}
                .queueButtonDisabled=${queueButtonDisabled}
                .checked=${isChecked}
                @checkbox-change=${(e: CustomEvent<{ checked: boolean }>) =>
                  this.dispatchAction({ type: 'checkbox-change', payload: { realIndex, checked: e.detail.checked } })}
                @queue-item=${() => this.dispatchAction({ type: 'queue-item', payload: { realIndex } })}
                .store=${this.store}
              ></sonos-media-row>
            `;
          })}
        </mwc-list>
      </div>
    `;
  }

  private dispatchAction(action: QueueListAction) {
    this.dispatchEvent(customEvent('queue-list-action', action));
  }

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    [hidden] {
      display: none !important;
    }
    .list {
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
      flex: 1;
      --mdc-icon-button-size: 1.5em;
      --mdc-icon-size: 1em;
    }
    .list.search-active {
      padding-top: 3rem;
    }
    .loading {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }
  `;
}

customElements.define('sonos-queue-list', QueueList);
