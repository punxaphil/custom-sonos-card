import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import Store from '../../model/store';
import './queue-mass';
import './queue-sonos';

export class Queue extends LitElement {
  @property() store!: Store;

  render() {
    const isMusicAssistant = this.store.config.entityPlatform === 'music_assistant';
    return isMusicAssistant
      ? html`<sonos-queue-mass .store=${this.store}></sonos-queue-mass>`
      : html`<sonos-queue-sonos .store=${this.store}></sonos-queue-sonos>`;
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
    }
  `;
}
