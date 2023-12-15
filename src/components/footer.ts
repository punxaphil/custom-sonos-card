import { css, html, LitElement, nothing } from 'lit';

import { property } from 'lit/decorators.js';
import { CardConfig, Section } from '../types';
import { dispatchShowSection } from '../utils/utils';
import { mdiCastVariant, mdiHome, mdiSpeakerMultiple, mdiStarOutline, mdiTune } from '@mdi/js';

const { GROUPING, GROUPS, MEDIA_BROWSER, PLAYER, VOLUMES } = Section;

class Footer extends LitElement {
  @property({ attribute: false }) config!: CardConfig;
  @property() section!: Section;

  render() {
    return html`
      <ha-icon-button
        hide=${this.hide(PLAYER)}
        .path=${mdiHome}
        @click="${() => dispatchShowSection(PLAYER)}"
        selected="${this.selected(PLAYER)}"
      ></ha-icon-button>
      <ha-icon-button
        hide=${this.hide(MEDIA_BROWSER)}
        .path=${mdiStarOutline}
        @click="${() => dispatchShowSection(MEDIA_BROWSER)}"
        selected="${this.selected(MEDIA_BROWSER)}"
      ></ha-icon-button>
      <ha-icon-button
        hide=${this.hide(GROUPS)}
        .path=${mdiSpeakerMultiple}
        @click="${() => dispatchShowSection(GROUPS)}"
        selected="${this.selected(GROUPS)}"
      ></ha-icon-button>
      <ha-icon-button
        hide=${this.hide(GROUPING)}
        .path=${mdiCastVariant}
        @click="${() => dispatchShowSection(GROUPING)}"
        selected="${this.selected(GROUPING)}"
      ></ha-icon-button>
      <ha-icon-button
        hide=${this.hide(VOLUMES)}
        .path=${mdiTune}
        @click="${() => dispatchShowSection(VOLUMES)}"
        selected="${this.selected(VOLUMES)}"
      ></ha-icon-button>
    `;
  }

  private selected(section: Section | typeof nothing) {
    return this.section === section || nothing;
  }

  private hide(searchElement: Section) {
    return (this.config.sections && !this.config.sections?.includes(searchElement)) || nothing;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: space-between;
      }
      :host > * {
        padding: 1rem;
      }
      :host > *[selected] {
        color: var(--accent-color);
      }
      :host > *[hide] {
        display: none;
      }
    `;
  }
}

customElements.define('sonos-footer', Footer);
