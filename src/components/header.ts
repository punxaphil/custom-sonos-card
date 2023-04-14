import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { CardConfig, Section } from '../types';
import { dispatchBrowseClicked, dispatchPlayDir, dispatchShowSection, stylable } from '../utils';
import {
  mdiArrowLeft,
  mdiArrowUpLeftBold,
  mdiPlay,
  mdiPlayBoxMultiple,
  mdiSpeakerMultiple,
  mdiSquareEditOutline,
  mdiStarOutline,
} from '@mdi/js';
import { BROWSE_STATE } from '../constants';

const { GROUPING, GROUPS, MEDIA_BROWSER, PLAYER } = Section;

class Header extends LitElement {
  @property() config!: CardConfig;
  @property() section!: Section;
  @state() browseCanPlay!: boolean;
  @state() browseRoot = true;

  render() {
    const title = this.config.name;
    return html`
      ${title ? html`<div style="${this.titleStyle()}">${title}</div>` : html``}
      ${this.section !== PLAYER ? this.sectionButton(mdiArrowLeft, PLAYER) : ''}
      ${this.section === PLAYER ? this.sectionButton(mdiSpeakerMultiple, GROUPS) : ''}
      ${this.section === GROUPS ? this.sectionButton(mdiSquareEditOutline, GROUPING) : ''}
      ${this.section === PLAYER ? this.sectionButton(mdiStarOutline, MEDIA_BROWSER) : ''}
      ${this.section === MEDIA_BROWSER && this.browseCanPlay ? this.button(mdiPlay, () => dispatchPlayDir()) : ''}
      ${this.section === MEDIA_BROWSER
        ? this.button(this.browseRoot ? mdiPlayBoxMultiple : mdiArrowUpLeftBold, () => dispatchBrowseClicked())
        : ''}
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(BROWSE_STATE, (event: Event) => {
      const detail = (event as CustomEvent).detail;
      this.browseCanPlay = detail.canPlay;
      this.browseRoot = !detail.browse;
    });
  }

  private titleStyle() {
    return stylable('title', this.config, {
      margin: '0.5rem 0',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: 'larger',
      color: 'var(--sonos-int-title-color)',
    });
  }

  sectionButton(icon: string, section: Section) {
    return this.button(icon, () => dispatchShowSection(section));
  }

  private button(icon: string, click: () => void) {
    return html`<ha-icon-button
      @click="${click}"
      .path=${icon}
      style="${stylable('section-button', this.config, {
        '--mdc-icon-button-size': '2rem',
        '--mdc-icon-size': '1.5rem',
        padding: '0.3rem',
      })}"
    ></ha-icon-button>`;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: space-between;
      }
    `;
  }
}

customElements.define('dev-sonos-header', Header);
