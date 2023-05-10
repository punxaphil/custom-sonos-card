import { LitElement } from 'lit';
import { fireEvent, HomeAssistant } from 'custom-card-helpers';
import { property } from 'lit/decorators.js';
import { CardConfig } from '../types';
import { editorStyle } from './editor-utils';
import Store from '../store';

export abstract class BaseEditor extends LitElement {
  @property() config!: CardConfig;
  @property() hass!: HomeAssistant;
  @property() store!: Store;

  setConfig(config: CardConfig) {
    this.config = config;
  }
  static get styles() {
    return editorStyle;
  }

  protected configChanged() {
    fireEvent(this, 'config-changed', { config: this.config });
    this.requestUpdate();
  }
  protected dispatchClose() {
    return this.dispatchEvent(new CustomEvent('closed'));
  }
}
