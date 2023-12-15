import { html, TemplateResult } from 'lit';
import { BaseEditor } from './base-editor';

export const ADVANCED_SCHEMA = [
  {
    name: 'hideGroupCurrentTrack',
    selector: { boolean: {} },
  },
  {
    name: 'dynamicVolumeSlider',
    selector: { boolean: {} },
  },

  {
    type: 'string',
    name: 'labelWhenNoMediaIsSelected',
  },
  {
    type: 'string',
    name: 'labelForTheAllVolumesSlider',
  },
  {
    type: 'string',
    name: 'artworkHostname',
  },
  {
    name: 'mediaBrowserShowTitleForThumbnailIcons',
    selector: { boolean: {} },
  },
  {
    type: 'string',
    name: 'topFavorites',
  },
  {
    type: 'integer',
    name: 'numberOfFavoritesToShow',
    valueMin: 1,
  },
];

class AdvancedEditor extends BaseEditor {
  protected render(): TemplateResult {
    const topFavorites = this.store.config.topFavorites ?? [];
    const data = { ...this.store.config, topFavorites: topFavorites.join(', ') };
    return html`
      <sonos-card-editor-form
        .schema=${ADVANCED_SCHEMA}
        .store=${this.store}
        .data=${data}
        .changed=${this.changed}
      ></sonos-card-editor-form>
      <div>
        The following needs to be configured using code (YAML):
        <ul>
          <li>customSources</li>
          <li>customThumbnail</li>
          <li>customThumbnailIfMissing</li>
          <li>mediaBrowserTitlesToIgnore</li>
        </ul>
      </div>
    `;
  }
  protected changed(ev: CustomEvent): void {
    const changed = ev.detail.value;
    this.config = {
      ...this.config,
      ...changed,
      topFavorites: changed.topFavorites.split(/ *, */),
    };
    this.configChanged();
  }
}

customElements.define('sonos-card-advanced-editor', AdvancedEditor);
