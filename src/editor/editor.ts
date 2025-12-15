import { css, html, nothing, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { Section } from '../types';
import { BaseEditor } from './base-editor';
import { GROUPS_SCHEMA } from './schema/groups-schema';
import { GROUPING_SCHEMA } from './schema/grouping-schema';
import { VOLUMES_SCHEMA } from './schema/volumes-schema';
import { QUEUE_SCHEMA } from './schema/queue-schema';
import { isSonosCard } from '../utils/utils';
import './tabs/common-tab';
import './tabs/player-tab';
import './tabs/favorites-tab';
import './tabs/section-tab';
import './form';

enum Tab {
  COMMON = 'Common',
  PLAYER = 'Player',
  FAVORITES = 'Favorites',
  GROUPS = 'Groups',
  GROUPING = 'Grouping',
  VOLUMES = 'Volumes',
  QUEUE = 'Queue',
}

class CardEditor extends BaseEditor {
  @state() private activeTab = Tab.COMMON;

  protected render(): TemplateResult {
    if (!this.config.sections || this.config.sections.length === 0) {
      this.config.sections = [Section.PLAYER, Section.VOLUMES, Section.GROUPS, Section.GROUPING, Section.FAVORITES];
      if (isSonosCard(this.config)) {
        this.config.sections.push(Section.QUEUE);
      }
    }
    const tabs = Object.values(Tab).filter((tab) => tab !== Tab.QUEUE || isSonosCard(this.config));
    return html`
      <div class="tabs-container">
        <ha-control-button-group>
          ${tabs.map(
            (tab) => html`
              <ha-control-button selected=${this.activeTab === tab || nothing} @click=${() => (this.activeTab = tab)}>
                ${tab}
              </ha-control-button>
            `,
          )}
        </ha-control-button-group>
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
      [Tab.FAVORITES, () => html`<sonos-card-favorites-tab .config=${c} .hass=${h}></sonos-card-favorites-tab>`],
      [Tab.GROUPS, () => t(GROUPS_SCHEMA, 'groups')],
      [Tab.GROUPING, () => t(GROUPING_SCHEMA, 'grouping')],
      [Tab.VOLUMES, () => t(VOLUMES_SCHEMA, 'volumes')],
      [Tab.QUEUE, () => t(QUEUE_SCHEMA, 'queue')],
    ]);
  }

  static get styles() {
    return css`
      .tabs-container {
        position: relative;
      }
      .tabs-container::after {
        content: '';
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 30px;
        background: linear-gradient(to right, transparent, var(--card-background-color, #fff));
        pointer-events: none;
      }
      ha-control-button[selected] {
        --control-button-background-color: var(--primary-color);
      }
      ha-control-button {
        white-space: nowrap;
      }
      ha-control-button-group {
        margin: 5px;
        overflow-x: auto;
        flex-wrap: nowrap;
        justify-content: flex-start;
        padding-right: 25px;
      }
    `;
  }
}

customElements.define('sonos-card-editor', CardEditor);
