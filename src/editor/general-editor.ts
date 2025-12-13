import { html, TemplateResult } from 'lit';
import { BaseEditor } from './base-editor';

const options = {
  player: 'Player',
  favorites: 'Favorites',
  groups: 'Groups',
  grouping: 'Grouping',
  volumes: 'Volumes',
  queue: 'Queue',
};
export const GENERAL_SCHEMA = [
  {
    type: 'multi_select',
    options: options,
    name: 'sections',
  },
  {
    type: 'select',
    options: Object.entries(options).map((entry) => entry),
    name: 'startSection',
  },
  {
    type: 'integer',
    name: 'favoritesItemsPerRow',
    default: 4,
    required: true,
    valueMin: 1,
    valueMax: 30,
  },
  {
    type: 'string',
    name: 'title',
  },
  {
    name: 'playerShowVolumeUpAndDownButtons',
    selector: { boolean: {} },
  },
  {
    name: 'playerShowFastForwardAndRewindButtons',
    selector: { boolean: {} },
  },
  {
    name: 'playerFastForwardAndRewindStepSizeSeconds',
    type: 'integer',
    default: 15,
    required: true,
  },
  {
    name: 'playerHideControlPowerButton',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideControlShuffleButton',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideControlPrevTrackButton',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideControlNextTrackButton',
    selector: { boolean: {} },
  },
  {
    name: 'playerHideControlRepeatButton',
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
  {
    type: 'integer',
    name: 'sectionButtonIconSize',
    default: 3,
    required: false,
    valueMin: 1,
    valueMax: 10,
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
