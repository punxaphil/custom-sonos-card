import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { PlayerGroups } from '../types';
import { CustomSonosCard } from '../main';
import sharedStyle from '../sharedStyle';
import './grouping-buttons';

class Grouping extends LitElement {
  @property() main!: CustomSonosCard;
  @property() groups!: PlayerGroups;
  @property() mediaPlayers!: string[];

  render() {
    const config = this.main.config;
    const stylable = this.main.stylable;
    return html`
      <div class="button-section" style="${stylable('button-section')}">
        <div class="title" style="${stylable('title')}">
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

  static get styles() {
    return [sharedStyle, css``];
  }
}

customElements.define('sonos-grouping', Grouping);
