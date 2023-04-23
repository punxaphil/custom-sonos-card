import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { CardConfig } from '../types';
import { dispatchBrowseClicked, dispatchPlayDir } from '../utils';
import { mdiArrowUpLeftBold, mdiPlay, mdiPlayBoxMultiple, mdiStarOutline } from '@mdi/js';
import { BROWSE_STATE } from '../constants';
import { iconButton } from './icon-button';
import { styleMap } from 'lit-html/directives/style-map.js';

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
      <div style="${styleMap({ flex: '1' })}">
        ${this.browseCanPlay
          ? iconButton(mdiPlay, () => dispatchPlayDir(), this.config, {
              additionalStyle: { padding: '0.5rem' },
            })
          : ''}
      </div>
      <div style="${this.titleStyle()}">${this.title}</div>
      ${iconButton(browseIcon, () => dispatchBrowseClicked(), this.config, {
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
    `;
  }

  private titleStyle() {
    return styleMap({
      flex: '6',
      textAlign: 'center',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
  }
}

customElements.define('dev-sonos-media-browser-header', MediaBrowserHeader);
