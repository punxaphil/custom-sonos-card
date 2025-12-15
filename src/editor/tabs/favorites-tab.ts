import { css, html, TemplateResult } from 'lit';
import { BaseEditor } from '../base-editor';
import { FAVORITES_SCHEMA } from '../schema/favorites-schema';

class FavoritesTab extends BaseEditor {
  protected render(): TemplateResult {
    const favoritesConfig = this.config.favorites ?? {};
    const topItems = favoritesConfig.topItems ?? [];
    const exclude = favoritesConfig.exclude ?? [];
    const data = { ...favoritesConfig, topItems: topItems.join(', '), exclude: exclude.join(', ') };
    return html`
      <sonos-card-editor-form
        .schema=${FAVORITES_SCHEMA}
        .config=${this.config}
        .hass=${this.hass}
        .data=${data}
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

  private favoritesChanged = (ev: CustomEvent) => {
    const changed = ev.detail.value;
    this.config = {
      ...this.config,
      favorites: {
        ...(this.config.favorites ?? {}),
        ...changed,
        topItems: changed.topItems?.split(/ *, */).filter(Boolean) ?? [],
        exclude: changed.exclude?.split(/ *, */).filter(Boolean) ?? [],
      },
    };
    this.configChanged();
  };

  static get styles() {
    return css`
      .yaml-note {
        margin-top: 20px;
      }
    `;
  }
}

customElements.define('sonos-card-favorites-tab', FavoritesTab);
