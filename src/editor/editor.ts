import { css, html, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';
import { Section } from '../types';
import { BaseEditor } from './base-editor';
import { GROUPS_SCHEMA } from './schema/groups-schema';
import { GROUPING_SCHEMA } from './schema/grouping-schema';
import { VOLUMES_SCHEMA } from './schema/volumes-schema';
import { QUEUE_SCHEMA } from './schema/queue-schema';
import { isSonosCard } from '../utils/utils';
import './tabs/common-tab';
import './tabs/player-tab';
import './tabs/media-browser-tab';
import './tabs/section-tab';
import './form';

enum Tab {
  COMMON = 'Common',
  PLAYER = 'Player',
  MEDIA_BROWSER = 'Media Browser',
  GROUPS = 'Groups',
  GROUPING = 'Grouping',
  VOLUMES = 'Volumes',
  QUEUE = 'Queue',
}

class CardEditor extends BaseEditor {
  @state() private activeTab = Tab.COMMON;

  private get tabs() {
    return Object.values(Tab).filter((tab) => tab !== Tab.QUEUE || isSonosCard(this.config));
  }

  private get activeTabIndex() {
    return this.tabs.indexOf(this.activeTab);
  }

  private scrollToActiveTab() {
    requestAnimationFrame(() => {
      const container = this.shadowRoot?.querySelector('.tabs-list');
      const activeButton = this.shadowRoot?.querySelector('.tab-button.active') as HTMLElement;
      if (container && activeButton) {
        activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }

  private navigatePrev = () => {
    const idx = this.activeTabIndex;
    if (idx > 0) {
      this.activeTab = this.tabs[idx - 1];
      this.scrollToActiveTab();
    }
  };

  private navigateNext = () => {
    const idx = this.activeTabIndex;
    if (idx < this.tabs.length - 1) {
      this.activeTab = this.tabs[idx + 1];
      this.scrollToActiveTab();
    }
  };

  protected render(): TemplateResult {
    if (!this.config) {
      return html``;
    }
    if (!this.config.sections || this.config.sections.length === 0) {
      this.config.sections = [Section.PLAYER, Section.VOLUMES, Section.GROUPS, Section.GROUPING, Section.MEDIA_BROWSER];
      if (isSonosCard(this.config)) {
        this.config.sections.push(Section.QUEUE);
      }
    }
    const tabs = this.tabs;
    const activeIndex = this.activeTabIndex;
    const showLeftArrow = activeIndex > 0;
    const showRightArrow = activeIndex < tabs.length - 1;

    return html`
      <div class="tabs-container">
        <ha-icon-button
          class="nav-arrow ${showLeftArrow ? '' : 'hidden'}"
          .path=${mdiChevronLeft}
          @click=${this.navigatePrev}
        ></ha-icon-button>
        <div class="tabs-list">
          ${tabs.map(
            (tab) => html`
              <button
                class="tab-button ${this.activeTab === tab ? 'active' : ''}"
                @click=${() => (this.activeTab = tab)}
              >
                ${tab}
              </button>
            `,
          )}
        </div>
        <ha-icon-button
          class="nav-arrow ${showRightArrow ? '' : 'hidden'}"
          .path=${mdiChevronRight}
          @click=${this.navigateNext}
        ></ha-icon-button>
      </div>
      ${this.renderTabContent()}
    `;
  }

  private renderTabContent() {
    const c = this.config,
      h = this.hass;
    const t = (s: unknown[], sec: string) =>
      html`<sonos-card-section-tab .schema=${s} .section=${sec} .config=${c} .hass=${h}></sonos-card-section-tab>`;
    return choose(this.activeTab, [
      [Tab.COMMON, () => html`<sonos-card-common-tab .config=${c} .hass=${h}></sonos-card-common-tab>`],
      [Tab.PLAYER, () => html`<sonos-card-player-tab .config=${c} .hass=${h}></sonos-card-player-tab>`],
      [
        Tab.MEDIA_BROWSER,
        () => html`<sonos-card-media-browser-tab .config=${c} .hass=${h}></sonos-card-media-browser-tab>`,
      ],
      [Tab.GROUPS, () => t(GROUPS_SCHEMA, 'groups')],
      [Tab.GROUPING, () => t(GROUPING_SCHEMA, 'grouping')],
      [Tab.VOLUMES, () => t(VOLUMES_SCHEMA, 'volumes')],
      [Tab.QUEUE, () => t(QUEUE_SCHEMA, 'queue')],
    ]);
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .tabs-container {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 0 10px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
      }
      .tabs-list {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        flex: 1;
        scrollbar-width: none;
        padding-bottom: 2px;
      }
      .tabs-list::-webkit-scrollbar {
        display: none;
      }
      .tab-button {
        height: 32px;
        border: none;
        background: transparent;
        color: var(--primary-text-color);
        font-size: 14px;
        cursor: pointer;
        border-radius: 4px;
        position: relative;
        padding: 0 8px;
        white-space: nowrap;
      }
      .tab-button:hover {
        background: var(--secondary-background-color);
      }
      .tab-button.active {
        color: var(--primary-color);
      }
      .tab-button.active::after {
        content: '';
        position: absolute;
        bottom: -3px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--primary-color);
      }
      .nav-arrow {
        --mdc-icon-button-size: 32px;
        --mdc-icon-size: 20px;
        color: var(--primary-color);
        flex-shrink: 0;
      }
      .nav-arrow.hidden {
        visibility: hidden;
      }
    `;
  }
}

customElements.define('sonos-card-editor', CardEditor);
