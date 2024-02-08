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
    name: 'hideBrowseMediaButton',
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
    name: 'mediaBrowserTitle',
  },
  {
    type: 'string',
    name: 'artworkHostname',
  },
  {
    name: 'mediaBrowserHideTitleForThumbnailIcons',
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
  {
    name: 'showAudioInputFormat',
    selector: { boolean: {} },
  },
  {
    name: 'adjustVolumeRelativeToMainPlayer',
    selector: { boolean: {} },
  },
  {
    type: 'string',
    help: 'Override default fallback artwork image if artwork is missing for the currently selected media',
    name: 'fallbackArtwork',
  },
  {
    name: 'entitiesToIgnoreVolumeLevelFor',
    help: 'If you want to ignore volume level for certain players in the player section',
    selector: { entity: { multiple: true, filter: { domain: 'media_player' } } },
  },
  {
    name: 'replaceHttpWithHttpsForThumbnails',
    selector: { boolean: {} },
  },
  {
    type: 'integer',
    name: 'volumeStepSize',
    valueMin: 1,
  },
];

class AdvancedEditor extends BaseEditor {
  protected render(): TemplateResult {
    const topFavorites = this.config.topFavorites ?? [];
    const data = { ...this.config, topFavorites: topFavorites.join(', ') };
    return html`
      <sonos-card-editor-form
        .schema=${ADVANCED_SCHEMA}
        .config=${this.config}
        .hass=${this.hass}
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
