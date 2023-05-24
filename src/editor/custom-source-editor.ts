import { html, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseEditor } from './base-editor';

class CustomSourceEditor extends BaseEditor {
  @property() index!: number;

  protected render(): TemplateResult {
    return html``;
  }
}

customElements.define('sonos-card-custom-source-editor', CustomSourceEditor);
