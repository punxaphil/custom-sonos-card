import { HomeAssistant } from 'custom-card-helpers';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import Store from './model/store';
import { CardConfig, Section } from './types';
import './components/footer';
import './editor/editor';
import {
  ACTIVE_PLAYER_EVENT,
  CALL_MEDIA_DONE,
  CALL_MEDIA_STARTED,
  REQUEST_PLAYER_EVENT,
  SHOW_SECTION,
} from './constants';
import { when } from 'lit/directives/when.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { getHeight, getWidth } from './utils/utils';
import HassService from './services/hass-service';
import { until } from 'lit-html/directives/until.js';

const { GROUPING, GROUPS, MEDIA_BROWSER, PLAYER, VOLUMES } = Section;
const TITLE_HEIGHT = 2;
const FOOTER_HEIGHT = 5;

export class Card extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() config!: CardConfig;
  @state() section!: Section;
  @state() store!: Store;
  @state() showLoader!: boolean;
  @state() loaderTimestamp!: number;
  @state() cancelLoader!: boolean;
  @state() activePlayerId!: string;
  render() {
    let height = getHeight(this.config);
    const sections = this.config.sections;
    const showFooter = !sections || sections.length > 1;
    const contentHeight = showFooter ? height - FOOTER_HEIGHT : height;
    const title = this.config.title;
    height = title ? height + TITLE_HEIGHT : height;
    return html` ${until(
      this.createStore().then(() => this.renderWithStore(height, title, contentHeight, showFooter)),
      html``,
    )}`;
  }

  private renderWithStore(height: number, title: string | undefined, contentHeight: number, showFooter: boolean) {
    return html`
      <ha-card style="${this.haCardStyle(height)}">
        <div class="loader" ?hidden="${!this.showLoader}">
          <ha-circular-progress active="" progress="0"></ha-circular-progress>
        </div>
        ${title ? html` <div class="title">${title}</div>` : html``}
        <div class="content" style="${this.contentStyle(contentHeight)}">
          ${choose(this.section, [
            [PLAYER, () => html` <sonos-player .store=${this.store}></sonos-player>`],
            [GROUPS, () => html` <sonos-groups .store=${this.store}></sonos-groups>`],
            [GROUPING, () => html` <sonos-grouping .store=${this.store}></sonos-grouping>`],
            [MEDIA_BROWSER, () => html` <sonos-media-browser .store=${this.store}></sonos-media-browser>`],
            [VOLUMES, () => html` <sonos-volumes .store=${this.store}></sonos-volumes>`],
          ])}
        </div>
        ${when(
          showFooter,
          () =>
            html` <sonos-footer style=${this.footerStyle()} .config="${this.config}" .section="${this.section}">
            </sonos-footer>`,
        )}
      </ha-card>
    `;
  }

  private async createStore() {
    let entityId = this.config.entityId;
    const hassService = new HassService(this.hass, this.section);
    if (entityId && entityId.indexOf('{{') > -1) {
      entityId = await hassService.renderTemplate<string>(entityId);
    }
    this.config = { ...this.config, entityId };
    if (this.activePlayerId) {
      this.store = new Store(this.hass, this.config, hassService, this.activePlayerId);
    } else {
      this.store = new Store(this.hass, this.config, hassService);
      this.activePlayerId = this.store.activePlayer.id;
    }
  }

  getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement('sonos-card-editor');
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(SHOW_SECTION, this.showSectionListener);
    window.addEventListener(CALL_MEDIA_STARTED, this.callMediaStartedListener);
    window.addEventListener(CALL_MEDIA_DONE, this.callMediaDoneListener);
    listenForActivePlayer(this.activePlayerListener);
  }

  disconnectedCallback() {
    window.removeEventListener(SHOW_SECTION, this.showSectionListener);
    window.removeEventListener(CALL_MEDIA_STARTED, this.callMediaStartedListener);
    window.removeEventListener(CALL_MEDIA_DONE, this.callMediaDoneListener);
    stopListeningForActivePlayer(this.activePlayerListener);
    super.disconnectedCallback();
  }

  private showSectionListener = (event: Event) => {
    const section = (event as CustomEvent).detail;
    if (!this.config.sections || this.config.sections.indexOf(section) > -1) {
      this.section = section;
    }
  };

  private callMediaStartedListener = (event: Event) => {
    if (!this.showLoader && (!this.config.sections || (event as CustomEvent).detail.section === this.section)) {
      this.cancelLoader = false;
      setTimeout(() => {
        if (!this.cancelLoader) {
          this.showLoader = true;
          this.loaderTimestamp = Date.now();
        }
      }, 300);
    }
  };

  private callMediaDoneListener = () => {
    this.cancelLoader = true;
    const duration = Date.now() - this.loaderTimestamp;
    if (this.showLoader) {
      if (duration < 1000) {
        setTimeout(() => (this.showLoader = false), 1000 - duration);
      } else {
        this.showLoader = false;
      }
    }
  };

  activePlayerListener = (event: Event) => {
    const newEntityId = (event as CustomEvent).detail.entityId;
    if (newEntityId !== this.activePlayerId) {
      this.activePlayerId = newEntityId;
      this.requestUpdate();
    }
  };

  haCardStyle(height: number) {
    const width = getWidth(this.config);
    return styleMap({
      color: 'var(--secondary-text-color)',
      height: `${height}rem`,
      minWidth: `20rem`,
      maxWidth: `${width}rem`,
    });
  }

  footerStyle() {
    return styleMap({
      height: `${FOOTER_HEIGHT}rem`,
      paddingBottom: '1rem',
    });
  }

  private contentStyle(height: number) {
    return styleMap({
      overflowY: 'auto',
      height: `${height}rem`,
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
      this.section =
        sections.indexOf(PLAYER) > -1
          ? PLAYER
          : sections.indexOf(MEDIA_BROWSER) > -1
          ? MEDIA_BROWSER
          : sections.indexOf(GROUPS) > -1
          ? GROUPS
          : sections.indexOf(GROUPING) > -1
          ? GROUPING
          : VOLUMES;
    } else {
      this.section = PLAYER;
    }
    this.config = newConfig;
  }

  static get styles() {
    return css`
      .loader {
        position: absolute;
        z-index: 1000;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        --mdc-theme-primary: var(--accent-color);
      }
      .title {
        margin: 0.4rem 0;
        text-align: center;
        font-weight: bold;
        font-size: 1.2rem;
        color: var(--secondary-text-color);
      }
    `;
  }
}

function listenForActivePlayer(listener: EventListener) {
  window.addEventListener(ACTIVE_PLAYER_EVENT, listener);
  const event = new CustomEvent(REQUEST_PLAYER_EVENT, { bubbles: true, composed: true });
  window.dispatchEvent(event);
}

function stopListeningForActivePlayer(listener: EventListener) {
  window.removeEventListener(ACTIVE_PLAYER_EVENT, listener);
}
