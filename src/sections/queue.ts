import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { listStyle, MEDIA_ITEM_SELECTED } from '../constants';
import { customEvent } from '../utils/utils';
import { mdiPlaylistEdit, mdiPlaylistRemove, mdiTrashCanOutline } from '@mdi/js';
import '../components/media-row';
import { until } from 'lit-html/directives/until.js';

export class Queue extends LitElement {
  @property() store!: Store;
  @state() activePlayer!: MediaPlayer;
  @state() editMode = false;
  @state() firstRender = true;

  render() {
    this.activePlayer = this.store.activePlayer;
    const selected = this.activePlayer.attributes.queue_position - 1;
    return html`${this.renderQueue(selected)}`;
  }

  private renderQueue(selected: number) {
    this.firstRender = false;
    return html`
      <div class="header">
        <div class="title">
          ${this.store.config.queue?.title ??
          (this.activePlayer.attributes.media_playlist ?? `Play Queue`) +
            (this.activePlayer.attributes.media_channel ? ' (not active)' : '')}
        </div>
        <div class="header-icons">
          <sonos-shuffle .store=${this.store}></sonos-shuffle>
          <sonos-repeat .store=${this.store}></sonos-repeat>
          <ha-icon-button .path=${mdiPlaylistRemove} @click=${this.clearQueue}></ha-icon-button>
          <ha-icon-button
            .path=${mdiPlaylistEdit}
            @click=${this.toggleEditMode}
            selected=${this.editMode || nothing}
          ></ha-icon-button>
        </div>
      </div>
      <div class="list">
        <mwc-list multi>
          ${until(
            this.store.hassService.getQueue(this.store.activePlayer).then((queue) =>
              queue.map((item, index) => {
                const isSelected = selected !== undefined && selected === index;
                const isPlaying = isSelected && this.activePlayer.isPlaying();
                return html`
                  <sonos-media-row
                    @click=${() => this.onMediaItemSelected(index)}
                    .item=${item}
                    .selected=${isSelected}
                    .playing=${isPlaying}
                    .store=${this.store}
                    ><ha-icon-button
                      hide=${this.editMode && nothing}
                      @click=${(event: Event) => {
                        event.stopPropagation();
                        return this.removeFromQueue(index);
                      }}
                      .path=${mdiTrashCanOutline}
                    ></ha-icon-button
                  ></sonos-media-row>
                `;
              }),
            ),
          )}
        </mwc-list>
      </div>
    `;
  }

  private onMediaItemSelected = async (index: number) => {
    if (!this.editMode) {
      await this.store.hassService.playQueue(this.activePlayer, index);
      this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
    }
  };

  private toggleEditMode() {
    this.editMode = !this.editMode;
  }

  private async clearQueue() {
    await this.store.hassService.clearQueue(this.activePlayer);
    this.requestUpdate();
  }

  private async removeFromQueue(index: number) {
    await this.store.hassService.removeFromQueue(this.activePlayer, index);
    this.requestUpdate();
  }

  static get styles() {
    return [
      listStyle,
      css`
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
        }
        .header-icons {
          white-space: nowrap;
        }
        .header-icons > * {
          display: inline-block;
        }
        .title {
          text-align: center;
          font-size: 1.2rem;
          font-weight: bold;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
        }
        .list {
          overflow: auto;
          --mdc-icon-button-size: 1.5rem;
          --mdc-icon-size: 1rem;
        }
        *[selected] {
          color: var(--accent-color);
        }
        *[hide] {
          display: none;
        }
      `,
    ];
  }
}
