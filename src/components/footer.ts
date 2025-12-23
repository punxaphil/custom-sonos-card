import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { CardConfig, Section } from '../types';
import './section-button';
import { isSonosCard } from '../utils/utils';

const { GROUPING, GROUPS, MEDIA_BROWSER, PLAYER, VOLUMES, QUEUE } = Section;

class Footer extends LitElement {
  @property({ attribute: false }) config!: CardConfig;
  @property() section!: Section;

  render() {
    const icons = this.config.sectionButtonIcons;
    let sections: [Section, string][] = [
      [PLAYER, icons?.player ?? 'mdi:home'],
      [MEDIA_BROWSER, icons?.mediaBrowser ?? 'mdi:star-outline'],
      [GROUPS, icons?.groups ?? 'mdi:speaker-multiple'],
      [GROUPING, icons?.grouping ?? 'mdi:checkbox-multiple-marked-circle-outline'],
      [QUEUE, icons?.queue ?? 'mdi:queue-first-in-last-out'],
      [VOLUMES, icons?.volumes ?? 'mdi:tune'],
    ];
    if (!isSonosCard(this.config)) {
      sections = sections.filter(([section]) => section !== QUEUE);
    }
    sections = sections.filter(([section]) => !this.config.sections || this.config.sections?.includes(section));
    return html`
      ${sections.map(
        ([section, icon]) => html`
          <sonos-section-button
            .config=${this.config}
            .icon=${icon}
            .selectedSection=${this.section}
            .section=${section}
          ></sonos-section-button>
        `,
      )}
    `;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        justify-content: space-between;
      }
      :host > * {
        align-content: center;
      }
    `;
  }
}

customElements.define('sonos-footer', Footer);
