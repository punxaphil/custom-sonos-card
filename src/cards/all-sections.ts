import { mdiArrowLeft, mdiPlayBoxMultiple, mdiSpeakerMultiple, mdiSquareEditOutline } from '@mdi/js';
import { HomeAssistant } from 'custom-card-helpers';
import { html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { titleStyle } from '../sharedStyle';
import Store from '../store';
import { CardConfig, Section } from '../types';
import { sharedStyle, stylable, validateConfig } from '../utils';
const { GROUPING, GROUPS, MEDIA_BROWSER, PLAYER } = Section;

export class AllSections extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @state() section = PLAYER;
  @state() store!: Store;

  render() {
    this.store = new Store(this.hass, this.config);
    return html`
      <ha-card style="${this.haCardStyle()}">
        <div style="${this.titleStyle()}">${this.config.name}</div>
        <div style=${this.sectionButtonsStyle()}>
          ${this.section !== PLAYER ? this.sectionButton(mdiArrowLeft, PLAYER) : ''}
          ${this.section === PLAYER ? this.sectionButton(mdiSpeakerMultiple, GROUPS) : ''}
          ${this.section === GROUPS ? this.sectionButton(mdiSquareEditOutline, GROUPING) : ''}
          ${this.section === PLAYER ? this.sectionButton(mdiPlayBoxMultiple, MEDIA_BROWSER) : ''}
        </div>
        ${choose(this.section, [
          [PLAYER, () => html` <sonos-player .store=${this.store}></sonos-player>`],
          [GROUPS, () => html` <sonos-groups .store=${this.store}></sonos-groups>`],
          [GROUPING, () => html`<sonos-grouping .store=${this.store}></sonos-grouping>`],
          [MEDIA_BROWSER, () => html` <sonos-media-browser .store=${this.store}></sonos-media-browser>`],
        ])}
      </ha-card>
    `;
  }
  haCardStyle() {
    return stylable('ha-card', this.config, {
      color: 'var(--sonos-int-color)',
      background: 'var(--sonos-int-ha-card-background-color)',
      width: '30rem',
      height: '30rem',
      overflowY: 'auto',
    });
  }

  sectionButtonsStyle() {
    return stylable('section-buttons', this.config, {
      position: 'absolute',
      'z-index': '1000',
      ...((this.section === PLAYER || this.section === GROUPS) && {
        width: '100%',
        display: 'flex',
        'justify-content': 'space-between',
      }),
    });
  }

  sectionButton(icon: string, section: Section) {
    return html`<ha-icon-button
      @click="${() => (this.section = section)}"
      .path=${icon}
      .disabled=${this.section === section}
      style="${stylable('section-button', this.config, {
        '--mdc-icon-button-size': '2rem',
        '--mdc-icon-size': '1.5rem',
      })}"
    ></ha-icon-button>`;
  }

  setConfig(config: CardConfig) {
    const parsed = JSON.parse(JSON.stringify(config));
    parsed.showAllSections = !parsed.singleSectionMode;
    validateConfig(parsed);
    this.config = parsed;
  }
  private titleStyle() {
    return stylable('title', this.config, { display: this.config.name ? 'block' : 'none', ...titleStyle });
  }

  static get styles() {
    return sharedStyle;
  }
}
