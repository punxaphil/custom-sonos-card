import { css, html, nothing, TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { BaseEditor } from './base-editor';
import { COMMON_SCHEMA } from './schema/common-schema';
import { PLAYER_SCHEMA } from './schema/player-schema';
import { FAVORITES_SCHEMA } from './schema/favorites-schema';
import { GROUPS_SCHEMA } from './schema/groups-schema';
import { GROUPING_SCHEMA } from './schema/grouping-schema';
import { VOLUMES_SCHEMA } from './schema/volumes-schema';
import { QUEUE_SCHEMA } from './schema/queue-schema';
import { isSonosCard } from '../utils/utils';

enum AdvancedTab {
  COMMON = 'Common',
  PLAYER = 'Player',
  FAVORITES = 'Favorites',
  GROUPS = 'Groups',
  GROUPING = 'Grouping',
  VOLUMES = 'Volumes',
  QUEUE = 'Queue',
}

class AdvancedEditor extends BaseEditor {
  @state() private activeTab = AdvancedTab.COMMON;

  protected render(): TemplateResult {
    const tabs = Object.values(AdvancedTab).filter((tab) => tab !== AdvancedTab.QUEUE || isSonosCard(this.config));
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
    return choose(this.activeTab, [
      [AdvancedTab.COMMON, () => this.renderForm(COMMON_SCHEMA)],
      [AdvancedTab.PLAYER, () => this.renderForm(PLAYER_SCHEMA, 'player')],
      [AdvancedTab.FAVORITES, () => this.renderFavoritesForm()],
      [AdvancedTab.GROUPS, () => this.renderForm(GROUPS_SCHEMA, 'groups')],
      [AdvancedTab.GROUPING, () => this.renderForm(GROUPING_SCHEMA, 'grouping')],
      [AdvancedTab.VOLUMES, () => this.renderForm(VOLUMES_SCHEMA, 'volumes')],
      [AdvancedTab.QUEUE, () => this.renderForm(QUEUE_SCHEMA, 'queue')],
    ]);
  }

  private renderForm(schema: unknown[], labelPrefix?: string) {
    return html`
      <sonos-card-editor-form
        .schema=${schema}
        .config=${this.config}
        .hass=${this.hass}
        .data=${this.config}
        .changed=${this.simpleChanged}
        .labelPrefix=${labelPrefix}
      ></sonos-card-editor-form>
    `;
  }

  private renderFavoritesForm() {
    const favoritesTopItems = this.config.favoritesTopItems ?? [];
    const data = { ...this.config, favoritesTopItems: favoritesTopItems.join(', ') };
    return html`
      <sonos-card-editor-form
        .schema=${FAVORITES_SCHEMA}
        .config=${this.config}
        .hass=${this.hass}
        .data=${data}
        .changed=${this.favoritesChanged}
        .labelPrefix=${'favorites'}
      ></sonos-card-editor-form>
      <div class="yaml-note">
        The following needs to be configured using code (YAML):
        <ul>
          <li>favoritesCustomFavorites</li>
          <li>favoritesCustomThumbnails</li>
          <li>favoritesCustomThumbnailsIfMissing</li>
          <li>favoritesToIgnore</li>
        </ul>
      </div>
    `;
  }

  protected simpleChanged(ev: CustomEvent): void {
    this.config = { ...this.config, ...ev.detail.value };
    this.configChanged();
  }

  protected favoritesChanged(ev: CustomEvent): void {
    const changed = ev.detail.value;
    this.config = {
      ...this.config,
      ...changed,
      favoritesTopItems: changed.favoritesTopItems?.split(/ *, */).filter(Boolean) ?? [],
    };
    this.configChanged();
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
      .yaml-note {
        margin-top: 20px;
      }
    `;
  }
}

customElements.define('sonos-card-advanced-editor', AdvancedEditor);
