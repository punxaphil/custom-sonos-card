import { HomeAssistant } from 'custom-card-helpers';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import Store from './store';
import { CardConfig, Section } from './types';
import { stylable, validateConfig } from './utils';
import './components/header';
import sharedStyle from './sharedStyle';
import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED, SHOW_SECTION } from './constants';

const { GROUPING, GROUPS, MEDIA_BROWSER, PLAYER, VOLUMES } = Section;

export class Card extends LitElement {
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
        <dev-sonos-header style=${this.headerStyle()} .config="${this.config}" .section="${this.section}">
        </dev-sonos-header>
        <div class="loader" ?hidden="${!this.showLoader}">
          <ha-circular-progress active="" progress="0"></ha-circular-progress>
        </div>
        <div style="${this.contentStyle()}">
          ${choose(this.section, [
            [PLAYER, () => html` <dev-sonos-player .store=${this.store}></dev-sonos-player>`],
            [GROUPS, () => html` <dev-sonos-groups .store=${this.store}></dev-sonos-groups>`],
            [GROUPING, () => html`<dev-sonos-grouping .store=${this.store}></dev-sonos-grouping>`],
            [MEDIA_BROWSER, () => html` <dev-sonos-media-browser .store=${this.store}></dev-sonos-media-browser>`],
            [VOLUMES, () => html` <dev-sonos-volumes .store=${this.store}></dev-sonos-volumes>`],
          ])}
        </div>
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
      height: `40rem`,
      minWidth: `20rem`,
      maxWidth: `40rem`,
    });
  }

  headerStyle() {
    return stylable('header', this.config, {
      height: '4rem',
    });
  }

  private contentStyle() {
    const isPlayer = this.section === Section.PLAYER;
    return stylable('content', this.config, {
      overflowY: 'auto',
      height: isPlayer ? '40rem' : '35rem',
      marginTop: isPlayer ? '-4rem' : '0',
    });
  }

  setConfig(config: CardConfig) {
    const parsed = JSON.parse(JSON.stringify(config));
    parsed.showAllSections = !parsed.singleSectionMode;
    validateConfig(parsed);
    this.config = parsed;
  }

  static get styles() {
    return [
      css`
        .loader {
          position: absolute;
          z-index: 1000;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          --mdc-theme-primary: var(--sonos-int-accent-color);
        }
      `,
      sharedStyle,
    ];
  }
}
