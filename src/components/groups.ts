import { html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { PlayerGroups } from '../types';
import { CustomSonosCard } from '../main';
import { buttonSectionBackgroundStyle, titleStyle } from '../sharedStyle';
import './group';

class Groups extends LitElement {
  @property() main!: CustomSonosCard;
  @property() activePlayer!: string;
  @property() groups!: PlayerGroups;
  @property() mediaPlayers!: string[];

  render() {
    const config = this.main.config;
    return html`
      <div style="${this.main.stylable('button-section', buttonSectionBackgroundStyle)}">
        <div style="${this.main.stylable('title', titleStyle)}">
          ${config.groupsTitle ? config.groupsTitle : 'Groups'}
        </div>
        ${Object.values(this.groups).map(
          (group) =>
            html` <sonos-group .main=${this.main} .group=${group} .activePlayer="${this.activePlayer}"></sonos-group> `,
        )}
      </div>
    `;
  }
}

customElements.define('sonos-groups', Groups);
