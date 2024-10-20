import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { listStyle, MEDIA_ITEM_SELECTED } from '../constants';
import { until } from 'lit-html/directives/until.js';
import { customEvent } from '../utils/utils';
import { mdiPlaylistEdit, mdiTrashCanOutline } from '@mdi/js';
import '../components/media-row';

export class Queue extends LitElement {
  @property() store!: Store;
  @state() activePlayer!: MediaPlayer;
  @state() editMode = false;

  render() {
    this.activePlayer = this.store.activePlayer;
    const selected = this.activePlayer.attributes.queue_position - 1;

    return html`${until(
      this.store.hassService.getQueue(this.store.activePlayer).then(
        (queue) => html`
          <div class="header">
            <div class="title">${this.store.config.queueTitle ?? 'Play Queue'}</div>
            <ha-icon-button
              .path=${mdiPlaylistEdit}
              @click=${this.toggleEditMode}
              selected=${this.editMode || nothing}
            ></ha-icon-button>
          </div>
          <div class="list">
            <mwc-list multi>
              ${queue.map((item, index) => {
                return html`
                  <sonos-media-row
                    @click=${() => this.onMediaItemSelected(index)}
                    .item=${item}
                    .selected=${selected !== undefined && selected === index}
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
              })}
            </mwc-list>
          </div>
        `,
      ),
    )}`;
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

  private async removeFromQueue(index: number) {
    await this.store.hassService.removeFromQueue(this.activePlayer, index);
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
          padding: 0.5rem;
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
