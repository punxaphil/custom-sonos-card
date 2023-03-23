import { mdiArrowLeft, mdiSpeakerMultiple, mdiSquareEditOutline, mdiStarOutline } from '@mdi/js';
import { HomeAssistant } from 'custom-card-helpers';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { titleStyle } from '../sharedStyle';
import Store from '../store';
import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED, CardConfig, Section, SHOW_SECTION } from '../types';
import { sharedStyle, stylable, validateConfig } from '../utils';

const { GROUPING, GROUPS, MEDIA_BROWSER, PLAYER, VOLUMES } = Section;

export class AllSections extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @state() section = PLAYER;
  @state() store!: Store;
  @state() showLoader!: boolean;
  @state() loaderTimestamp!: number;
  @state() cancelLoader!: boolean;

  render() {
    this.store = new Store(this.hass, this.config);
    return html`
      <ha-card style="${this.haCardStyle()}">
        <div style="${this.titleStyle()}">${this.config.name}</div>
        <div style=${this.sectionButtonsStyle()}>
          ${this.section !== PLAYER ? this.sectionButton(mdiArrowLeft, PLAYER) : ''}
          ${this.section === PLAYER ? this.sectionButton(mdiSpeakerMultiple, GROUPS) : ''}
          ${this.section === GROUPS ? this.sectionButton(mdiSquareEditOutline, GROUPING) : ''}
          ${this.section === PLAYER ? this.sectionButton(mdiStarOutline, MEDIA_BROWSER) : ''}
        </div>
        <div class="loader" ?hidden="${!this.showLoader}">
          <ha-circular-progress active="" progress="0"></ha-circular-progress>
        </div>
        ${choose(this.section, [
          [PLAYER, () => html` <dev-sonos-player .store=${this.store}></dev-sonos-player>`],
          [GROUPS, () => html` <dev-sonos-groups .store=${this.store}></dev-sonos-groups>`],
          [GROUPING, () => html`<dev-sonos-grouping .store=${this.store}></dev-sonos-grouping>`],
          [MEDIA_BROWSER, () => html` <dev-sonos-media-browser .store=${this.store}></dev-sonos-media-browser>`],
          [VOLUMES, () => html` <dev-sonos-volumes .store=${this.store}></dev-sonos-volumes>`],
        ])}
      </ha-card>
    `;
  }

  getCardSize() {
    return 3;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(SHOW_SECTION, (event: Event) => {
      this.section = (event as CustomEvent).detail;
    });

    window.addEventListener(CALL_MEDIA_STARTED, () => {
      if (!this.showLoader) {
        this.cancelLoader = false;
        setTimeout(() => {
          if (!this.cancelLoader) {
            this.showLoader = true;
            this.loaderTimestamp = Date.now();
          }
        }, 300);
      }
    });
    window.addEventListener(CALL_MEDIA_DONE, () => {
      this.cancelLoader = true;
      const duration = Date.now() - this.loaderTimestamp;
      if (this.showLoader) {
        if (duration < 1000) {
          setTimeout(() => (this.showLoader = false), 1000 - duration);
        } else {
          this.showLoader = false;
        }
      }
    });
  }
  haCardStyle() {
    return stylable('ha-card', this.config, {
      color: 'var(--sonos-int-color)',
      overflowY: 'auto',
      height: `40rem`,
    });
  }

  sectionButtonsStyle() {
    return stylable('section-buttons', this.config, {
      position: 'absolute',
      zIndex: '1000',
      padding: '.3rem 2%',
      ...((this.section === PLAYER || this.section === GROUPS) && {
        width: '96%',
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
    return [
      css`
        .loader {
          position: absolute;
          z-index: 1000;
          text-align: center;
          padding-top: 50%;
          width: 100%;
          height: 100%;
          --mdc-theme-primary: var(--sonos-int-accent-color);
        }
      `,
      sharedStyle,
    ];
  }
}
