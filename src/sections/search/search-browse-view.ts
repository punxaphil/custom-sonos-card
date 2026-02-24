import { css, html, LitElement, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../../model/store';
import { listStyle, MEDIA_ITEM_SELECTED } from '../../constants';
import { customEvent } from '../../utils/utils';
import { toMediaPlayerItem, getMediaTypeIcon } from './search-utils';
import '../../components/media-row';
import { mdiAccessPoint, mdiArrowLeft, mdiPlay, mdiPlayBoxMultiple, mdiPlaylistPlus, mdiSkipNext, mdiSkipNextCircle } from '@mdi/js';
import { SearchResultItem } from './search.types';
import type { EnqueueMode } from '../../types';
import type { MusicAssistantService } from '../../services/music-assistant-service';

export class SearchBrowseView extends LitElement {
  @property({ attribute: false }) store!: Store;
  @property({ attribute: false }) item: SearchResultItem | null = null;
  @property({ attribute: false }) musicAssistantService!: MusicAssistantService;
  @property() massQueueConfigEntryId = '';
  @state() private browseResults: SearchResultItem[] = [];
  @state() private browseLoading = false;

  protected willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has('item') && this.item) {
      this.loadCollection();
    }
  }

  render() {
    if (!this.item) {
      return html``;
    }
    const typeIcon = getMediaTypeIcon(this.item.mediaType);

    return html`
      <div class="header browse-header">
        <ha-icon-button .path=${mdiArrowLeft} @click=${this.goBack} title="Back to results"></ha-icon-button>
        <ha-dropdown @wa-select=${this.handlePlayMenuAction}>
          <ha-icon-button slot="trigger" .path=${mdiPlay} title="Play options"></ha-icon-button>
          <ha-dropdown-item value="0">
            <ha-svg-icon slot="icon" .path=${mdiPlayBoxMultiple}></ha-svg-icon>
            Play Now (clear queue)
          </ha-dropdown-item>
          <ha-dropdown-item value="1">
            <ha-svg-icon slot="icon" .path=${mdiAccessPoint}></ha-svg-icon>
            Start Radio
          </ha-dropdown-item>
          <ha-dropdown-item value="2">
            <ha-svg-icon slot="icon" .path=${mdiPlay}></ha-svg-icon>
            Play Now
          </ha-dropdown-item>
          <ha-dropdown-item value="3">
            <ha-svg-icon slot="icon" .path=${mdiSkipNext}></ha-svg-icon>
            Play Next
          </ha-dropdown-item>
          <ha-dropdown-item value="4">
            <ha-svg-icon slot="icon" .path=${mdiPlaylistPlus}></ha-svg-icon>
            Add to Queue
          </ha-dropdown-item>
          <ha-dropdown-item value="5">
            <ha-svg-icon slot="icon" .path=${mdiSkipNextCircle}></ha-svg-icon>
            Play Next (clear queue)
          </ha-dropdown-item>
        </ha-dropdown>
        <span class="browse-title" title=${this.item.title}>${this.item.title}</span>
        <ha-icon-button .path=${typeIcon} disabled class="type-indicator"></ha-icon-button>
      </div>
      <div class="loading" ?hidden=${!this.browseLoading}><ha-spinner></ha-spinner></div>
      <div class="no-results" ?hidden=${this.browseLoading || this.browseResults.length > 0}>No items found</div>
      <div class="list" ?hidden=${this.browseLoading || this.browseResults.length === 0}>
        <mwc-list multi>
          ${this.browseResults.map((browseItem, index) => {
            const mediaPlayerItem = toMediaPlayerItem(browseItem);
            return html` <sonos-media-row @click=${() => this.onBrowseItemClick(index)} .item=${mediaPlayerItem} .store=${this.store}></sonos-media-row> `;
          })}
        </mwc-list>
      </div>
    `;
  }

  private async loadCollection() {
    this.browseLoading = true;
    this.browseResults = [];
    try {
      this.browseResults = await this.musicAssistantService.getCollectionItems(this.item!.uri, this.item!.mediaType, this.massQueueConfigEntryId);
    } catch (e) {
      console.error('Failed to browse collection:', e);
    } finally {
      this.browseLoading = false;
    }
  }

  private goBack() {
    this.browseResults = [];
    this.browseLoading = false;
    this.dispatchEvent(customEvent('go-back'));
  }

  private async onBrowseItemClick(index: number) {
    const browseItem = this.browseResults[index];
    if (!browseItem) {
      return;
    }
    await this.store.mediaControlService.playMedia(this.store.activePlayer, toMediaPlayerItem(browseItem), 'play');
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
  }

  private handlePlayMenuAction(e: CustomEvent<{ item: { value: string } }>) {
    const actions: { enqueue: EnqueueMode; radioMode?: boolean }[] = [
      { enqueue: 'replace' },
      { enqueue: 'play', radioMode: true },
      { enqueue: 'play' },
      { enqueue: 'next' },
      { enqueue: 'add' },
      { enqueue: 'replace_next' },
    ];
    const action = actions[parseInt(e.detail.item.value)];
    if (action && this.item) {
      this.musicAssistantService.playMedia(this.store.activePlayer, this.item.uri, action.enqueue, action.radioMode);
      this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
    }
  }

  static get styles() {
    return [
      listStyle,
      css`
        [hidden] {
          display: none !important;
        }
        .browse-header {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0 0.25rem;
        }
        .browse-title {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 1rem;
          font-weight: 500;
        }
        .type-indicator {
          opacity: 0.4;
          pointer-events: none;
        }
        .loading {
          display: flex;
          justify-content: center;
          padding: 2rem;
        }
        .no-results {
          text-align: center;
          padding: 2rem;
          color: var(--secondary-text-color);
        }
      `,
    ];
  }
}

customElements.define('sonos-search-browse-view', SearchBrowseView);
