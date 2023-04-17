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
import { iconButton } from './icon-button';

const { GROUPING, GROUPS, MEDIA_BROWSER, PLAYER } = Section;

class Header extends LitElement {
  @property() config!: CardConfig;
  @property() section!: Section;
  @state() browseCanPlay!: boolean;
  @state() browseMedia = true;
  @state() mediaBrowserDir!: string;

  render() {
    const title = this.config.name;
    const browseIcon = this.browseMedia
      ? mdiPlayBoxMultiple
      : this.mediaBrowserDir
      ? mdiArrowUpLeftBold
      : mdiStarOutline;
    return html`
      ${title ? html`<div style="${this.titleStyle()}">${title}</div>` : html``}
      ${this.section !== PLAYER ? this.sectionButton(mdiArrowLeft, PLAYER) : ''}
      ${this.section === PLAYER ? this.sectionButton(mdiSpeakerMultiple, GROUPS) : ''}
      ${this.section === GROUPS ? this.sectionButton(mdiSquareEditOutline, GROUPING) : ''}
      ${this.section === PLAYER ? this.sectionButton(mdiStarOutline, MEDIA_BROWSER) : ''}
      ${this.section === MEDIA_BROWSER && this.browseCanPlay ? this.button(mdiPlay, () => dispatchPlayDir()) : ''}
      ${this.section === MEDIA_BROWSER ? this.button(browseIcon, () => dispatchBrowseClicked()) : ''}
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(BROWSE_STATE, (event: Event) => {
      const detail = (event as CustomEvent).detail;
      this.browseCanPlay = detail.canPlay;
      this.browseMedia = !detail.browse;
      this.mediaBrowserDir = detail.currentDir;
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
    return iconButton(icon, click, this.config, {
      additionalStyle: { padding: '0.5rem' },
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
}

customElements.define('dev-sonos-header', Header);
