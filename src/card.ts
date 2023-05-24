import { HomeAssistant } from 'custom-card-helpers';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import Store from './store';
import { CardConfig, Section } from './types';
import { listenForEntityId, stopListeningForEntityId } from './utils';
import './components/footer';
import './editor/editor';
import { CALL_MEDIA_DONE, CALL_MEDIA_STARTED, SHOW_SECTION } from './constants';
import { when } from 'lit/directives/when.js';
import { styleMap } from 'lit-html/directives/style-map.js';

const { GROUPING, GROUPS, MEDIA_BROWSER, PLAYER, VOLUMES } = Section;

export class Card extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @state() section!: Section;
  @state() store!: Store;
  @state() showLoader!: boolean;
  @state() loaderTimestamp!: number;
  @state() cancelLoader!: boolean;

  render() {
    this.store = new Store(this.hass, this.config);
    const height = 40;
    const footerHeight = 5;
    const sections = this.config.sections;
    const showFooter = !sections || sections.length > 1;
    const contentHeight = showFooter ? height - footerHeight : height;
    const title = this.config.title;

    return html`
      <ha-card style="${this.haCardStyle(height)}">
        <div class="loader" ?hidden="${!this.showLoader}">
          <ha-circular-progress active="" progress="0"></ha-circular-progress>
        </div>
        <div style="${this.contentStyle(contentHeight)}">
          ${title ? html`<div style="${this.titleStyle()}">${title}</div>` : html``}
          ${choose(this.section, [
            [PLAYER, () => html` <sonos-player .store=${this.store}></sonos-player>`],
            [GROUPS, () => html` <sonos-groups .store=${this.store}></sonos-groups>`],
            [GROUPING, () => html`<sonos-grouping .store=${this.store}></sonos-grouping>`],
            [MEDIA_BROWSER, () => html` <sonos-media-browser .store=${this.store}></sonos-media-browser>`],
            [VOLUMES, () => html` <sonos-volumes .store=${this.store}></sonos-volumes>`],
          ])}
        </div>
        ${when(
          showFooter,
          () =>
            html`<sonos-footer
              style=${this.headerStyle(footerHeight)}
              .config="${this.config}"
              .section="${this.section}"
            >
            </sonos-footer>`,
        )}
      </ha-card>
    `;
  }

  getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement('sonos-card-editor');
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(SHOW_SECTION, (event: Event) => {
      const section = (event as CustomEvent).detail;
      if (!this.config.sections || this.config.sections.indexOf(section) > -1) {
        this.section = section;
      }
    });

    window.addEventListener(CALL_MEDIA_STARTED, (event: Event) => {
      if (!this.showLoader && (!this.config.sections || (event as CustomEvent).detail.section === this.section)) {
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

    listenForEntityId(this.entityIdListener);
  }

  entityIdListener = (event: Event) => {
    const newEntityId = (event as CustomEvent).detail.entityId;
    if (newEntityId !== this.store.entityId) {
      this.store.updateEntity(newEntityId);
      this.requestUpdate();
    }
  };

  disconnectedCallback() {
    stopListeningForEntityId(this.entityIdListener);
    super.disconnectedCallback();
  }

  haCardStyle(height: number) {
    const confWidth = this.config.widthPercentage;
    let width = 40;
    if (confWidth) {
      if (confWidth < 50 || confWidth > 100) {
        console.error('widthPercentage must be between 50 and 100');
      } else {
        width = (confWidth / 100) * width;
      }
    }
    return styleMap({
      color: 'var(--secondary-text-color)',
      height: `${height}rem`,
      minWidth: `20rem`,
      maxWidth: `${width}rem`,
    });
  }

  headerStyle(height: number) {
    return styleMap({
      height: height + 'rem',
      paddingBottom: '1rem',
    });
  }

  private contentStyle(height: number) {
    return styleMap({
      overflowY: 'auto',
      height: `${height}rem`,
    });
  }

  private titleStyle() {
    return styleMap({
      margin: '0.5rem 0',
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: 'larger',
      color: 'var(--secondary-text-color)',
    });
  }

  setConfig(config: CardConfig) {
    const newConfig = JSON.parse(JSON.stringify(config));
    for (const [key, value] of Object.entries(newConfig)) {
      if (Array.isArray(value) && value.length === 0) {
        delete newConfig[key];
      }
    }
    const sections = newConfig.sections;
    if (sections) {
      this.section = sections[0];
    } else {
      this.section = PLAYER;
    }
    this.config = newConfig;
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
          --mdc-theme-primary: var(--accent-color);
        }
      `,
    ];
  }
}
