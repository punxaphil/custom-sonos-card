import { html, TemplateResult } from 'lit';
import { BaseEditor } from './base-editor';

export const GENERAL_SCHEMA = [
  {
    type: 'multi_select',
    options: {
      player: 'Player',
      'media browser': 'Media Browser',
      groups: 'Groups',
      grouping: 'Grouping',
      volumes: 'Volumes',
    },
    name: 'sections',
  },
  {
    type: 'string',
    name: 'name',
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
    type: 'integer',
    name: 'widthPercentage',
    default: 100,
    required: true,
    valueMin: 50,
    valueMax: 100,
  },
];

class GeneralEditor extends BaseEditor {
  protected render(): TemplateResult {
    return html`
      <dev-sonos-card-editor-form .schema=${GENERAL_SCHEMA} .store=${this.store}></dev-sonos-card-editor-form>
    `;
  }
}

customElements.define('dev-sonos-card-general-editor', GeneralEditor);
