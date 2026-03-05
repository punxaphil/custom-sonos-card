import { css, html, LitElement, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, Section } from '../types';
import { customEvent } from '../utils/utils';
import { SHOW_SECTION } from '../constants';
import { styleMap } from 'lit/directives/style-map.js';
import './icon-button';

export class SectionButton extends LitElement {
  @property({ attribute: false }) config!: CardConfig;
  @property() icon!: string;
  @property() section!: Section;
  @property() selectedSection!: Section;

  render() {
    const size = this.config.sectionButtonIconSize;
    const styles = size
      ? {
          '--icon-button-size': `${size}rem`,
          '--icon-size': `${size * 0.6}rem`,
        }
      : {};
    return html`<sonos-icon-button
      @click=${() => this.dispatchSection()}
      selected=${this.selectedSection === this.section || nothing}
      style=${styleMap(styles)}
    >
      <ha-icon .icon=${this.icon}></ha-icon>
    </sonos-icon-button>`;
  }

  private dispatchSection() {
    this.dispatchEvent(customEvent(SHOW_SECTION, this.section));
  }

  static get styles() {
    return css`
      :host > *[selected] {
        color: var(--accent-color);
      }
    `;
  }
}

customElements.define('sonos-section-button', SectionButton);
