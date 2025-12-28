import { css, html, TemplateResult } from 'lit';
import { BaseEditor } from '../base-editor';
import { FAVORITES_SUB_SCHEMA, MEDIA_BROWSER_SCHEMA } from '../schema/media-browser-schema';

class MediaBrowserTab extends BaseEditor {
  protected render(): TemplateResult {
    const mediaBrowserConfig = this.config.mediaBrowser ?? {};
    const favoritesConfig = mediaBrowserConfig.favorites ?? {};
    const exclude = favoritesConfig.exclude ?? [];
    const topItems = favoritesConfig.topItems ?? [];

    const mediaBrowserData = { ...mediaBrowserConfig };
    const favoritesData = { ...favoritesConfig, exclude: exclude.join(', '), topItems: topItems.join(', ') };

    return html`
      <sonos-card-editor-form
        .schema=${MEDIA_BROWSER_SCHEMA}
        .config=${this.config}
        .hass=${this.hass}
        .data=${mediaBrowserData}
        .changed=${this.mediaBrowserChanged}
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
    this.config = {
      ...this.config,
      mediaBrowser: {
        ...(this.config.mediaBrowser ?? {}),
        ...changed,
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
    `;
  }
}

customElements.define('sonos-card-media-browser-tab', MediaBrowserTab);
