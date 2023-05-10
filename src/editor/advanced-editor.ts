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
      <dev-sonos-card-editor-form .schema=${ADVANCED_SCHEMA} .store=${this.store}></dev-sonos-card-editor-form>
    `;
  }
}

customElements.define('dev-sonos-card-advanced-editor', AdvancedEditor);
