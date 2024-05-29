import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import Store from '../model/store';
import { MediaPlayer } from '../model/media-player';
import { listStyle, MEDIA_ITEM_SELECTED } from '../constants';
import { until } from 'lit-html/directives/until.js';
import { customEvent } from '../utils/utils';

export class Queue extends LitElement {
  @property() store!: Store;
  @state() activePlayer!: MediaPlayer;

  render() {
    this.activePlayer = this.store.activePlayer;

    return html`${until(
      this.store.hassService.getQueue(this.store.activePlayer).then(
        (queue) => html`
          <div class="title">${this.store.config.queueTitle ?? 'Play Queue'}</div>
          <sonos-media-list
            .store=${this.store}
            .items=${queue}
            .selected=${this.activePlayer.attributes.queue_position - 1}
            @item-selected=${this.onMediaItemSelected}
          ></sonos-media-list>
        `,
      ),
    )}`;
  }

  private onMediaItemSelected = (event: Event) => {
    const index = (event as CustomEvent).detail.index;
    this.store.hassService.playQueue(this.activePlayer, index);
    this.dispatchEvent(customEvent(MEDIA_ITEM_SELECTED));
  };

  static get styles() {
    return [
      listStyle,
      css`
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
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
          flex: 1;
          overflow: auto;
        }
      `,
    ];
  }
}
