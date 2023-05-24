import { html, TemplateResult } from 'lit';
import { BaseEditor } from './base-editor';

export const ADVANCED_SCHEMA = [
  {
    name: 'shuffleFavorites',
    selector: { boolean: {} },
  },
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
];

class AdvancedEditor extends BaseEditor {
  protected render(): TemplateResult {
    return html`
      <sonos-card-editor-form .schema=${ADVANCED_SCHEMA} .store=${this.store}></sonos-card-editor-form>
      <p>
        The following needs to be configured using code (YAML): 
        <ul>
          <li>customSources</li>
          <li>customThumbnailIfMissing</li>
          <li>mediaBrowserTitlesToIgnore</li>
        </ul>
      </p>
    `;
  }
}

customElements.define('sonos-card-advanced-editor', AdvancedEditor);
