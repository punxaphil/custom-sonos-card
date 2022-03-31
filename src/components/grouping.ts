import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { PlayerGroups } from '../types';
import { CustomSonosCard } from '../main';
import { titleStyle } from '../sharedStyle';
import './grouping-buttons';

class Grouping extends LitElement {
  @property() main!: CustomSonosCard;
  @property() groups!: PlayerGroups;
  @property() mediaPlayers!: string[];

  render() {
    const config = this.main.config;
    return html`
      <div style="${this.main.buttonSectionStyle()}">
        <div style="${this.main.stylable('title', titleStyle)}">
          ${config.groupingTitle ? config.groupingTitle : 'Grouping'}
        </div>
        <sonos-grouping-buttons
          .main=${this.main}
          .groups=${this.groups}
          .mediaPlayers=${this.mediaPlayers}
        ></sonos-grouping-buttons>
      </div>
    `;
  }
}

customElements.define('sonos-grouping', Grouping);
