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
    type: 'integer',
    name: 'mediaBrowserItemsPerRow',
    default: 1,
    required: true,
    valueMin: 1,
    valueMax: 30,
  },
  {
    type: 'string',
    name: 'title',
  },
  {
    name: 'showVolumeUpAndDownButtons',
    selector: { boolean: {} },
  },
  {
    type: 'integer',
    name: 'widthPercentage',
    default: 100,
    required: true,
  },
  {
    type: 'integer',
    name: 'heightPercentage',
    default: 100,
    required: true,
  },
];

class GeneralEditor extends BaseEditor {
  protected render(): TemplateResult {
    return html`
      <sonos-card-editor-form
        .schema=${GENERAL_SCHEMA}
        .config=${this.config}
        .hass=${this.hass}
      ></sonos-card-editor-form>
    `;
  }
}

customElements.define('sonos-card-general-editor', GeneralEditor);
