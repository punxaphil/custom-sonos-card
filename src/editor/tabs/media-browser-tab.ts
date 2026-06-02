import { css, html, TemplateResult } from 'lit';
import { BaseEditor } from '../base-editor';
import { FAVORITES_SUB_SCHEMA, HIDE_ITEMS_SCHEMA, MEDIA_BROWSER_SCHEMA, SHORTCUT_SUB_SCHEMA, SHOW_ONLY_ITEMS_SCHEMA } from '../schema/media-browser-schema';
import { MediaBrowserShortcut } from '../../types';

class MediaBrowserTab extends BaseEditor {
  protected render(): TemplateResult {
    const mediaBrowserConfig = this.config.mediaBrowser ?? {};
    const favoritesConfig = mediaBrowserConfig.favorites ?? {};
    const shortcutConfig = mediaBrowserConfig.shortcut ?? {};
    const exclude = favoritesConfig.exclude ?? [];
    const topItems = favoritesConfig.topItems ?? [];
    const showOnlyItems = mediaBrowserConfig.showOnlyItems ?? [];
    const hideItems = mediaBrowserConfig.hideItems ?? [];

    const mediaBrowserData = {
      ...mediaBrowserConfig,
      showOnlyItems: showOnlyItems.join(', '),
      hideItems: hideItems.join(', '),
    };
    const favoritesData = { ...favoritesConfig, exclude: exclude.join(', '), topItems: topItems.join(', ') };
    const shortcutData = { ...shortcutConfig };

    const hasShowOnly = showOnlyItems.length > 0;
    const hasHideItems = hideItems.length > 0;

    return html`
      <sonos-card-editor-form
        .schema=${MEDIA_BROWSER_SCHEMA}
        .config=${this.config}
        .hass=${this.hass}
        .data=${mediaBrowserData}
        .changed=${this.mediaBrowserChanged}
      ></sonos-card-editor-form>

      <div class="filter-fields">
        <div class=${hasHideItems ? 'disabled' : ''}>
          <sonos-card-editor-form
            .schema=${SHOW_ONLY_ITEMS_SCHEMA}
            .config=${this.config}
            .hass=${this.hass}
            .data=${mediaBrowserData}
            .changed=${this.mediaBrowserChanged}
          ></sonos-card-editor-form>
        </div>
        <div class=${hasShowOnly ? 'disabled' : ''}>
          <sonos-card-editor-form
            .schema=${HIDE_ITEMS_SCHEMA}
            .config=${this.config}
            .hass=${this.hass}
            .data=${mediaBrowserData}
            .changed=${this.mediaBrowserChanged}
          ></sonos-card-editor-form>
        </div>
      </div>

      <h3>Shortcut</h3>
      <sonos-card-editor-form
        .schema=${SHORTCUT_SUB_SCHEMA}
        .config=${this.config}
        .hass=${this.hass}
        .data=${shortcutData}
        .changed=${this.shortcutChanged}
      ></sonos-card-editor-form>

      <h3>Favorites</h3>
      <sonos-card-editor-form
        .schema=${FAVORITES_SUB_SCHEMA}
        .config=${this.config}
        .hass=${this.hass}
        .data=${favoritesData}
        .changed=${this.favoritesChanged}
      ></sonos-card-editor-form>

      <div class="yaml-note">
        The following needs to be configured using code (YAML):
        <ul>
          <li>customFavorites</li>
          <li>customThumbnails</li>
          <li>customThumbnailsIfMissing</li>
        </ul>
      </div>
    `;
  }

  private mediaBrowserChanged = (ev: CustomEvent) => {
    const changed = ev.detail.value;
    const showOnlyItems = changed.showOnlyItems?.split(/ *, */).filter(Boolean) ?? [];
    const hideItems = changed.hideItems?.split(/ *, */).filter(Boolean) ?? [];
    this.config = {
      ...this.config,
      mediaBrowser: {
        ...(this.config.mediaBrowser ?? {}),
        ...changed,
        showOnlyItems: showOnlyItems.length > 0 ? showOnlyItems : undefined,
        hideItems: showOnlyItems.length > 0 ? undefined : hideItems.length > 0 ? hideItems : undefined,
      },
    };
    this.configChanged();
  };

  private shortcutChanged = (ev: CustomEvent) => {
    const changed = ev.detail.value;
    const mediaBrowser = this.config.mediaBrowser ?? {};
    // Remove empty values to clean up config
    const shortcut = Object.fromEntries(
      Object.entries({
        ...(mediaBrowser.shortcut ?? {}),
        ...changed,
      }).filter(([, v]) => v !== '' && v !== undefined),
    );
    this.config = {
      ...this.config,
      mediaBrowser: {
        ...mediaBrowser,
        shortcut: Object.keys(shortcut).length > 0 ? (shortcut as unknown as MediaBrowserShortcut) : undefined,
      },
    };
    this.configChanged();
  };

  private favoritesChanged = (ev: CustomEvent) => {
    const changed = ev.detail.value;
    const mediaBrowser = this.config.mediaBrowser ?? {};
    this.config = {
      ...this.config,
      mediaBrowser: {
        ...mediaBrowser,
        favorites: {
          ...(mediaBrowser.favorites ?? {}),
          ...changed,
          exclude: changed.exclude?.split(/ *, */).filter(Boolean) ?? [],
          topItems: changed.topItems?.split(/ *, */).filter(Boolean) ?? [],
        },
      },
    };
    this.configChanged();
  };

  static get styles() {
    return css`
      h3 {
        margin: 20px 0 10px;
        font-size: 1.1em;
        border-bottom: 1px solid var(--divider-color);
        padding-bottom: 5px;
      }
      h3:first-child {
        margin-top: 0;
      }
      .yaml-note {
        margin-top: 20px;
      }
      .filter-fields .disabled {
        opacity: 0.4;
        pointer-events: none;
      }
    `;
  }
}

customElements.define('sonos-card-media-browser-tab', MediaBrowserTab);
