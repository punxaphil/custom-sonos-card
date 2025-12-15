import { html, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { BaseEditor, Schema } from '../base-editor';

type SectionKey = 'groups' | 'grouping' | 'volumes' | 'queue';

class SectionTab extends BaseEditor {
  @property({ attribute: false }) schema!: Schema[];
  @property() section!: SectionKey;

  protected render(): TemplateResult {
    return html`
      <sonos-card-editor-form
        .schema=${this.schema}
        .config=${this.config}
        .hass=${this.hass}
        .section=${this.section}
        .changed=${this.sectionChanged}
      ></sonos-card-editor-form>
    `;
  }

  private sectionChanged = (ev: CustomEvent) => {
    const changed = ev.detail.value;
    this.config = { ...this.config, [this.section]: { ...(this.config[this.section] ?? {}), ...changed } };
    this.configChanged();
  };
}

customElements.define('sonos-card-section-tab', SectionTab);
