import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { CardConfig } from '../types';
import { mdiArrowUpLeftBold, mdiPlay, mdiPlayBoxMultiple, mdiStarOutline } from '@mdi/js';
import { BROWSE_CLICKED, BROWSE_STATE, PLAY_DIR } from '../constants';
import { iconButton } from './icon-button';

class MediaBrowserHeader extends LitElement {
  @property() config!: CardConfig;
  @state() browseCanPlay!: boolean;
  @state() browseMedia = true;
  @state() mediaBrowserDir!: string;
  @state() title!: string;

  render() {
    const browseIcon = this.browseMedia
      ? mdiPlayBoxMultiple
      : this.mediaBrowserDir
      ? mdiArrowUpLeftBold
      : mdiStarOutline;
    return html`
      <div class="play">
        ${this.browseCanPlay
          ? iconButton(mdiPlay, () => window.dispatchEvent(new CustomEvent(PLAY_DIR)), {
              additionalStyle: { padding: '0.5rem' },
            })
          : ''}
      </div>
      <div class="title">${this.title}</div>
      ${iconButton(browseIcon, () => window.dispatchEvent(new CustomEvent(BROWSE_CLICKED)), {
        additionalStyle: { padding: '0.5rem', flex: '1', textAlign: 'right' },
      })}
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(BROWSE_STATE, (event: Event) => {
      const detail = (event as CustomEvent).detail;
      this.browseCanPlay = detail.canPlay;
      this.browseMedia = !detail.browse;
      this.mediaBrowserDir = detail.currentDir;
      this.title = detail.title;
    });
  }
  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: space-between;
      }
      .play {
        flex: 1;
      }
      .title {
        flex: 6;
        text-align: center;
        font-size: 1.2rem;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `;
  }
}

customElements.define('sonos-media-browser-header', MediaBrowserHeader);
